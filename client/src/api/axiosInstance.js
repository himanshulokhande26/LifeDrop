import axios from "axios";

/**
 * Pre-configured Axios instance for all LifeDrop API calls.
 * The base URL is sourced from the Vite env variable VITE_API_BASE_URL.
 * Fall back to localhost:5000 in development.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — attach Authorization header if a token exists
// ---------------------------------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("lifeDropToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — centralised error logging
// ---------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    console.error(`API Error [${error.response?.status}]:`, message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
