import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const InputField = ({ id, label, type = "text", value, onChange, placeholder, required, maxLength, hint }) => (
  <div>
    <label htmlFor={id} className="form-label">
      {label}
      {hint && <span className="ml-1 text-gray-600 normal-case font-normal">{hint}</span>}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="input-field"
      autoComplete="off"
    />
  </div>
);

// ---------------------------------------------------------------------------
// AuthPage Component
// ---------------------------------------------------------------------------
/**
 * AuthPage
 * --------
 * Combined Login + Register page with smooth tab switching.
 * Register also captures location and blood group for donor matching.
 */
const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // --- Tab: "login" | "register" ---
  const [mode, setMode] = useState("login");

  // --- Shared fields ---
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password,    setPassword]    = useState("");

  // --- Register-only fields ---
  const [name,       setName]       = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [coords,     setCoords]     = useState(null);

  // --- UI state ---
  const [locating,   setLocating]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [showPass,   setShowPass]   = useState(false);

  // ---------------------------------------------------------------------------
  // Reset form when switching tabs
  // ---------------------------------------------------------------------------
  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setPhoneNumber("");
    setPassword("");
    setName("");
    setBloodGroup("");
    setCoords(null);
  };

  // ---------------------------------------------------------------------------
  // Geolocation
  // ---------------------------------------------------------------------------
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCoords({ latitude, longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === 1
            ? "Location access denied. Please allow location in your browser settings."
            : "Unable to fetch location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (mode === "register") {
      if (!name.trim())   return setError("Please enter your name.");
      if (!bloodGroup)    return setError("Please select your blood group.");
      if (!coords)        return setError("Please capture your location first.");
    }
    if (!phoneNumber || phoneNumber.length !== 10)
      return setError("Please enter a valid 10-digit phone number.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ phoneNumber, password });
      } else {
        await register({
          name,
          bloodGroup,
          phoneNumber,
          password,
          longitude: coords.longitude,
          latitude:  coords.latitude,
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">

      {/* Background ambient glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-crimson-800/20 blur-[150px]" />
        <div className="absolute -bottom-60 -right-60 w-[600px] h-[600px] rounded-full bg-crimson-900/15 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-crimson-600/20 border border-crimson-500/30 mb-4">
            <svg className="w-8 h-8 text-crimson-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LifeDrop</h1>
          <p className="mt-1.5 text-gray-400 text-sm">
            {mode === "login" ? "Welcome back. Every second counts." : "Join the network. Save a life today."}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8">

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6 gap-1">
            {["login", "register"].map((tab) => (
              <button
                key={tab}
                type="button"
                id={`tab-${tab}`}
                onClick={() => switchMode(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200
                  ${mode === tab
                    ? "bg-crimson-600 text-white shadow-lg shadow-crimson-900/40"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                {tab === "login" ? "Log In" : "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Register-only: Name */}
            {mode === "register" && (
              <InputField
                id="name"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                required
              />
            )}

            {/* Register-only: Blood Group */}
            {mode === "register" && (
              <div>
                <label htmlFor="bloodGroup" className="form-label">Blood Group</label>
                <select
                  id="bloodGroup"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select your blood group…</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Phone Number */}
            <InputField
              id="phoneNumber"
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile number"
              required
              maxLength={10}
              hint="(used as your login ID)"
            />

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                  className="input-field pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Register-only: Location */}
            {mode === "register" && (
              <div>
                <p className="form-label">Your Location <span className="text-gray-600 normal-case font-normal">(for nearby matching)</span></p>
                <button
                  id="get-location-btn"
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating || submitting}
                  className="btn-ghost w-full flex items-center justify-center gap-2.5"
                >
                  {locating ? (
                    <><Spinner /> Fetching…</>
                  ) : coords ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span className="text-green-400">Location Captured</span>
                      <span className="text-gray-500 text-xs">
                        ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Get Current Location
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <span className="mt-0.5">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={submitting || locating}
              className="btn-crimson w-full flex items-center justify-center gap-2.5 text-base mt-1"
            >
              {submitting ? (
                <><Spinner />{mode === "login" ? "Logging in…" : "Creating account…"}</>
              ) : (
                mode === "login" ? "Log In" : "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-5 text-center text-xs text-gray-600">
            🔒 Your phone number is kept private and never shared publicly.
          </p>
        </div>

        {/* Switch mode hint */}
        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => switchMode("register")} className="text-crimson-400 hover:text-crimson-300 font-medium transition-colors">
                Register as a donor
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => switchMode("login")} className="text-crimson-400 hover:text-crimson-300 font-medium transition-colors">
                Log in
              </button>
            </>
          )}
        </p>

      </div>
    </div>
  );
};

export default AuthPage;
