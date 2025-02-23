// Import the Axios library for making HTTP requests
import axios from 'axios';

// Import the constant that stores the key name for the access token in localStorage
import { ACCESS_TOKEN } from './constants';

// Create a custom Axios instance with default configuration
const api = axios.create({
    // Set the base URL for all API requests using an environment variable
    baseURL: import.meta.env.VITE_API_URL,

    // Set default headers for all requests made with this Axios instance
    headers: {
        'Content-Type': 'application/json', // Specify that the request body will be JSON
    },
});

// Add a request interceptor to the Axios instance to add authentication headers automatically
api.interceptors.request.use((config) => {
    // Retrieve the access token from the browser's local storage
    const token = localStorage.getItem(ACCESS_TOKEN);

    // If the token exists, add it to the Authorization header as a Bearer token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Attach the JWT token for authentication
    }

    // Return the modified configuration to proceed with the request
    return config;    
},
(error) => {
    // Handle any errors that occur during the request
    return Promise.reject(error);
}
);

// Export the configured Axios instance for use in other parts of the application
export default api;
