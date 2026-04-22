import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * --------------
 * Wraps any route that requires authentication.
 * Redirects to /auth if the user is not logged in.
 * Shows nothing while auth state is being hydrated from localStorage.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Still checking localStorage — render nothing to avoid flash
  if (loading) return null;

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
