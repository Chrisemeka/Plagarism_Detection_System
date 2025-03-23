# utils.py
import random
import string
import docx
from PyPDF2 import PdfReader
import docx
import os
import re
from django.db import transaction
from .models import Classroom, ProcessedDocument

def generate_unique_code(length=6):
   """Generate unique classroom code"""
   characters = string.ascii_uppercase + string.digits
   while True:
       code = ''.join(random.choices(characters, k=length))
       # Check if code exists in Classroom model
       if not Classroom.objects.filter(code=code).exists():
           return code


class ProcessingError(Exception):
    pass

class DocumentProcessor:
    def __init__(self, k=5):
        self.k = k

    def extract_text(self, file_path):
        """Extract text based on file extension"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            return self._extract_from_pdf(file_path)
        elif file_extension in ['.docx', '.doc']:
            return self._extract_from_docx(file_path)
        else:
            raise ValueError("Unsupported file type")

    def _extract_from_pdf(self, file_path):
        with open(file_path, 'rb') as file:
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                print("Extracted page text:", page_text)  # Debug print
                text += page_text
            return text
    
    def _extract_from_docx(self, file_path):
        doc = docx.Document(file_path)
        text = ' '.join([paragraph.text for paragraph in doc.paragraphs])
        print("Extracted DOCX text:", text)  # Debug print
        return text
    
    def preprocess_text(self, text):
        """Clean and normalize text"""
        # Convert to lowercase
        text = text.lower()
        # Remove special characters
        text = re.sub(r'[^\w\s]', '', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text
    
    def generate_kgrams(self, text, k):
        words = text.split()
        if len(words) < k:
            return []  # Not enough words to generate k-grams
        kgrams = []
        for i in range(len(words) - k + 1):
            kgram = ' '.join(words[i:i+k])
            position = [i, i+k]  # Ensure start < end
            kgrams.append({
                'kgram': kgram,
                'position': position
            })
        return kgrams
    
    def hash_kgram(self, kgram):
        """Rolling hash implementation"""
        BASE = 101  # Prime number
        MOD = 2**64  # Large number for modulo
        
        hash_value = 0
        for char in kgram:
            hash_value = (hash_value * BASE + ord(char)) % MOD
        return hash_value
    
    def process_submission(self, submission):
        """Main processing function"""
        try:
            # Start transaction manually
            with transaction.atomic():
                # Extract text
                text = self.extract_text(submission.file.path)
                print("Extracted text:", text)
                
                # Preprocess
                processed_text = self.preprocess_text(text)
                print("Processed text:", processed_text)
                
                # Generate k-grams with positions
                kgrams = self.generate_kgrams(processed_text, self.k)
                print("Generated k-grams:", kgrams)
                
                # Generate fingerprints
                fingerprints = [
                    {
                        'hash': self.hash_kgram(kgram_data['kgram']),
                        'position': kgram_data['position'],
                        'text': kgram_data['kgram']
                    }
                    for kgram_data in kgrams
                ]
                print("Generated fingerprints:", fingerprints)
                
                # Store processed document
                processed_doc = ProcessedDocument.objects.create(
                    submission=submission,
                    processed_text=processed_text,
                    fingerprints=fingerprints,
                    status='completed'
                )
                
                # Update submission status
                submission.status = 'processed'
                submission.save()
                
                return True
                
        except Exception as e:
            print(f"Processing error: {str(e)}")
            submission.status = 'processing_failed'
            submission.save()
            raise ProcessingError(f"Failed to process document: {str(e)}")
        


class PlagiarismChecker:
    def __init__(self, similarity_threshold=0.3):
        self.similarity_threshold = similarity_threshold

    def compare_submissions(self, source_submission, target_submission):
        """
        Compare two submissions and calculate their similarity score and matching segments.
        """
        try:
            source_doc = ProcessedDocument.objects.get(submission=source_submission)
            target_doc = ProcessedDocument.objects.get(submission=target_submission)

            matching_segments = self.find_matching_segments(
                source_doc.fingerprints,
                target_doc.fingerprints
            )

            similarity_score = self.calculate_similarity(
                source_doc.fingerprints,
                target_doc.fingerprints,
                matching_segments
            )

            return {
                'similarity_score': similarity_score,
                'matching_segments': matching_segments
            }

        except ProcessedDocument.DoesNotExist:
            raise ValueError("One or both documents haven't been processed")

    def are_matches_adjacent(self, match1, match2, max_gap=2):
        """
        Check if two matches are adjacent or close enough to combine.
        """
        return (match2['source_position'][0] - match1['source_position'][1] <= max_gap and
                match2['target_position'][0] - match1['target_position'][1] <= max_gap)

    def consolidate_matches(self, matches):
        """
        Combine adjacent or overlapping matches into larger segments.
        """
        if not matches:
            return []

        consolidated = []
        current_match = matches[0]

        for match in matches[1:]:
            if self.are_matches_adjacent(current_match, match):
                # Extend current match
                current_match['source_position'][1] = match['source_position'][1]
                current_match['target_position'][1] = match['target_position'][1]
            else:
                consolidated.append(current_match)
                current_match = match

        consolidated.append(current_match)
        return consolidated

    def find_matching_segments(self, source_fingerprints, target_fingerprints):
        """
        Find matching segments between two sets of fingerprints.
        """
        matches = []
        source_hash_map = {fp['hash']: fp for fp in source_fingerprints}

        for target_fp in target_fingerprints:
            if target_fp['hash'] in source_hash_map:
                source_fp = source_hash_map[target_fp['hash']]
                # Ensure positions are valid (start < end)
                if (source_fp['position'][0] < source_fp['position'][1] and
                    target_fp['position'][0] < target_fp['position'][1]):
                    matches.append({
                        'source_position': source_fp['position'],
                        'target_position': target_fp['position'],
                        'text': source_fp['text']
                    })

        return self.consolidate_matches(matches)

    def calculate_similarity(self, source_fingerprints, target_fingerprints, matching_segments):
        """
        Calculate similarity score as percentage between 0 and 100.
        """
        if not source_fingerprints or not target_fingerprints:
            return 0.0

        # Calculate Jaccard similarity
        source_hashes = {fp['hash'] for fp in source_fingerprints}
        target_hashes = {fp['hash'] for fp in target_fingerprints}

        intersection = source_hashes.intersection(target_hashes)
        union = source_hashes.union(target_hashes)

        similarity = (len(intersection) / len(union)) * 100 if union else 0
        return min(max(similarity, 0), 100)  # Clamp between 0 and 100