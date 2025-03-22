import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Book, Copy, Check } from 'lucide-react';

export default function LecturerClass({ refreshTrigger }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  const fetchAssignmentCount = async (classCode, access) => {
    try {
      const response = await fetch(`http://localhost:8000/api/class/${classCode}/assignments/`, {
        headers: {
          'Authorization': `Bearer ${access}`,
        },
      });
      
      if (response.ok) {
        const assignments = await response.json();
        return assignments.length;
      }
      return 0;
    } catch (error) {
      console.error(`Error fetching assignments for class ${classCode}:`, error);
      return 0;
    }
  };

  const fetchStudentCount = async (classCode, access) => {
    try {
      const response = await fetch(`http://localhost:8000/api/class/${classCode}/members/`, {
        headers: {
          'Authorization': `Bearer ${access}`,
        },
      });
      
      if (response.ok) {
        const members = await response.json();
        return members.length;
      }
      return 0;
    } catch (error) {
      console.error(`Error fetching members for class ${classCode}:`, error);
      return 0;
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      const access = localStorage.getItem('access');
      if (!access) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/class/classroom_list/', {
          headers: {
            'Authorization': `Bearer ${access}`,
          },
        });

        if (response.ok) {
          const classData = await response.json();
          
          // Fetch both assignment and student counts for each class
          const classesWithCounts = await Promise.all(
            classData.map(async (classItem) => {
              const [assignmentCount, studentCount] = await Promise.all([
                fetchAssignmentCount(classItem.code, access),
                fetchStudentCount(classItem.code, access)
              ]);
              
              return {
                ...classItem,
                assignment_count: assignmentCount,
                student_count: studentCount
              };
            })
          );
          
          setClasses(classesWithCounts);
          localStorage.setItem('classes', JSON.stringify(classesWithCounts));
        } else {
          console.error('Error fetching classes:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [refreshTrigger, navigate]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCode(code);
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedCode(null);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading classes...</div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <div className="text-gray-400 mb-4">
          <Book size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
        <p className="text-gray-600 mb-4">Create your first class to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem) => (
        <div 
          key={classItem.code} 
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          {/* Class Header */}
          <div className="p-6 border-b">
            <h4 className="text-lg font-semibold mb-2">{classItem.title}</h4>
            <div className="flex items-center">
              <p className="text-gray-600 mr-2">Code: {classItem.code}</p>
              <button 
                onClick={() => copyToClipboard(classItem.code)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                title="Copy code to clipboard"
              >
                {copiedCode === classItem.code ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 border-b">
            <div className="text-center">
              <div className="flex justify-center text-blue-600 mb-1">
                <Users size={20} />
              </div>
              <p className="text-sm text-gray-600">Students</p>
              <p className="font-semibold">{classItem.student_count || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center text-blue-600 mb-1">
                <FileText size={20} />
              </div>
              <p className="text-sm text-gray-600">Assignments</p>
              <p className="font-semibold">{classItem.assignment_count || 0}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 p-4">
            <button 
              onClick={() => navigate(`/lecturer/classes/${classItem.code}/assignments`)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Assignments
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}