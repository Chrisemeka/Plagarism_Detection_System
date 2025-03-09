import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  LogOut, 
  Menu, 
  User, 
  Bell,
  ChevronDown
} from 'lucide-react';
import { ACCESS_TOKEN } from '../../constants';

const Header = ({ toggleSidebar, userRole }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get user info from localStorage
    const firstName = localStorage.getItem('USER_FIRST_NAME');
    const lastName = localStorage.getItem('USER_LAST_NAME');
    
    if (firstName && lastName) {
      setUserName(`${firstName} ${lastName}`);
    } else {
      setUserName('User');
    }
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <header className="bg-white h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left section with menu button and logo */}
      <div className="flex items-center">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="text-gray-500 focus:outline-none focus:text-gray-600 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center ml-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-semibold text-gray-800">Plagiarism Checker</span>
        </Link>
      </div>

      {/* Right section with notifications and profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        {/* <button className="p-1 text-gray-400 hover:text-gray-600 relative">
          <Bell className="h-6 w-6" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button> */}

        {/* Profile dropdown */}
        <div className="relative profile-dropdown">
          <button 
            onClick={toggleProfileDropdown}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {userName.charAt(0)}
            </div>
            <span className="hidden md:inline-block font-medium">{userName}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Dropdown menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-sm text-gray-500 border-b">
                Signed in as <span className="font-medium text-gray-700 capitalize">{userRole}</span>
              </div>
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Your Profile
                </div>
              </Link>
              <Link
                to="/logout"
                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;