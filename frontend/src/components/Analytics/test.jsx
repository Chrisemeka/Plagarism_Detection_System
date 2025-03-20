import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';

const ComparisonView = ({ data, submission1, submission2, onClose }) => {
  // Make sure matching_segments exists and is an array
  const matching_segments = data?.matching_segments || [];

  // Convert matching segments to line ranges for highlighting
  const highlightLines = matching_segments.map(segment => ({
    start: segment.source_position[0],
    end: segment.source_position[1],
  }));

  // Calculate similarity percentage for display
  const similarityScore = data?.similarity_score || 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#d1dde6]">
      <h2 className="text-lg font-semibold text-[#0e161b] mb-4">
        Comparison: {submission1?.student_name || 'Student 1'} vs {submission2?.student_name || 'Student 2'}
      </h2>
      
      <button
        onClick={onClose}
        className="text-blue-600 hover:text-blue-800 mb-4"
      >
        &larr; Back to Analytics
      </button>
      
      {/* Key Metrics Panel */}
      <div className="bg-gray-50 p-4 mb-6 rounded-md border border-gray-200">
        <h3 className="text-md font-semibold mb-2">Plagiarism Analysis</h3>
        <div className="flex flex-col gap-2">
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
          <li><span className="bg-red-200 px-2 py-0.5 rounded">Red highlighted text</span> on the left shows content from {submission1?.student_name || 'Student 1'} that matches with {submission2?.student_name || 'Student 2'}.</li>
          <li><span className="bg-green-200 px-2 py-0.5 rounded">Green highlighted text</span> on the right shows content from {submission2?.student_name || 'Student 2'} that matches with {submission1?.student_name || 'Student 1'}.</li>
          <li>Text with <strong>no highlighting</strong> represents original content unique to each submission.</li>
          <li>Changes in wording, sentence structure, or synonyms may still indicate plagiarism if the ideas or structure are the same.</li>
        </ul>
      </div>
      
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <ReactDiffViewer
          oldValue={submission1?.fullText || "Content not available"}
          newValue={submission2?.fullText || "Content not available"}
          splitView={true}
          highlightLines={highlightLines}
          leftTitle={`${submission1?.student_name || 'Student 1'}'s Submission`}
          rightTitle={`${submission2?.student_name || 'Student 2'}'s Submission`}
        />
      </div>
    </div>
  );
};

export default ComparisonView;