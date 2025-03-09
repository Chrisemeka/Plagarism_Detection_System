// Import necessary modules from React and React Router
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import page components for different routes
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import ProtectedRoutes from "./pages/auth/ProtectedRoutes";
import LecturerLayout from "./pages/Layout/LecturerLayout";
import StudentLayout from "./pages/Layout/StudentLayout";
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentClass from "./pages/Student/StudentClass";
// import JoinClassForm from "./components/common/JoinClassForm";
import ClassAssignments from "./components/ClassAssignement";
import LecturerDashboard from "./pages/Lecturer/LecturerDashboard";
import CreateClassForm from "./pages/Lecturer/CreateClassForm";
import CreateAssignment from "./pages/Lecturer/CreateAssignment";
import LecturerClassroomAssignment from "./components/LecturerClassroomAssignment";
import JoinClass from "./pages/Student/JoinClass";
import PlagiarismAnalytics from "./components/Analytics/PlagiarismAnalysis";

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
        {/* Public Routes */}
        <Route path="/login" element={<Login key="login" />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />

        {/* Redirect root to appropriate dashboard */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Student Routes - Grouped under StudentLayout */}
        <Route 
          path="/student" 
          element={
            <ProtectedRoutes>
              <StudentLayout />
            </ProtectedRoutes>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="join-class" element={<JoinClass />} />
          <Route path="classes" element={<StudentClass />} />
          <Route path="classes/:classCode/assignments" element={<ClassAssignments />} />
        </Route>

        {/* Lecturer Routes - Grouped under LecturerLayout */}
        <Route 
          path="/lecturer" 
          element={
            <ProtectedRoutes>
              <LecturerLayout />
            </ProtectedRoutes>
          }
        >
          <Route index element={<LecturerDashboard />} />
          <Route path="dashboard" element={<LecturerDashboard />} />
          <Route path="create-class" element={<CreateClassForm />} />
          <Route path="create-assignment" element={<CreateAssignment />} />
          <Route path="classes/:classCode/assignments" element={<LecturerClassroomAssignment />} />
          <Route path="classes/:classCode/assignments/:id/analysis" element={<PlagiarismAnalytics />} />
        </Route>

        {/* Catch-all route for undefined paths, showing a 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Export the App component to be used in the application entry point
export default App;