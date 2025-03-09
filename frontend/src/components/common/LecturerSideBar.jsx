import { useState } from 'react';
import { Home, FileText, LogOut, Menu, BookOpen, PlusCircle, Book, Users } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function LecturerSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed p-4 lg:hidden z-50"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-lg w-64 transform transition-transform duration-200 ease-in-out z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

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
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}