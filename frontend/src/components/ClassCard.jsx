import { useNavigate } from 'react-router-dom';

export default function ClassCard({ classData }) {
  const { title, lecturer, code, created_at } = classData;
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/student/classes/${code}/assignments`);  // Navigate to assignments page using class code
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600">Lecturer: {lecturer}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
          {code}
        </span>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Joined: {new Date(created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}