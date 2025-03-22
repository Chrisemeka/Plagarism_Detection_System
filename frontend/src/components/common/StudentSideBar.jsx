import { Home, BookOpen, FileText, Settings, LogOut, Menu, UserPlus, Book } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function StudentSidebar({ isOpen, setIsOpen }) {
  const location = useLocation(); // Get current location
  

  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/student/dashboard' },
    { name: 'My Classes', icon: <BookOpen size={20} />, path: '/student/classes' },
    { name: 'Join Class', icon: <UserPlus size={20} />, path: '/student/join-class' },
  ];

  // Function to check if a nav item is active
  const isActive = (path) => {
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
                ${isActive(item.path) 
                  ? 'bg-[#e8eef3] text-[#1d8cd7] font-medium' 
                  : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}