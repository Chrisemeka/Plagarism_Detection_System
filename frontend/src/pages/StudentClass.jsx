import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function StudentClass({ refreshTrigger }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/api/class/classroom_list/');
        setClasses(response.data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [refreshTrigger]);

  if (loading) return <div>Loading classes...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem) => (
        <div 
          key={classItem.code} 
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h4 className="text-lg font-semibold mb-2">{classItem.title}</h4>
          <p className="text-gray-600 mb-2">Code: {classItem.code}</p>
          <p className="text-sm text-gray-500">Lecturer: {classItem.lecturer}</p>
          <button 
            onClick={() => navigate(`/student/classes/${classItem.code}/assignments`)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            View Assignments →
          </button>
        </div>
      ))}
    </div>
  );
}