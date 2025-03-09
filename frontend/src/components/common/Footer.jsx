import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white py-4 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <p className="text-sm text-gray-500">
            © {currentYear} Plagiarism Checker. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center justify-center text-sm text-gray-500">
          <p>Made with</p>
          <Heart className="h-4 w-4 mx-1 text-red-500" />
          <p>for academic integrity</p>
        </div>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
            Terms of Service
          </Link>
          <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;