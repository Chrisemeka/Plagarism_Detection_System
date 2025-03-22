import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Users, Calendar } from 'lucide-react';
import api from '../../api';

export default function StudentClass({ refreshTrigger }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
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

  // Store classes in localStorage whenever they change
  useEffect(() => {
    if (classes.length > 0) {
      localStorage.setItem('classes', JSON.stringify(classes));
    }
  }, [classes]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1d8cd7]"></div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#d1dde6] p-8 text-center">
        <div className="mx-auto h-12 w-12 text-[#507a95] mb-4">
          <BookOpen className="h-12 w-12" />
        </div>
        <h3 className="text-[#0e161b] text-lg font-medium">No classes joined yet</h3>
        <p className="text-[#507a95] mt-2 max-w-md mx-auto">
          You haven't joined any classes yet. Ask your instructor for a class code or join a class to get started.
        </p>
        <div className="mt-6">
          <Link
            to="/student/join-class"
            className="inline-flex items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1d8cd7] hover:bg-[#1d8cd7]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1d8cd7]"
          >
            Join a Class
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading outside the grid */}
      <h2 className="text-[#0e161b] tracking-light text-[32px] font-bold leading-tight">
        My Classes
      </h2>
      
      {/* Grid of class cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {classes.map(classItem => (
          <div 
            key={classItem.code} 
            className="bg-white rounded-lg border border-[#d1dde6] overflow-hidden flex flex-col"
          >
            {/* Class Header */}
            <div className="p-5 border-b border-[#d1dde6]">
              <div className="flex justify-between">
                <h3 className="text-[#0e161b] text-lg font-bold truncate">
                  {classItem.title}
                </h3>
              </div>
              <p className="text-[#507a95] text-sm mt-1">
                Lecturer: {classItem.lecturer}
              </p>
            </div>

            {/* Class Info */}
            <div className="px-5 py-3 border-b border-[#d1dde6]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-[#507a95] mr-2" />
                  <span className="text-[#0e161b] text-sm">
                    Class Code: {classItem.code}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-[#507a95] mr-2" />
                  <span className="text-[#0e161b] text-sm">
                    Students enrolled
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto p-3 flex gap-2">
              <button 
                onClick={() => navigate(`/student/classes/${classItem.code}/assignments`)}
                className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#1d8cd7] hover:bg-[#1d8cd7]/90"
              >
                View Assignments
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}