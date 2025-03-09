import { useState, useEffect } from 'react';
import StudentClass from '../Student/StudentClass';
// import JoinClassForm from '../Student/JoinClassForm';
import { useNavigate } from 'react-router-dom';
import { Book, Plus, User } from 'lucide-react';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const access = localStorage.getItem('access');
      if (!access) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/profile/', {
          headers: {
            'Authorization': `Bearer ${access}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setLoading(false);
        } else if (response.status === 401) {
          const refreshToken = localStorage.getItem('REFRESH_TOKEN');
          if (refreshToken) {
            const refreshResponse = await fetch('http://localhost:8000/api/token/refresh/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (refreshResponse.ok) {
              const newTokens = await refreshResponse.json();
              localStorage.setItem('ACCESS_TOKEN', newTokens.access);
              localStorage.setItem('REFRESH_TOKEN', newTokens.refresh);
              return fetchUserData();
            }
          }
          navigate('/login');
        } else {
          setError('Failed to fetch user data');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('An error occurred while fetching user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
        <p>{error}</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-2 text-blue-500 hover:underline"
        >
          Return to login
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.first_name || 'Student'}
        </h1>
        <p className="text-gray-600">
          Here's an overview of your academic activities and class assignments.
        </p>
      </div>

      {/* Profile and Enrolled Classes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
              {user?.first_name?.[0] || ''}{user?.last_name?.[0] || ''}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{`${user?.first_name || ''} ${user?.last_name || ''}`}</h3>
              <p className="text-sm text-gray-600">{user?.email || ''}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Department</span>
              <span className="text-gray-900 font-medium">{user?.department || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Student ID</span>
              <span className="text-gray-900 font-medium">{user?.identifier || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Enrolled Classes Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Book className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Enrolled Classes</h2>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-bold text-gray-900 mb-2">5</h3>
            <p className="text-green-600">Active semester</p>
            <p className="mt-4 text-gray-600">You are currently enrolled in 5 classes for this semester.</p>
          </div>
        </div>
      </div>

      {/* Classes Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Book className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">My Classes</h2>
          </div>
          <button 
            onClick={() => navigate('/student/join-class')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Join Class
          </button>
        </div>
        
        <StudentClass />
      </div>

      {/* Join Class Modal */}
      {/* {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="fixed inset-0 backdrop-blur-sm bg-black/30" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Join a Class</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <JoinClassForm 
              onSuccess={() => {
                setIsModalOpen(false);
              }}
            />
          </div>
        </div>
      )} */}
    </>
  );
}