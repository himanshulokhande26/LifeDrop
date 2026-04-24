import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage      from "./pages/LandingPage";
import AuthPage         from "./pages/AuthPage";
import DonorDashboard   from "./pages/DonorDashboard";
import CreateRequestForm from "./components/CreateRequestForm";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"     element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DonorDashboard /></ProtectedRoute>} />
          <Route path="/request"   element={<ProtectedRoute><CreateRequestForm /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
