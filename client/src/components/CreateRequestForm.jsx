import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = ["Critical", "High", "Medium", "Low"];

const URGENCY_COLORS = {
  Critical: "badge-critical",
  High:     "badge-high",
  Medium:   "badge-medium",
  Low:      "badge-low",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated spinner used for location fetch and form submission */
const Spinner = ({ size = "sm" }) => (
  <svg
    className={`animate-spin ${size === "sm" ? "w-4 h-4" : "w-5 h-5"} text-white`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

/** Status banner — shown after submit */
const StatusBanner = ({ type, message }) => {
  const styles = {
    success: "bg-green-500/15 border-green-500/30 text-green-300",
    error:   "bg-red-500/15 border-red-500/30 text-red-300",
    info:    "bg-blue-500/15 border-blue-500/30 text-blue-300",
  };
  const icons = { success: "✅", error: "❌", info: "ℹ️" };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[type] ?? styles.info} animate-fade-in`}
    >
      <span className="mt-0.5 text-base">{icons[type]}</span>
      <p className="leading-relaxed">{message}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * CreateRequestForm
 * ------------------
 * Allows a patient / caretaker to raise an emergency blood request.
 *
 * Features:
 *   1. Controlled form with validation
 *   2. "Get Current Location" via HTML5 Geolocation API with loading state
 *   3. Axios POST to backend /api/requests/create
 *   4. Loading spinner during both location fetch and submission
 *   5. Success / error status feedback
 */
const CreateRequestForm = () => {
  // --- Form State ---
  const [form, setForm] = useState({
    patientName:        "",
    requiredBloodGroup: "",
    hospitalName:       "",
    urgencyLevel:       "High",
    contactPhone:       "",
  });

  // --- Coordinates ---
  const [coords, setCoords] = useState(null); // { latitude, longitude }

  // --- UI State ---
  const [locating, setLocating]     = useState(false); // Geo fetch in progress
  const [submitting, setSubmitting] = useState(false); // API call in progress
  const [status, setStatus]         = useState(null);  // { type, message }

  // --- Form field change handler ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear status message on any change so feedback feels fresh
    setStatus(null);
  };

  // ---------------------------------------------------------------------------
  // HTML5 Geolocation — fetch current position
  // ---------------------------------------------------------------------------
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setStatus({
        type: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setLocating(true);
    setStatus({ type: "info", message: "Fetching your current location…" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setLocating(false);
        setStatus({
          type: "success",
          message: `📍 Location captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
      },
      (error) => {
        setLocating(false);
        let message = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please allow location in browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable. Try again.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Try again.";
            break;
          default:
            break;
        }
        setStatus({ type: "error", message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,      // 10 second timeout
        maximumAge: 60_000,   // Accept cached position up to 1 min old
      }
    );
  };

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------
  const validate = () => {
    const { patientName, requiredBloodGroup, hospitalName } = form;
    if (!patientName.trim())        return "Patient name is required.";
    if (!requiredBloodGroup)        return "Please select a blood group.";
    if (!hospitalName.trim())       return "Hospital name is required.";
    if (!coords)                    return "Please capture your location first.";
    return null;
  };

  // ---------------------------------------------------------------------------
  // Form submission — POST to /api/requests/create
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const payload = {
        ...form,
        longitude: coords.longitude,
        latitude:  coords.latitude,
      };

      const response = await axiosInstance.post("/requests/create", payload);
      const { data } = response.data;

      setStatus({
        type: "success",
        message: `Request sent! We notified ${data.matchedDonorsCount} nearby donor(s). Help is on the way. 🩸`,
      });

      // Reset form on success
      setForm({
        patientName:        "",
        requiredBloodGroup: "",
        hospitalName:       "",
        urgencyLevel:       "High",
        contactPhone:       "",
      });
      setCoords(null);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to submit request. Please check your connection and try again.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-crimson-700/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-crimson-900/20 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-crimson-600/20 border border-crimson-500/30 mb-4">
            <svg className="w-8 h-8 text-crimson-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Emergency Blood Request
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            We'll find nearby donors and alert them immediately.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Patient Name */}
            <div>
              <label htmlFor="patientName" className="form-label">
                Patient Name
              </label>
              <input
                id="patientName"
                name="patientName"
                type="text"
                value={form.patientName}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="input-field"
                autoComplete="name"
                required
              />
            </div>

            {/* Blood Group + Urgency — 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Blood Group */}
              <div>
                <label htmlFor="requiredBloodGroup" className="form-label">
                  Blood Group
                </label>
                <select
                  id="requiredBloodGroup"
                  name="requiredBloodGroup"
                  value={form.requiredBloodGroup}
                  onChange={handleChange}
                  className="input-field appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select…</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Urgency Level */}
              <div>
                <label htmlFor="urgencyLevel" className="form-label">
                  Urgency
                </label>
                <select
                  id="urgencyLevel"
                  name="urgencyLevel"
                  value={form.urgencyLevel}
                  onChange={handleChange}
                  className="input-field appearance-none cursor-pointer"
                >
                  {URGENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Urgency badge preview */}
            {form.urgencyLevel && (
              <div className="flex items-center gap-2 -mt-2">
                <span className="text-xs text-gray-500">Level:</span>
                <span className={URGENCY_COLORS[form.urgencyLevel]}>
                  {form.urgencyLevel === "Critical" && "🔴 "}
                  {form.urgencyLevel === "High"     && "🟠 "}
                  {form.urgencyLevel === "Medium"   && "🟡 "}
                  {form.urgencyLevel === "Low"      && "🟢 "}
                  {form.urgencyLevel}
                </span>
              </div>
            )}

            {/* Hospital Name */}
            <div>
              <label htmlFor="hospitalName" className="form-label">
                Hospital Name
              </label>
              <input
                id="hospitalName"
                name="hospitalName"
                type="text"
                value={form.hospitalName}
                onChange={handleChange}
                placeholder="e.g. AIIMS New Delhi"
                className="input-field"
                required
              />
            </div>

            {/* Contact Phone (optional at form level — for privacy reveal) */}
            <div>
              <label htmlFor="contactPhone" className="form-label">
                Contact Phone <span className="text-gray-600 normal-case font-normal">(hidden until donor accepts)</span>
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="input-field"
                maxLength={10}
              />
            </div>

            {/* Location — Get Current Location button */}
            <div>
              <p className="form-label">Hospital / Your Location</p>
              <button
                id="get-location-btn"
                type="button"
                onClick={handleGetLocation}
                disabled={locating || submitting}
                className="btn-ghost w-full flex items-center justify-center gap-2.5"
              >
                {locating ? (
                  <>
                    <Spinner />
                    Fetching Location…
                  </>
                ) : coords ? (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400">Location Captured</span>
                    <span className="text-gray-500 text-xs ml-1">
                      ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-7 4H3m9-9v-2m9 11h2M12 21v-2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                    Get Current Location
                  </>
                )}
              </button>
            </div>

            {/* Status Banner */}
            {status && <StatusBanner type={status.type} message={status.message} />}

            {/* Submit Button */}
            <button
              id="submit-request-btn"
              type="submit"
              disabled={submitting || locating}
              className="btn-crimson w-full flex items-center justify-center gap-2.5 text-base mt-2"
            >
              {submitting ? (
                <>
                  <Spinner size="md" />
                  Sending Alert…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Emergency Alert
                </>
              )}
            </button>

          </form>

          {/* Footer note */}
          <p className="mt-5 text-center text-xs text-gray-600">
            🔒 Your contact details are kept private. Only revealed to the donor who accepts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestForm;
