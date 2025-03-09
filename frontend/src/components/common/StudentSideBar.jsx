import { useState } from 'react';
import { Home, BookOpen, FileText, Settings, LogOut, Menu, UserPlus, Book } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function StudentSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  
  // const handleLogout = () => {
  //   localStorage.clear(); // Clear all stored user data
  //   navigate('/login');
  // };

  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/student/dashboard' },
    { name: 'My Classes', icon: <BookOpen size={20} />, path: '/student/classes' },
    { name: 'Join Class', icon: <UserPlus size={20} />, path: '/student/join-class' },
    // { name: 'Assignments', icon: <FileText size={20} />, path: '/student/assignments' },
  ];

  // Function to check if a nav item is active
  const isActive = (path) => {
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
        {/* Logo or title */}
        {/* <div className="p-6 text-xl font-bold border-b flex items-center">
          <Book className="mr-2 text-blue-600" size={24} />
          <span>Plagiarism Checker</span>
        </div> */}

        {/* Navigation items */}
        <nav className="flex mt-20 flex-col justify-between h-[calc(100%-80px)]">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors
                  ${isActive(item.path) 
                    ? 'bg-[#e8eef3] text-[#1d8cd7] font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Logout at bottom */}
          {/* <div className="p-4 border-t">
            <button 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-red-500"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div> */}
        </nav>
      </div>
    </>
  );
}