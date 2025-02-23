import { useState, useEffect } from 'react';
import StudentSidebar from '../components/StudentSidebar';
// import api from '../api';
import StudentClass from './StudentClass';
import JoinClassForm from './JoinClassForm';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        } else if (response.status === 401) {
          const refreshToken = localStorage.getItem('refresh');
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
              localStorage.setItem('access', newTokens.access);
              localStorage.setItem('refresh', newTokens.refresh);
              return fetchUserData();
            }
          }
          navigate('/login');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentSidebar />
      
      <div className="lg:ml-64 p-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-2xl text-gray-600">
                {user?.first_name[0]}{user?.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{`${user?.first_name} ${user?.last_name}`}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-gray-500">{user?.department}</p>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">My Classes</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Join Class
            </button>
          </div>
          <StudentClass refreshTrigger={isModalOpen} />
        </div>
      </div>

      {/* Join Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 backdrop-blur-sm bg-black/30" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
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
      )}
    </div>
  );
}