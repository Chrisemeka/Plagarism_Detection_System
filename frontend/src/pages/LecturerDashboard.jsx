import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import LecturerSideBar from '../components/LecturerSideBar';
import LecturerClass from './LecturerClass';
import api from '../api';

// CreateClassForm Component (Modal Version)
function CreateClassModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/class/create/', formData);
      setFormData({ title: '' }); // Reset form
      onSuccess?.(); // Trigger refresh
      onClose(); // Close modal
    } catch (error) {
      alert(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative z-50">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Create New Class</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Title
            </label>
            <input
              type="text"
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter class title"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function LecturerDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

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

  const handleClassCreated = () => {
    setRefreshTrigger(prev => !prev); // Toggle to trigger refresh
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <LecturerSideBar />
      
      <div className="lg:ml-64 p-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-2xl text-gray-600">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{`${user?.first_name || ''} ${user?.last_name || ''}`}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-gray-500">{user?.department}</p>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">My Classes</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Create New Class</span>
            </button>
          </div>
          <LecturerClass refreshTrigger={refreshTrigger} />
        </div>

        {/* Create Class Modal */}
        <CreateClassModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleClassCreated}
        />
      </div>
    </div>
  );
}