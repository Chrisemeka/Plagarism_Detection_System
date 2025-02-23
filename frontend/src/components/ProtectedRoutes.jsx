// Import the Navigate component for redirecting users and jwtDecode for decoding JWT tokens
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Import the custom Axios instance for making API requests
import api from "../api";

// Import constants for token keys used in localStorage
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";

// Import React hooks for managing state and side effects
import { useState, useEffect } from "react";

// Define the ProtectedRoute component to restrict access to authorized users
function ProtectedRoute({ children }) {
    // State to track whether the user is authorized
    const [isAuthorized, setIsAuthorized] = useState(null);

    // useEffect to trigger authentication checks when the component mounts
    useEffect(() => {
        auth().catch(() => setIsAuthorized(false)); // If an error occurs, set authorization to false
    }, []);

    // Function to refresh the access token using the refresh token
    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN); // Retrieve the refresh token from localStorage
        try {
            // Make a POST request to the token refresh endpoint with the refresh token
            const res = await api.post("/api/token/refresh/", {
                refresh: refreshToken,
            });

            if (res.status === 200) {
                // If the response is successful, update the access token in localStorage
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true); // Mark the user as authorized
            } else {
                setIsAuthorized(false); // If the response is not successful, mark as unauthorized
            }
        } catch (error) {
            console.log(error); // Log any errors for debugging
            setIsAuthorized(false); // Mark as unauthorized on error
        }
    };

    // Function to check the validity of the access token
    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN); // Retrieve the access token from localStorage
        if (!token) {
            setIsAuthorized(false); // If no token exists, mark as unauthorized
            return;
        }

        // Decode the token to get its payload
        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp; // Extract the expiration time
        const now = Date.now() / 1000; // Get the current time in seconds

        if (tokenExpiration < now) {
            // If the token is expired, attempt to refresh it
            await refreshToken();
        } else {
            setIsAuthorized(true); // If the token is valid, mark as authorized
        }
    };

    // If the authorization status is still being determined, show a loading state
    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    // If authorized, render the child components (protected content)
    // Otherwise, redirect to the login page
    return isAuthorized ? children : <Navigate to="/login" />;
}

// Export the component for use in other parts of the application
export default ProtectedRoute;
