import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import AuthPage from "./pages/AuthPage";
import CreateRequestForm from "./components/CreateRequestForm";

/**
 * App
 * ---
 * Root component. Sets up:
 *   - AuthProvider   → global auth state available to all routes
 *   - BrowserRouter  → client-side routing
 *   - Route guards   → ProtectedRoute blocks unauthenticated access
 *
 * Route Map:
 *   /          → redirect to /dashboard
 *   /auth      → Login / Register (public)
 *   /dashboard → Donor dashboard placeholder (protected)  [Phase 6]
 *   /request   → CreateRequestForm (protected)
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes */}
          <Route
            path="/request"
            element={
              <ProtectedRoute>
                <CreateRequestForm />
              </ProtectedRoute>
            }
          />

          {/* Phase 6 placeholder — will be replaced by DonorDashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
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

// ---------------------------------------------------------------------------
// Temporary Dashboard Placeholder — replaced in Phase 6
// ---------------------------------------------------------------------------
import { useAuth } from "./context/AuthContext";

const DashboardPlaceholder = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-crimson-800/20 blur-[150px]" />
      </div>
      <div className="glass-card p-8 text-center max-w-md w-full relative">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-crimson-600/20 border border-crimson-500/30 mb-4">
          <svg className="w-8 h-8 text-crimson-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          Welcome, {user?.name?.split(" ")[0]}! 👋
        </h2>
        <p className="text-gray-400 text-sm mb-1">
          Blood Group: <span className="text-crimson-400 font-semibold">{user?.bloodGroup}</span>
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Donor dashboard coming in Phase 6
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/request"
            className="btn-crimson flex items-center justify-center gap-2 text-sm"
          >
            🩸 Post Emergency Request
          </a>
          <button
            onClick={logout}
            className="btn-ghost text-sm"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
