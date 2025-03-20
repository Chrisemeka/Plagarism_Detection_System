from django.shortcuts import render
import datetime
from django.utils import timezone
from rest_framework import generics, permissions
from.serializers import UserSerializer
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied
import os
import mimetypes
import docx  # python-docx
import PyPDF2
from .models import Classroom, ClassroomMembership, Assignment, AssignmentSubmission, ProcessedDocument
from .utils import DocumentProcessor, ProcessingError, PlagiarismChecker
from .permission import IsLecturerPermission
from .serializers import UserSerializer, ClassroomSerializer, ClassroomMembershipSerializer, JoinClassSerializer, AssignmentSerializer, AssignmentSubmissionSerializer, ClassroomMembershipSerializer, PlagiarismReportSerializer

class UserRegistrationView(generics.CreateAPIView):
   """
   API view handling user registration for both students and lecturers.
   Creates user accounts with appropriate role and profile information.
   """
   serializer_class = UserSerializer
   permission_classes = [AllowAny]  # Allows unauthenticated registration

   def perform_create(self, serializer):
       """
       Creates new user instance after validation.
       Args:
           serializer: Validated UserSerializer instance
       """
       serializer.save()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['user_type'] = user.user_type  # Assuming user_type is a field in your User model
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user_type to response data
        user = self.user
        data['user_type'] = user.user_type
        data['first_name'] = user.first_name
        data['last_name'] = user.last_name
        data['email'] = user.email
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)

class CreateClassroomView(generics.CreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(lecturer=self.request.user)

class JoinClassroomView(generics.CreateAPIView):
    # Uses CreateAPIView for handling POST requests to join a class
    serializer_class = JoinClassSerializer  # Uses our custom serializer
    permission_classes = [IsAuthenticated]  # Only logged-in users can access

    def get_serializer_context(self):
        # This method provides additional context to the serializer
        # We need this because our serializer needs access to the current user
        context = super().get_serializer_context()
        return context

    def post(self, request, *args, **kwargs):
        # Handles POST request to join class
        # First checks if user is a student
        if request.user.user_type != 'student':
            return Response(
                {"error": "Only students can join classes"},
                status=status.HTTP_403_FORBIDDEN
            )
        # If user is student, proceeds with normal create process
        return super().post(request, *args, **kwargs)

class ListClassroomsView(generics.ListAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'lecturer':
            return Classroom.objects.filter(lecturer=user)
        return Classroom.objects.filter(classroommembership__student=user)

class ListClassroomMembershipsView(generics.ListAPIView):
    """
    View for listing classroom memberships.
    GET: List all members of a specific classroom
    """
    serializer_class = ClassroomMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        classroom_code = self.kwargs.get('class_code')
        user = self.request.user

        if user.user_type == 'lecturer':
            # If lecturer, ensure they own the classroom before showing members
            return ClassroomMembership.objects.filter(
                classroom__code=classroom_code,
                classroom__lecturer=user
            )
        # If student, only show members if they're also a member
        return ClassroomMembership.objects.filter(
            classroom__code=classroom_code,
            classroom__classroommembership__student=user
        )
    
class CreateAssignmentView(generics.CreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsLecturerPermission]

    def perform_create(self, serializer):
        if self.request.user.user_type != 'lecturer':
            raise PermissionDenied("Only lecturers can create assignments")
        serializer.save()

class ListAssignmentsView(generics.ListAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        class_code = self.kwargs['class_code']  # Get class code from URL

        if user.user_type == 'lecturer':
            # Lecturers see assignments for their specific classroom
            return Assignment.objects.filter(
                classroom__lecturer=user,
                classroom__code=class_code
            )
        else:
            # Students see assignments from their enrolled specific class
            return Assignment.objects.filter(
                classroom__classroommembership__student=user,
                classroom__code=class_code
            )


class SubmitAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, assignment_id):
        try:
            # Get the assignment
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Check if user is the lecturer of this class
            if request.user != assignment.classroom.lecturer:
                return Response(
                    {"error": "You are not the lecturer of this class"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get all submissions for this assignment
            submissions = AssignmentSubmission.objects.filter(
                assignment=assignment
            ).order_by('-submitted_at')

            # Serialize the submissions using your existing serializer
            serializer = AssignmentSubmissionSerializer(submissions, many=True)
            
            return Response(serializer.data)

        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request, assignment_id):
        try:
            # Get the assignment
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Validate submission
            if assignment.deadline < timezone.now():
                return Response(
                    {"error": "Submission deadline has passed"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if student is enrolled
            if not ClassroomMembership.objects.filter(
                student=request.user,
                classroom=assignment.classroom
            ).exists():
                return Response(
                    {"error": "You are not enrolled in this class"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create or update submission
            submission, created = AssignmentSubmission.objects.get_or_create(
                student=request.user,
                assignment=assignment,
                defaults={'file': request.FILES['file']}
            )

            if not created:
                submission.file = request.FILES['file']
                submission.status = 'submitted'
                submission.save()

            # Process document
            try:
                processor = DocumentProcessor()
                processor.process_submission(submission)
            except ProcessingError as e:
                return Response({
                    "message": "Submission saved but processing failed",
                    "error": str(e)
                }, status=status.HTTP_202_ACCEPTED)

            return Response({
                "message": "Submission processed successfully",
                "submission_id": submission.id
            }, status=status.HTTP_201_CREATED)

        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PlagiarismReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, assignment_id):
        try:
            # Fetch the assignment
            assignment = Assignment.objects.get(id=assignment_id)

            # Check if the user is the lecturer of this class
            if not assignment.classroom.lecturer == request.user:
                return Response(
                    {"error": "Unauthorized access"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if the deadline has passed
            if timezone.now() < assignment.deadline:
                return Response(
                    {"error": "Cannot check plagiarism before deadline"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Fetch all submissions for the assignment
            submissions = AssignmentSubmission.objects.filter(
                assignment=assignment
            )

            # Initialize the PlagiarismChecker
            checker = PlagiarismChecker()
            comparison_results = []

            # Compare all pairs of submissions
            for idx, submission1 in enumerate(submissions):
                for submission2 in submissions[idx + 1:]:  # Compare each pair only once
                    result = checker.compare_submissions(submission1, submission2)
                    comparison_results.append({
                        'student1': f"{submission1.student.first_name} {submission1.student.last_name}",
                        'student2': f"{submission2.student.first_name} {submission2.student.last_name}",
                        'similarity_score': round(result['similarity_score'], 2),
                        'matching_segments': result['matching_segments']
                    })

            # Calculate additional metrics
            average_similarity = sum(
                comp['similarity_score'] for comp in comparison_results
            ) / len(comparison_results) if comparison_results else 0

            above_threshold_count = sum(
                1 for comp in comparison_results if comp['similarity_score'] > assignment.plagiarism_threshold
            )

            # Build the report
            report = {
                'assignment_title': assignment.title,
                'total_submissions': submissions.count(),
                'deadline': assignment.deadline,
                'average_similarity': round(average_similarity, 2),
                'above_threshold_count': above_threshold_count,
                'comparisons': comparison_results,
                'check_date': timezone.now()
            }

            # Serialize and return the report
            serializer = PlagiarismReportSerializer(report)
            return Response(serializer.data)

        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DocumentComparisonView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_plagiarism_report(self, request, assignment_id):
        """Get the plagiarism report using the same logic as PlagiarismReportView"""
        try:
            # Reuse the code from PlagiarismReportView
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Check if the user is the lecturer of this class
            if not assignment.classroom.lecturer == request.user:
                return Response(
                    {"error": "Unauthorized access"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if the deadline has passed
            if timezone.now() < assignment.deadline:
                return Response(
                    {"error": "Cannot check plagiarism before deadline"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fetch all submissions for the assignment
            submissions = AssignmentSubmission.objects.filter(
                assignment=assignment
            )
            
            # Initialize the PlagiarismChecker
            checker = PlagiarismChecker()
            comparison_results = []
            
            # Compare all pairs of submissions
            for idx, submission1 in enumerate(submissions):
                for submission2 in submissions[idx + 1:]:  # Compare each pair only once
                    result = checker.compare_submissions(submission1, submission2)
                    comparison_results.append({
                        'student1': f"{submission1.student.first_name} {submission1.student.last_name}",
                        'student2': f"{submission2.student.first_name} {submission2.student.last_name}",
                        'similarity_score': round(result['similarity_score'], 2),
                        'matching_segments': result['matching_segments']
                    })
            
            # Calculate additional metrics
            average_similarity = sum(
                comp['similarity_score'] for comp in comparison_results
            ) / len(comparison_results) if comparison_results else 0
            
            above_threshold_count = sum(
                1 for comp in comparison_results if comp['similarity_score'] > assignment.plagiarism_threshold
            )
            
            # Build the report
            report = {
                'assignment_title': assignment.title,
                'total_submissions': submissions.count(),
                'deadline': assignment.deadline,
                'average_similarity': round(average_similarity, 2),
                'above_threshold_count': above_threshold_count,
                'comparisons': comparison_results,
                'check_date': timezone.now()
            }
            
            return report
            
        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def extract_text_from_file(self, file_path):
        """Extract text from Word or PDF files"""
        # Determine file type by extension
        mime_type, _ = mimetypes.guess_type(file_path)
        
        # Handle different file types
        if mime_type == 'application/pdf':
            # Extract text from PDF using PyPDF2
            text = ""
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page_num in range(len(reader.pages)):
                    text += reader.pages[page_num].extract_text() + "\n"
            return text
            
        elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            # Extract text from DOCX using python-docx
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return '\n'.join(full_text)
            
        else:
            # For unsupported file types
            return f"Unsupported file type: {mime_type}. Only Word and PDF files are supported."
    
    def get(self, request, assignment_id):
        # Get student names from query parameters
        student1_name = request.query_params.get('student1')
        student2_name = request.query_params.get('student2')
        
        print(f"API request for comparison between: {student1_name} and {student2_name}")
        
        if not student1_name or not student2_name:
            return Response(
                {"error": "Both student1 and student2 parameters are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the assignment
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Check if user is authorized (is the lecturer of this classroom)
            if request.user != assignment.classroom.lecturer:
                return Response(
                    {"error": "You are not authorized to view these submissions"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all submissions for this assignment
            all_submissions = AssignmentSubmission.objects.filter(assignment=assignment)
            
            # Find exact matches for the student names first
            submission1 = None
            submission2 = None
            
            for sub in all_submissions:
                full_name = f"{sub.student.first_name} {sub.student.last_name}".lower()
                if full_name == student1_name.lower():
                    submission1 = sub
                elif full_name == student2_name.lower():
                    submission2 = sub
            
            # If exact matches weren't found, try partial matching
            if submission1 is None or submission2 is None:
                # Split the name into parts for more flexible matching
                student1_parts = student1_name.lower().split()
                student2_parts = student2_name.lower().split()
                
                # Find the first student's submission
                if submission1 is None:
                    for sub in all_submissions:
                        student_first = sub.student.first_name.lower()
                        student_last = sub.student.last_name.lower()
                        
                        # Check if any part of the provided name matches this student
                        if any(part in student_first or part in student_last for part in student1_parts):
                            submission1 = sub
                            break
                
                # Find the second student's submission
                if submission2 is None:
                    for sub in all_submissions:
                        student_first = sub.student.first_name.lower()
                        student_last = sub.student.last_name.lower()
                        
                        # Check if any part of the provided name matches this student
                        if any(part in student_first or part in student_last for part in student2_parts):
                            # Don't select the same submission twice
                            if not submission1 or sub.id != submission1.id:
                                submission2 = sub
                                break
            
            if not submission1 or not submission2:
                return Response(
                    {"error": f"Could not find submissions for {student1_name} or {student2_name}"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the full names of both students
            student1_full_name = f"{submission1.student.first_name} {submission1.student.last_name}"
            student2_full_name = f"{submission2.student.first_name} {submission2.student.last_name}"
            
            print(f"Found submissions for {student1_full_name} and {student2_full_name}")
            
            # Extract text from files
            try:
                document1_content = self.extract_text_from_file(submission1.file.path)
            except Exception as e:
                return Response(
                    {"error": f"Error reading file for {student1_full_name}: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            try:
                document2_content = self.extract_text_from_file(submission2.file.path)
            except Exception as e:
                return Response(
                    {"error": f"Error reading file for {student2_full_name}: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Get the plagiarism report directly from the API endpoint
            try:
                # Get the plagiarism report
                report_data = self.get_plagiarism_report(request, assignment_id)
                if isinstance(report_data, Response):
                    # If we got a Response object, extract the data or return the error
                    if report_data.status_code != 200:
                        return Response(
                            {"error": "Failed to fetch plagiarism report"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    report_data = report_data.data
                
                # Get the comparisons from the report
                comparisons = report_data.get('comparisons', [])
                
                print(f"Searching for comparison between {student1_full_name} and {student2_full_name}")
                print(f"Total comparisons found: {len(comparisons)}")
                
                # Find the comparison for these two students - look for an EXACT match
                comparison = None
                for comp in comparisons:
                    # Print each comparison for debugging
                    print(f"Checking comparison: {comp.get('student1')} vs {comp.get('student2')}")
                    
                    # Check for exact match (either order)
                    if ((comp.get('student1') == student1_full_name and comp.get('student2') == student2_full_name) or
                        (comp.get('student1') == student2_full_name and comp.get('student2') == student1_full_name)):
                        comparison = comp
                        print(f"Found exact match with similarity: {comp.get('similarity_score')}%")
                        break
                
                # If no exact match was found, create a default comparison
                if not comparison:
                    print(f"No comparison found for {student1_full_name} and {student2_full_name}, creating default")
                    comparison = {
                        'student1': student1_full_name,
                        'student2': student2_full_name,
                        'similarity_score': 0.0,
                        'matching_segments': []
                    }
                
                # Return the document contents and matching segments in the expected format
                return Response({
                    "document1": document1_content,
                    "document2": document2_content,
                    "comparison": comparison
                })
                
            except Exception as e:
                import traceback
                print(f"Error retrieving comparison data: {str(e)}")
                print(traceback.format_exc())
                return Response(
                    {"error": f"Error retrieving comparison data: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )