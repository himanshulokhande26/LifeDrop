import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ── AuthPage ─────────────────────────────────────────────────────────────────
const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode,        setMode]        = useState("login");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password,    setPassword]    = useState("");
  const [name,        setName]        = useState("");
  const [bloodGroup,  setBloodGroup]  = useState("");
  const [coords,      setCoords]      = useState(null);
  const [locating,    setLocating]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [showPass,    setShowPass]    = useState(false);

  const switchMode = (m) => {
    setMode(m); setError("");
    setPhoneNumber(""); setPassword("");
    setName(""); setBloodGroup(""); setCoords(null);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation not supported.");
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => { setCoords({ latitude, longitude }); setLocating(false); },
      (err) => {
        setLocating(false);
        setError(err.code === 1 ? "Location denied. Allow location in browser settings." : "Unable to get location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (mode === "register") {
      if (!name.trim())  return setError("Enter your full name.");
      if (!bloodGroup)   return setError("Select your blood group.");
      if (!coords)       return setError("Capture your location first.");
    }
    if (!phoneNumber || phoneNumber.length !== 10) return setError("Enter a valid 10-digit number.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ phoneNumber, password });
      } else {
        await register({ name, bloodGroup, phoneNumber, password, longitude: coords.longitude, latitude: coords.latitude });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex">

      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-[#0a0f1e] border-r border-white/[0.06] p-12">
        {/* Back to home */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </button>

        {/* Center content */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
            <span className="text-lg font-bold">LifeDrop</span>
          </div>

          <h2 className="text-3xl font-bold text-gradient mb-4 leading-snug">
            Join the network.<br />Save a life today.
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-10">
            Register as a blood donor and receive instant alerts when someone near you needs your blood group.
          </p>

          {/* Trust points */}
          {[
            "Your phone number is never shown publicly",
            "Contact revealed only after you accept",
            "Geo-matched to donors within your radius",
          ].map((point) => (
            <div key={point} className="flex items-start gap-3 mb-4">
              <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-2.5 h-2.5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">{point}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-700">© 2025 LifeDrop · Built for educational purposes</p>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile back button */}
        <div className="w-full max-w-sm mb-6 lg:hidden">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Home
          </button>
        </div>

        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "login"
                ? "Log in to your donor dashboard."
                : "Register to start receiving blood requests."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 mb-6 gap-1">
            {["login", "register"].map((tab) => (
              <button
                key={tab}
                type="button"
                id={`tab-${tab}`}
                onClick={() => switchMode(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${mode === tab ? "bg-white/[0.08] text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                {tab === "login" ? "Log In" : "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {mode === "register" && (
              <div>
                <label htmlFor="name" className="form-label">Full Name</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma" className="input-field" autoComplete="off" />
              </div>
            )}

            {mode === "register" && (
              <div>
                <label htmlFor="bloodGroup" className="form-label">Blood Group</label>
                <select id="bloodGroup" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}
                  className="input-field appearance-none cursor-pointer">
                  <option value="" disabled>Select blood group…</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="phoneNumber" className="form-label">
                Phone Number
                <span className="ml-1.5 font-normal normal-case text-gray-600">· used as your login ID</span>
              </label>
              <input id="phoneNumber" type="tel" value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile number" maxLength={10} className="input-field" autoComplete="off" />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <input id="password" type={showPass ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                  className="input-field pr-10" minLength={6} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                  aria-label="Toggle password visibility">
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Location (register only) */}
            {mode === "register" && (
              <div>
                <label className="form-label">
                  Your Location
                  <span className="ml-1.5 font-normal normal-case text-gray-600">· for nearby matching</span>
                </label>
                <button id="get-location-btn" type="button" onClick={handleGetLocation}
                  disabled={locating || submitting}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium border transition-all duration-150
                    ${coords
                      ? "bg-green-500/10 border-green-500/20 text-green-300"
                      : "bg-white/[0.04] border-white/[0.1] text-gray-400 hover:text-white hover:border-white/20"
                    }`}
                >
                  {locating ? (
                    <><Spinner /> Fetching location…</>
                  ) : coords ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Location Captured
                      <span className="text-gray-500 text-xs font-normal">
                        ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      Detect Current Location
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button id="auth-submit-btn" type="submit" disabled={submitting || locating}
              className="btn-primary w-full py-3 text-sm mt-1">
              {submitting ? (
                <><Spinner />{mode === "login" ? "Logging in…" : "Creating account…"}</>
              ) : (
                mode === "login" ? "Log In" : "Create Account"
              )}
            </button>
          </form>

          {/* Mode switch */}
          <p className="mt-5 text-center text-sm text-gray-600">
            {mode === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={() => switchMode("register")} className="text-red-400 hover:text-red-300 font-medium transition-colors">
                  Register as a donor
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => switchMode("login")} className="text-red-400 hover:text-red-300 font-medium transition-colors">
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
