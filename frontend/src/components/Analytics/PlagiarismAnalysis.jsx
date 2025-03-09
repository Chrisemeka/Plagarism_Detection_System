import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Add useNavigate for navigation
import { HistogramChart } from './HistogramChart';
import { SimilarityHeatMap } from './SimilarityHeatMap';
// import { SimilarityBoxPlot } from './SimilarityBoxPlot';
import { ComparisonView } from './ComparisonView';
import api from '../../api';

export default function PlagiarismAnalytics() {
  const { id: assignmentId } = useParams(); // Get assignmentId from the route
  const navigate = useNavigate(); // For navigation
  const [reportData, setReportData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [similarityMatrix, setSimilarityMatrix] = useState([]);
  const [selectedPair, setSelectedPair] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transform the report data into the format needed for visualizations
  useEffect(() => {
    if (!reportData) return;

    try {
      // Extract unique students from comparisons
      const studentMap = new Map();
      
      // Add each student from comparisons
      reportData.comparisons.forEach(comparison => {
        if (!studentMap.has(comparison.student1)) {
          studentMap.set(comparison.student1, {
            id: studentMap.size, // Generate an ID
            student_name: comparison.student1,
            similarity_score: 0,
            submission_date: reportData.check_date
          });
        }
        if (!studentMap.has(comparison.student2)) {
          studentMap.set(comparison.student2, {
            id: studentMap.size,
            student_name: comparison.student2,
            similarity_score: 0,
            submission_date: reportData.check_date
          });
        }
      });
      
      // Convert map to array
      const submissionsArray = Array.from(studentMap.values());
      
      // Build similarity matrix
      const matrix = Array(submissionsArray.length).fill().map(() => 
        Array(submissionsArray.length).fill(0)
      );
      
      // Fill matrix with similarity scores
      reportData.comparisons.forEach(comparison => {
        const id1 = [...studentMap.keys()].indexOf(comparison.student1);
        const id2 = [...studentMap.keys()].indexOf(comparison.student2);
        
        if (id1 >= 0 && id2 >= 0) {
          matrix[id1][id2] = comparison.similarity_score;
          matrix[id2][id1] = comparison.similarity_score; // Mirror the value
        }
      });
      
      // Fill diagonal with 100% (self-comparison)
      for (let i = 0; i < matrix.length; i++) {
        matrix[i][i] = 100;
      }
      
      // Calculate average similarity score for each submission (excluding self-comparison)
      submissionsArray.forEach((submission, index) => {
        let totalScore = 0;
        let count = 0;
        
        matrix[index].forEach((score, j) => {
          if (index !== j) { // Exclude self-comparison
            totalScore += score;
            count += 1;
          }
        });
        
        submission.similarity_score = count > 0 ? totalScore / count : 0;
      });
      
      setSubmissions(submissionsArray);
      setSimilarityMatrix(matrix);
    } catch (err) {
      console.error('Error transforming report data:', err);
      setError('Failed to process plagiarism data. Please try again.');
    }
  }, [reportData]);

  // Fetch plagiarism report data
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        // Fetch the plagiarism report for this assignment
        const response = await api.get(`/api/assignments/${assignmentId}/plagiarism-report/`);
        setReportData(response.data);
      } catch (err) {
        console.error('Error fetching plagiarism report:', err);
        setError('Failed to load plagiarism report. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [assignmentId]);

  // Handler for when a cell in the heat map is clicked
  // Update handlePairSelect in PlagiarismAnalytics.jsx
// const handlePairSelect = async (submissionIndex1, submissionIndex2) => {
//   if (submissionIndex1 === submissionIndex2) return; // Ignore self-comparisons
  
//   // Find the comparison data for these two submissions
//   const student1 = submissions[submissionIndex1].student_name;
//   const student2 = submissions[submissionIndex2].student_name;
  
//   // Look for this pair in the comparisons array
//   const comparison = reportData.comparisons.find(comp => 
//     (comp.student1 === student1 && comp.student2 === student2) ||
//     (comp.student1 === student2 && comp.student2 === student1)
//   );
  
//   if (comparison) {
//     try {
//       // Fetch the full document texts if they're not already in the comparison
//       // If your API doesn't provide this, you'll need to add this endpoint
//       const documentResponse = await api.get(
//         `/api/assignments/${assignmentId}/submissions-content/`, {
//           params: {
//             student1: student1,
//             student2: student2
//           }
//         }
//       );
      
//       setSelectedPair({
//         comparison,
//         submission1: {
//           ...submissions[submissionIndex1],
//           fullText: documentResponse.data.text1 || "Full text not available"
//         },
//         submission2: {
//           ...submissions[submissionIndex2],
//           fullText: documentResponse.data.text2 || "Full text not available"
//         }
//       });
//     } catch (error) {
//       console.error("Error fetching document content:", error);
//       // Fall back to just showing the segments
//       setSelectedPair({
//         comparison,
//         submission1: submissions[submissionIndex1],
//         submission2: submissions[submissionIndex2]
//       });
//     }
//   }
// };

  // In PlagiarismAnalytics.jsx - we need to modify the handlePairSelect function:

const handlePairSelect = async (submissionIndex1, submissionIndex2) => {
  if (submissionIndex1 === submissionIndex2) return; // Ignore self-comparisons
  
  // Find the comparison data for these two submissions
  const student1 = submissions[submissionIndex1].student_name;
  const student2 = submissions[submissionIndex2].student_name;
  
  // Look for this pair in the comparisons array
  const comparison = reportData.comparisons.find(comp => 
    (comp.student1 === student1 && comp.student2 === student2) ||
    (comp.student1 === student2 && comp.student2 === student1)
  );
  
  if (comparison) {
    try {
      // Fetch the full document texts
      const response = await api.get(`/api/assignments/${assignmentId}/document-comparison/`, {
        params: { student1, student2 }
      });
      
      setSelectedPair({
        comparison,
        submission1: {
          ...submissions[submissionIndex1],
          fullText: response.data.document1
        },
        submission2: {
          ...submissions[submissionIndex2],
          fullText: response.data.document2
        }
      });
    } catch (error) {
      console.error("Error fetching full documents:", error);
      // Fall back to just showing the comparison
      setSelectedPair({
        comparison,
        submission1: submissions[submissionIndex1],
        submission2: submissions[submissionIndex2]
      });
    }
  }
};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1d8cd7]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <p>{error}</p>
      </div>
    );
  }

  if (!reportData || reportData.comparisons.length === 0) {
    return (
      <div className="bg-blue-50 p-6 rounded-lg text-center">
        <h3 className="text-lg font-medium text-blue-700 mb-2">No Plagiarism Data Available</h3>
        <p className="text-blue-600">There are no submissions to analyze or the plagiarism check hasn't been run yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)} // Navigate back to the previous page
        className="text-blue-600 hover:text-blue-800"
      >
        &larr; Back to Assignments
      </button>

      {/* Assignment Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#d1dde6]">
        <h2 className="text-xl font-bold text-[#0e161b] mb-2">{reportData.assignment_title}</h2>
        <div className="flex flex-wrap gap-4 text-sm text-[#507a95]">
          <p>Total Submissions: {reportData.total_submissions}</p>
          <p>Deadline: {new Date(reportData.deadline).toLocaleString()}</p>
          <p>Check Date: {new Date(reportData.check_date).toLocaleString()}</p>
        </div>
      </div>

      {/* Similarity Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#d1dde6]">
        <h2 className="text-lg font-semibold text-[#0e161b] mb-4">Similarity Score Distribution</h2>
        <HistogramChart submissions={submissions} />
      </div>

      {/* Statistical Overview */}
      {/* <div className="bg-white rounded-lg shadow-sm p-6 border border-[#d1dde6]">
        <h2 className="text-lg font-semibold text-[#0e161b] mb-4">Statistical Overview</h2>
        <SimilarityBoxPlot submissions={submissions} />
      </div> */}

      {/* Similarity Matrix */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#d1dde6]">
        <h2 className="text-lg font-semibold text-[#0e161b] mb-4">Submission Similarity Matrix</h2>
        <p className="text-[#507a95] text-sm mb-4">
          Click on any cell to view a detailed comparison between two submissions.
        </p>
        <SimilarityHeatMap 
          matrix={similarityMatrix} 
          submissions={submissions} 
          onCellClick={handlePairSelect}
        />
      </div>

      {/* Most Similar Pairs */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#d1dde6]">
        <h2 className="text-lg font-semibold text-[#0e161b] mb-4">Most Similar Submission Pairs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student 2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Similarity Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.comparisons
                .sort((a, b) => b.similarity_score - a.similarity_score)
                .slice(0, 5) // Top 5 most similar pairs
                .map((comparison, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comparison.student1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comparison.student2}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          comparison.similarity_score > 70 ? 'bg-red-100 text-red-800' :
                          comparison.similarity_score > 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {comparison.similarity_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => {
                          const idx1 = submissions.findIndex(s => s.student_name === comparison.student1);
                          const idx2 = submissions.findIndex(s => s.student_name === comparison.student2);
                          if (idx1 >= 0 && idx2 >= 0) {
                            handlePairSelect(idx1, idx2);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Comparison
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison View */}
      {selectedPair && (
        <ComparisonView 
          data={selectedPair.comparison}
          submission1={selectedPair.submission1}
          submission2={selectedPair.submission2}
          onClose={() => setSelectedPair(null)}
        />
      )}
    </div>
  );
}