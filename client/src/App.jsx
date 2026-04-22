import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import AuthPage        from "./pages/AuthPage";
import DonorDashboard  from "./pages/DonorDashboard";
import CreateRequestForm from "./components/CreateRequestForm";

/**
 * App
 * ---
 * Route Map:
 *   /          → redirect to /dashboard
 *   /auth      → Login / Register (public)
 *   /dashboard → DonorDashboard (protected)
 *   /request   → CreateRequestForm (protected)
 *   *          → redirect to /
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request"
            element={
              <ProtectedRoute>
                <CreateRequestForm />
              </ProtectedRoute>
            }
          />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
