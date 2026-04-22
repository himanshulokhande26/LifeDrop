import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import RequestCard from "../components/RequestCard";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Spinner = ({ text = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
    <svg className="animate-spin w-8 h-8 text-crimson-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <p className="text-sm">{text}</p>
  </div>
);

const EmptyState = ({ onRefresh }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
      🩸
    </div>
    <div>
      <h3 className="text-white font-semibold mb-1">No requests nearby</h3>
      <p className="text-gray-500 text-sm">
        No matching blood requests within your radius right now.
      </p>
    </div>
    <button onClick={onRefresh} className="btn-ghost text-sm">
      Refresh
    </button>
  </div>
);

/** Modal shown after a donor accepts — reveals the patient contact */
const ContactRevealModal = ({ data, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

    <div className="relative glass-card p-6 w-full max-w-sm text-center animate-fade-in">
      {/* Success icon */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
        <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>

      <h2 className="text-xl font-bold text-white mb-1">Thank you! 🩸</h2>
      <p className="text-gray-400 text-sm mb-5">
        You've accepted the request. Here is the patient's contact:
      </p>

      <div className="glass-card p-4 mb-5 space-y-2 text-left">
        <Row label="Patient"  value={data.patientName} />
        <Row label="Hospital" value={data.hospitalName} />
        <Row label="Blood"    value={data.requiredBloodGroup} />
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-1">🔓 Contact Number (revealed)</p>
          <a
            href={`tel:${data.contactPhone}`}
            className="text-crimson-400 font-semibold text-lg hover:text-crimson-300 transition-colors"
          >
            {data.contactPhone}
          </a>
        </div>
      </div>

      <button onClick={onClose} className="btn-crimson w-full text-sm">
        Done
      </button>
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// DonorDashboard — Main Component
// ---------------------------------------------------------------------------
/**
 * DonorDashboard
 * --------------
 * Shows the logged-in donor:
 *   1. Their profile summary (name, blood group, availability toggle)
 *   2. A live feed of nearby Pending blood requests sorted by urgency + distance
 *   3. Radius filter (5 / 10 / 25 km)
 *   4. Accept flow → ContactRevealModal (Double-Blind reveal)
 */
const DonorDashboard = () => {
  const { user, logout, updateAvailability } = useAuth();
  const navigate = useNavigate();

  // --- Feed state ---
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [radiusKm,  setRadiusKm]  = useState(10);
  const [showAll,   setShowAll]   = useState(false);

  // --- Accept flow ---
  const [acceptingId,    setAcceptingId]    = useState(null);
  const [revealData,     setRevealData]     = useState(null); // ContactRevealModal payload
  const [acceptError,    setAcceptError]    = useState("");

  // --- Availability ---
  const [togglingAvail,  setTogglingAvail]  = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch nearby requests
  // ---------------------------------------------------------------------------
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/requests/nearby", {
        params: { radius: radiusKm, all: showAll },
      });
      setRequests(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load nearby requests.");
    } finally {
      setLoading(false);
    }
  }, [radiusKm, showAll]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ---------------------------------------------------------------------------
  // Accept a request
  // ---------------------------------------------------------------------------
  const handleAccept = async (requestId) => {
    setAcceptingId(requestId);
    setAcceptError("");
    try {
      const res = await axiosInstance.put(`/requests/accept/${requestId}`);
      setRevealData(res.data.data);                          // Open modal
      setRequests((prev) => prev.filter((r) => r._id !== requestId)); // Remove from feed
    } catch (err) {
      setAcceptError(err.response?.data?.message || "Failed to accept request. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Toggle availability
  // ---------------------------------------------------------------------------
  const handleToggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      await updateAvailability(!user.isAvailable);
    } catch {
      // Silently fail — availability toggle is non-critical
    } finally {
      setTogglingAvail(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Background glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full bg-crimson-900/20 blur-[140px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crimson-600/20 border border-crimson-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-crimson-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">LifeDrop</h1>
              <p className="text-gray-500 text-xs">Donor Dashboard</p>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost text-xs py-1.5 px-3">
            Log Out
          </button>
        </header>

        {/* ── Profile Card ── */}
        <div className="glass-card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">{user?.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="badge bg-crimson-500/20 text-crimson-300 border border-crimson-500/30">
                {user?.bloodGroup}
              </span>
              <span
                className={`badge ${
                  user?.isAvailable
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${user?.isAvailable ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                {user?.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Availability toggle */}
            <button
              id="toggle-availability-btn"
              onClick={handleToggleAvailability}
              disabled={togglingAvail}
              title={user?.isAvailable ? "Mark yourself unavailable" : "Mark yourself available"}
              className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50
                ${user?.isAvailable ? "bg-green-500" : "bg-gray-600"}`}
            >
              <span
                className={`inline-block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1
                  ${user?.isAvailable ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            {/* Post request */}
            <button
              id="post-request-btn"
              onClick={() => navigate("/request")}
              className="btn-crimson text-xs py-2 px-3"
            >
              + New Request
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-gray-500 text-xs font-medium">Radius:</span>
          {[5, 10, 25].map((km) => (
            <button
              key={km}
              id={`radius-${km}-btn`}
              onClick={() => setRadiusKm(km)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150
                ${radiusKm === km
                  ? "bg-crimson-600 border-crimson-600 text-white"
                  : "border-white/15 text-gray-400 hover:border-white/30 hover:text-white"
                }`}
            >
              {km} km
            </button>
          ))}

          {/* Show all blood types toggle */}
          <button
            id="toggle-all-blood-btn"
            onClick={() => setShowAll((p) => !p)}
            className={`ml-auto text-xs px-3 py-1.5 rounded-lg border transition-all duration-150
              ${showAll
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
              }`}
          >
            {showAll ? "All blood types ✓" : "My type only"}
          </button>

          <button
            id="refresh-btn"
            onClick={fetchRequests}
            disabled={loading}
            className="text-gray-500 hover:text-white transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>

        {/* ── Accept Error ── */}
        {acceptError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>⚠️</span><p>{acceptError}</p>
          </div>
        )}

        {/* ── Feed ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm">
              Nearby Requests
              {!loading && (
                <span className="ml-2 text-gray-500 font-normal">({requests.length})</span>
              )}
            </h2>
          </div>

          {loading ? (
            <Spinner text="Searching nearby requests…" />
          ) : error ? (
            <div className="glass-card p-6 text-center text-red-400 text-sm">{error}</div>
          ) : requests.length === 0 ? (
            <EmptyState onRefresh={fetchRequests} />
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <RequestCard
                  key={req._id}
                  request={req}
                  onAccept={handleAccept}
                  accepting={acceptingId === req._id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Contact Reveal Modal ── */}
      {revealData && (
        <ContactRevealModal
          data={revealData}
          onClose={() => setRevealData(null)}
        />
      )}
    </div>
  );
};

export default DonorDashboard;
