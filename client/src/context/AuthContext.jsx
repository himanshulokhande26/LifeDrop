import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

// ---------------------------------------------------------------------------
// Context Definition
// ---------------------------------------------------------------------------
const AuthContext = createContext(null);

/**
 * AuthProvider
 * ------------
 * Wraps the entire app. Provides auth state and actions to all children
 * without prop-drilling.
 *
 * State:
 *   user    : { id, name, bloodGroup, isAvailable, fcmToken } | null
 *   token   : JWT string | null
 *   loading : true while checking localStorage on mount (prevents flash)
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // Hydration guard

  // ---------------------------------------------------------------------------
  // On mount — restore session from localStorage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const savedToken = localStorage.getItem("lifeDropToken");
    const savedUser  = localStorage.getItem("lifeDropUser");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupt storage — clear it
        localStorage.removeItem("lifeDropToken");
        localStorage.removeItem("lifeDropUser");
      }
    }
    setLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** Called after a successful register or login API response */
  const saveSession = useCallback((tokenValue, userData) => {
    localStorage.setItem("lifeDropToken", tokenValue);
    localStorage.setItem("lifeDropUser",  JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }, []);

  /** Register a new account */
  const register = useCallback(async (formData) => {
    const response = await axiosInstance.post("/auth/register", formData);
    const { token: newToken, user: newUser } = response.data;
    saveSession(newToken, newUser);
    return response.data;
  }, [saveSession]);

  /** Log in with phone + password */
  const login = useCallback(async (credentials) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    const { token: newToken, user: newUser } = response.data;
    saveSession(newToken, newUser);
    return response.data;
  }, [saveSession]);

  /** Log out — clears state and localStorage */
  const logout = useCallback(() => {
    localStorage.removeItem("lifeDropToken");
    localStorage.removeItem("lifeDropUser");
    setToken(null);
    setUser(null);
  }, []);

  /** Toggle donor availability (calls PATCH /api/auth/availability) */
  const updateAvailability = useCallback(async (isAvailable) => {
    const response = await axiosInstance.patch("/auth/availability", { isAvailable });
    setUser((prev) => ({ ...prev, isAvailable: response.data.isAvailable }));
    localStorage.setItem("lifeDropUser", JSON.stringify({ ...user, isAvailable: response.data.isAvailable }));
    return response.data;
  }, [user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    register,
    login,
    logout,
    updateAvailability,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth — custom hook for consuming auth context.
 * Throws if used outside <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
