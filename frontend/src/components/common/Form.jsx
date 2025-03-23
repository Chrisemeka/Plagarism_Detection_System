import { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import LoadingIndicator from "./LoadingIndicator";
import image from "../../assets/images/auth_image.png"

function Form({ route, method }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    user_type: "student",
    department: "",
    identifier: ""
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notification, setNotification] = useState(null); // Changed from error to notification
  const navigate = useNavigate();
 
  const isLogin = method === "login";
 
  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const res = await api.post(route, formData);
      if (isLogin) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

        localStorage.setItem('USER_TYPE', res.data.user_type);
        localStorage.setItem('USER_FIRST_NAME', res.data.first_name);
        localStorage.setItem('USER_LAST_NAME', res.data.last_name);
        localStorage.setItem('USER_EMAIL', res.data.email);

        if (res.data.user_type === "lecturer") {
          navigate("/lecturer");
        } else {
          navigate("/student");
        }
      } else {
        navigate("/login");
      }
    } catch (error) {
      // Improved error handling
      console.error("Login error:", error);
      
      // Extract error message from the response
      let errorMessage = "An error occurred during authentication";
      
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        errorMessage = error.response.data.detail || "Authentication failed";
        console.log("Server error response:", error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      }
      
      // Set notification with the error message
      setNotification({
        message: errorMessage,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="flex min-h-screen">
      {/* Left side with actual background image and overlay - only visible on larger screens */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 relative">
        {/* Background image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${image})`,
        }}></div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white mb-4">
            {isLogin ? "Welcome Back!" : "Join a smarter way to check your papers!"}
          </h1>
          <p className="text-white text-xl">
            Our detection system helps students submit authentic work and gives lecturers clear, reliable reports.
          </p>
        </div>
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div className="max-w-md w-full px-6 py-8">
          <div className="text-center mb-8">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-600 mt-2">
              {isLogin ? "Please sign in to your account" : "Sign up for the plagiarism checker"}
            </p>
          </div>

          {/* Display inline error message */}
          {notification && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              {notification.message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              {/* Register Form */}
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="First Name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text" 
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Last Name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                    <select
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.user_type}
                      onChange={(e) => setFormData({...formData, user_type: e.target.value})}
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Department"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                  {formData.user_type === "student" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Matric Number (Optional)</label>
                      <input
                        type="text"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Matric Number e.g. 12/3456"
                        value={formData.identifier}
                        onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
   
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
              </div>
            )}
   
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {loading ? <LoadingIndicator /> : (isLogin ? "Sign in" : "Sign up")}
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"} 
              <a href={isLogin ? "/register" : "/login"} className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                {isLogin ? "Create an account" : "Sign in"}
              </a>
            </div>
            
            {!isLogin && (
              <div className="text-center text-xs text-gray-500 mt-4">
                By agreeing to create an account, you agree to the 
                <a href="#" className="text-blue-600 hover:text-blue-500 mx-1">terms of service</a> 
                and 
                <a href="#" className="text-blue-600 hover:text-blue-500 mx-1">privacy policy</a>, 
                including 
                <a href="#" className="text-blue-600 hover:text-blue-500 mx-1">cookie use</a>.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Form;