import { Home, FileText, LogOut, Menu, BookOpen, PlusCircle, Book, Users } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function LecturerSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  
  const handleLogout = () => {
    localStorage.clear(); // Clear all stored user data
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/lecturer/dashboard' },
    { name: 'Create Class', icon: <PlusCircle size={20} />, path: '/lecturer/create-class' },
    { name: 'Create Assignment', icon: <FileText size={20} />, path: '/lecturer/create-assignment' },
    // { name: 'Analysis', icon: <BookOpen size={20} />, path: 'lecturer/classes/:classCode/assignments/:id/analysis' },
  ];

  // Function to check if a nav item is active
  const isActive = (path, name) => {
    // Special case for assignment routes
    if (name === 'Create Assignment' && location.pathname.includes('/classes/') && location.pathname.includes('/assignments')) {
      return true;
    }
    
    // Default case - exact match or sub-path
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed p-4 lg:hidden z-50"
      >
        <Menu size={24} />
      </button>

      {/* Navigation items */}
      <nav className="flex mt-20 flex-col justify-between h-[calc(100%-80px)]">
        <div className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors
                ${isActive(item.path, item.name) 
                  ? 'bg-[#e8eef3] text-[#1d8cd7] font-medium' 
                  : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        {/* Logout button at bottom */}
        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 p-3 rounded-lg w-full hover:bg-gray-100 text-gray-700"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}