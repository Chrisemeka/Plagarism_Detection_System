import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api';
import Toast from './Toast';

export default function ClassAssignments() {
  const { classCode } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fileError, setFileError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get(`/api/class/${classCode}/assignments/`);
        setAssignments(response.data);
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load assignments'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [classCode]);

  const validateFile = (file) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF or DOCX file.';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB.';
    }

    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const error = validateFile(file);
    
    if (error) {
      setFileError(error);
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
    }
  };

  const handleSubmitClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!selectedFile || !currentAssignment) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post(`/api/assignments/${currentAssignment.id}/submit/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setIsModalOpen(false);
      setSelectedFile(null);
      setShowConfirmation(false);
      setNotification({
        type: 'success',
        message: 'Assignment submitted successfully!'
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to submit assignment. Please try again.'
      });
    } finally {
      setUploading(false);
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-600 mt-1">Class Code: {classCode}</p>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.map((assignment) => {
            const isDeadlinePassed = new Date(assignment.deadline) < new Date();
            
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
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Deadline</span>
                      <p className="font-medium">
                        {new Date(assignment.deadline).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status</span>
                      <p className="font-medium">
                        {isDeadlinePassed ? 'Deadline passed' : 'Open for submission'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {!isDeadlinePassed && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setCurrentAssignment(assignment);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Submit Assignment
                    </button>
                  </div>
                )}
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

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="fixed inset-0 backdrop-blur-sm bg-black/30" 
            onClick={() => !uploading && setIsModalOpen(false)}
          ></div>
          
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Submit Assignment</h2>
              <button 
                onClick={() => !uploading && setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmitClick();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="block w-full text-sm text-gray-500 
                    file:mr-4 file:py-2 file:px-4 
                    file:rounded-full file:border-0 
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700 
                    hover:file:bg-blue-100"
                  required
                />
                {fileError && (
                  <p className="mt-2 text-xs text-red-500">
                    {fileError}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Accepted formats: PDF, DOCX (Max size: 10MB)
                </p>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 disabled:bg-gray-300 
                  disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30"></div>
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative z-50">
            <h3 className="text-lg font-semibold mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit this assignment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}