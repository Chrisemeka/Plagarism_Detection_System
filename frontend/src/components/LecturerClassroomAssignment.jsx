import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import api from '../api';
import Toast from './common/Toast';
import PlagiarismAnalysis from '../components/Analytics/PlagiarismAnalysis'

export default function LecturerClassroomAssignment() {
  const navigate = useNavigate();
  const { classCode } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [currentCheckingId, setCurrentCheckingId] = useState(null);
  // const [showPlagiarismAnalysis, setShowPlagiarismAnalysis] = useState(false);

  const fetchSubmissionCount = useCallback(async (assignmentId, access) => {
    try {
      const response = await fetch(`http://localhost:8000/api/assignments/${assignmentId}/submit/`, {
        headers: {
          'Authorization': `Bearer ${access}`
        }
      });
      if (response.ok) {
        const submissions = await response.json();
        return submissions.length;
      }
      return 0;
    } catch (error) {
      console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
      return 0;
    }
  }, []);

  const fetchData = useCallback(async () => {
    const access = localStorage.getItem('access');
    if (!access) {
      navigate('/login');
      return;
    }

    try {
      const response = await api.get(`/api/class/${classCode}/assignments/`);
      const assignmentData = response.data;
      // console.log('Assignment Data:', assignmentData);

      // Fetch submission counts for each assignment
      const assignmentsWithCounts = await Promise.all(
        assignmentData.map(async (assignment) => {
          const submissionCount = await fetchSubmissionCount(assignment.id, access);
          return {
            ...assignment,
            submission_count: submissionCount
          };
        })
      );

      setAssignments(assignmentsWithCounts);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load assignments'
      });
    } finally {
      setLoading(false);
    }
  }, [classCode, fetchSubmissionCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlagiarismCheck = async (assignmentId) => {
    // console.log('Assignment ID:', assignmentId); // Log the assignmentId
    // if (!assignmentId) {
    //   console.error('Assignment ID is null or undefined');
    //   setNotification({
    //     type: 'error',
    //     message: 'Invalid assignment ID'
    //   });
    //   return;
    // }

    navigate(`/lecturer/classes/${classCode}/assignments/${assignmentId}/analysis`);
  
    // setCurrentCheckingId(assignmentId);
    // try {
    //   const response = await api.get(`/api/assignments/${assignmentId}/plagiarism-report/`);
    //   console.log('Plagiarism Report:', response.data);
    //   setShowPlagiarismAnalysis(true);
    //   setNotification({
    //     type: 'success',
    //     message: 'Plagiarism report retrieved successfully'
    //   });
    // } catch (error) {
    //   console.error('Error fetching plagiarism report:', error);
    //   const errorMessage = error.response?.data?.error || 'Failed to retrieve plagiarism report';
    //   setNotification({
    //     type: 'error',
    //     message: errorMessage
    //   });
    // } finally {
    //   setCurrentCheckingId(null);
    // }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Class Assignments</h2>
          <p className="text-gray-600 mt-1">Class Code: {classCode}</p>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.map((assignment) => {
            const isDeadlinePassed = new Date(assignment.deadline) < new Date();
            // console.log(assignment.deadline)
            const submissionCount = assignment.submission_count || 0;
            
            return (
              <div key={assignment.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                {/* Assignment Header */}
                <div className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      isDeadlinePassed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isDeadlinePassed ? 'Closed' : 'Active'}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{assignment.description}</p>
                </div>

                {/* Assignment Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-gray-500 text-sm">Deadline</span>
                    <p className="font-medium">
                      {new Date(assignment.deadline).toLocaleString('en-US', { timeZone: 'UTC' })
                    }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Submissions</span>
                    <p className="font-medium flex items-center">
                      <FileText size={16} className="mr-1" />
                      {submissionCount} {submissionCount === 1 ? 'submission' : 'submissions'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Status</span>
                    <p className="font-medium">
                      {isDeadlinePassed ? 'Deadline passed' : 'Open for submission'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <button
                    onClick={() => handlePlagiarismCheck(assignment.id)}
                    disabled={currentCheckingId === assignment.id || submissionCount === 0}
                    className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg
                      hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    {currentCheckingId === assignment.id ? 'Checking...' : 'Check Plagiarism'}
                  </button>
                  
                  {/* <button
                    onClick={() => window.location.href = `/lecturer/assignments/${assignment.id}/submissions`}
                    disabled={submissionCount === 0}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors
                      disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    View Submissions {submissionCount > 0 ? `(${submissionCount})` : ''}
                  </button> */}
                </div>
              </div>
            );
          })}

          {assignments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">No assignments available</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

    {/* {showPlagiarismAnalysis && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
          {console.log(currentCheckingId)}
          <PlagiarismAnalysis assignmentId={currentCheckingId} onClose={() => setShowPlagiarismAnalysis(false)} />
        </div>
      </div>
    )} */}
    </div>
  );
}