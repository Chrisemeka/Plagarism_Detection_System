import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function ComparisonView({ data, submission1, submission2, onClose }) {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
  if (!data || !data.matching_segments || !submission1 || !submission2) {
    return null;
  }
  
  const { matching_segments, similarity_score } = data;
  
  // Navigate between matches
  const handleNextMatch = () => {
    setCurrentMatchIndex((prev) => (prev + 1) % matching_segments.length);
  };
  
  const handlePrevMatch = () => {
    setCurrentMatchIndex((prev) => (prev - 1 + matching_segments.length) % matching_segments.length);
  };

  // Function to highlight matching segments in full text
  const renderHighlightedDocument = (fullText, positions) => {
    if (!fullText) {
      return <p className="text-gray-500">Document text not available</p>;
    }
    
    // If positions not available, just show the text
    if (!positions || positions.length === 0) {
      return <pre className="whitespace-pre-wrap text-sm">{fullText}</pre>;
    }
    
    // Create array of text chunks with highlights
    const textChunks = [];
    let lastIndex = 0;
    
    // Sort positions by start index
    const sortedPositions = [...positions].sort((a, b) => a[0] - b[0]);
    
    sortedPositions.forEach((pos, idx) => {
      const [start, length] = pos;
      const end = start + length;
      
      // Add non-matching text before this match
      if (start > lastIndex) {
        textChunks.push(
          <span key={`text-${idx}`}>{fullText.substring(lastIndex, start)}</span>
        );
      }
      
      // Add the highlighted matching text
      const isCurrentMatch = idx === currentMatchIndex;
      textChunks.push(
        <span 
          key={`match-${idx}`} 
          className={`${isCurrentMatch ? 'bg-yellow-300' : 'bg-yellow-100'} 
                      transition-colors duration-200`}
          onClick={() => setCurrentMatchIndex(idx)}
        >
          {fullText.substring(start, end)}
        </span>
      );
      
      lastIndex = end;
    });
    
    // Add any remaining text
    if (lastIndex < fullText.length) {
      textChunks.push(
        <span key="text-end">{fullText.substring(lastIndex)}</span>
      );
    }
    
    return (
      <pre className="whitespace-pre-wrap text-sm">
        {textChunks}
      </pre>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            Document Comparison - {Math.round(similarity_score)}% Similar
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        {/* Student info bar */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-medium">{submission1.student_name}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-medium">{submission2.student_name}</p>
          </div>
        </div>
        
        {/* Match navigation */}
        {matching_segments.length > 0 && (
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
            <button
              onClick={handlePrevMatch}
              className="flex items-center px-3 py-1 bg-white border rounded-md"
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous Match
            </button>
            <div className="text-sm">
              Match {currentMatchIndex + 1} of {matching_segments.length}
            </div>
            <button
              onClick={handleNextMatch}
              className="flex items-center px-3 py-1 bg-white border rounded-md"
            >
              Next Match
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        )}
        
        {/* Documents side by side */}
        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          <div className="border rounded-lg overflow-auto p-4 bg-gray-50 h-full">
            {renderHighlightedDocument(
              submission1.fullText,
              matching_segments.map(m => m.source_position)
            )}
          </div>
          <div className="border rounded-lg overflow-auto p-4 bg-gray-50 h-full">
            {renderHighlightedDocument(
              submission2.fullText,
              matching_segments.map(m => m.target_position)
            )}
          </div>
        </div>
        
        {/* Current match info */}
        <div className="mt-4 bg-yellow-50 p-3 rounded-lg text-sm">
          <p className="font-medium">Current Match:</p>
          <p className="mt-1">{matching_segments[currentMatchIndex]?.text || 'No text available'}</p>
        </div>
      </div>
    </div>
  );
}