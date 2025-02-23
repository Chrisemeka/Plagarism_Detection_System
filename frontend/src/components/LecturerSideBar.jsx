import { useState } from 'react';
import { Home, Users, FileText, Calendar,BookOpen,Settings, LogOut, Menu, School } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LecturerSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/lecturer/dashboard' },
    { name: 'My Classes', icon: <School size={20} />, path: '/lecturer/students' },
    { name: 'Assignments', icon: <FileText size={20} />, path: '/lecturer/assignments' },
  ];

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
        <div className="p-6 text-xl font-bold border-b">
          Lecturer Portal
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col justify-between h-[calc(100%-80px)]">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Logout at bottom */}
          <div className="p-4 border-t">
            <button 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-red-500"
              onClick={() => {/* Add logout logic */}}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}