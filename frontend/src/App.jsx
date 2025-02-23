// Import necessary modules from React and React Router
import react from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import page components for different routes
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import CreateClassForm from "./pages/CreateClassForm";

// Import the ProtectedRoute component to guard specific routes
import ProtectedRoutes from "./components/ProtectedRoutes";
import JoinClassForm from "./pages/JoinClassForm";
import CreateAssignment from "./pages/CreateAssignment";
import StudentDashboard from "./pages/StudentDashboard";
import StudentClass from "./pages/StudentClass";
import ClassAssignments from "./components/ClassAssignement";
import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerClassroomAssignment from "./components/LecturerClassroomAssignment";

// Function to handle user logout and clear localStorage
function Logout() {
  localStorage.clear(); // Clear all stored user data from localStorage
  return <Navigate to="/login" />; // Redirect to the login page
}

// Function to handle user registration and clear localStorage
function RegisterAndLogout() {
  localStorage.clear(); // Clear all stored user data from localStorage
  return <Register />; // Render the registration page
}

// Main application component
function App() {
  return (
    // Wrap the entire application in BrowserRouter to enable routing
    <BrowserRouter>
      {/* Define all application routes */}
      <Routes>
        {/* Route for the home page ("/"), protected by ProtectedRoute */}
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <Home /> {/* Only accessible to authorized users */}
            </ProtectedRoutes>
          }
        />

        {/* Route for the login page */}
        <Route path="/login" element={<Login key="login"/>} />

        {/* Route for the logout functionality */}
        <Route path="/logout" element={<Logout />} />

        {/* Route for the registration page with automatic logout */}
        <Route path="/register" element={<RegisterAndLogout />} />

        {/* Route for the class creation page */}
        <Route path="/create/class" element={
          <ProtectedRoutes>
            <CreateClassForm />
          </ProtectedRoutes>
          
          } />

          {/* Route for the class joining page */}
        <Route path="/join/class" element={
          <ProtectedRoutes>
            <JoinClassForm />
          </ProtectedRoutes>
          
          } />

            {/* Route for the creating assignment page */}
        <Route path="/create/assignment" element={
          <ProtectedRoutes>
            <CreateAssignment />
          </ProtectedRoutes>
          
          } />

        <Route path="/student" element={
          <ProtectedRoutes>
            <StudentDashboard />
          </ProtectedRoutes>
          } />

          <Route path="/lecturer" element={
          <ProtectedRoutes>
            <LecturerDashboard />
          </ProtectedRoutes>
          } />

        <Route path="/student/classes" element={
          <ProtectedRoutes>
            <StudentClass />
          </ProtectedRoutes>
          } />


        <Route path="/student/classes/:classCode/assignments" element=
        {
          <ProtectedRoutes>
            <ClassAssignments />
          </ProtectedRoutes>
        } />

        <Route path="/lecturer/classes/:classCode/assignments" element=
        {
          <ProtectedRoutes>
            <LecturerClassroomAssignment />
          </ProtectedRoutes>
        } />


        {/* Catch-all route for undefined paths, showing a 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Export the App component to be used in the application entry point
export default App;
