import React, { useState, useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer';

const ComparisonView = ({ data, submission1, submission2, onClose }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Debug data received
  console.log("Comparison data:", data);
  console.log("Submission1:", submission1);
  console.log("Submission2:", submission2);

  // Make sure matching_segments exists and is an array
  const matching_segments = data?.matching_segments || [];

  // Calculate similarity percentage for display
  const similarityScore = data?.similarity_score || 0;

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 border border-[#d1dde6]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#0e161b] mb-2 sm:mb-0">
          Comparison
        </h2>
        
        <button
          onClick={onClose}
          className="text-blue-600 hover:text-blue-800 self-start"
        >
          &larr; Back to Analytics
        </button>
      </div>
      
      {/* Students being compared */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        <div className="bg-blue-50 px-3 py-2 rounded-md flex-1">
          <span className="text-sm text-gray-500">Student 1:</span>
          <div className="font-medium truncate">{submission1?.student_name || 'Student 1'}</div>
        </div>
        <div className="bg-green-50 px-3 py-2 rounded-md flex-1">
          <span className="text-sm text-gray-500">Student 2:</span>
          <div className="font-medium truncate">{submission2?.student_name || 'Student 2'}</div>
        </div>
      </div>
      
      {/* Key Metrics Panel */}
      <div className="bg-gray-50 p-4 mb-6 rounded-md border border-gray-200">
        <h3 className="text-md font-semibold mb-2">Plagiarism Analysis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span>Similarity Score:</span>
            <span className={`font-semibold ${
              similarityScore > 70 ? 'text-red-600' : 
              similarityScore > 40 ? 'text-amber-600' : 
              'text-green-600'
            }`}>
              {similarityScore.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Matching Segments:</span>
            <span>{matching_segments.length}</span>
          </div>
        </div>
      </div>
      
      {/* Color Guide */}
      <div className="bg-blue-50 p-4 mb-6 rounded-md border border-blue-200">
        <h3 className="text-md font-semibold mb-2">How to Read This Comparison:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><span className="bg-red-200 px-2 py-0.5 rounded">Red highlighted text</span> on the left shows content from {submission1?.student_name || 'Student 1'} that matches.</li>
          <li><span className="bg-green-200 px-2 py-0.5 rounded">Green highlighted text</span> on the right shows content from {submission2?.student_name || 'Student 2'} that matches.</li>
          <li>Text with <strong>no highlighting</strong> represents original content unique to each submission.</li>
        </ul>
      </div>
      
      {/* Diff Viewer with toggle for split/unified view on mobile */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="sticky top-0 z-10 bg-gray-100 p-2 border-b flex justify-between items-center">
          <div className="text-sm font-medium hidden sm:block">Submission Comparison</div>
          {isMobile && (
            <button
              onClick={() => setIsMobile(false)}
              className="text-xs bg-blue-600 text-white py-1 px-2 rounded"
            >
              Switch to Split View
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <ReactDiffViewer
            oldValue={submission1?.fullText || "Content not available"}
            newValue={submission2?.fullText || "Content not available"}
            splitView={!isMobile}
            useDarkTheme={false}
            leftTitle={`${submission1?.student_name || 'Student 1'}`}
            rightTitle={`${submission2?.student_name || 'Student 2'}`}
            styles={{
              contentText: {
                fontSize: '0.875rem',
                lineHeight: '1.5',
              },
              line: {
                wordBreak: 'break-word',
              },
              diffContainer: {
                maxWidth: '100%',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;