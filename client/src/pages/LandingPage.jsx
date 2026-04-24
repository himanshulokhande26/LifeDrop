import { useNavigate } from "react-router-dom";

// ── Stats ──────────────────────────────────────────────────────────────────
const STATS = [
  { value: "< 10 min", label: "Avg. Response Time" },
  { value: "10 km",    label: "Default Search Radius" },
  { value: "100%",     label: "Contact Privacy" },
  { value: "24/7",     label: "Always Active" },
];

// ── How It Works ───────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "01",
    title: "Post a Request",
    desc: "Anyone can post an emergency blood request with the patient's blood group, hospital, and urgency level.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Donors Are Alerted",
    desc: "Nearby donors with the matching blood group receive an instant push notification on their device.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Accept & Connect",
    desc: "A willing donor accepts the request. Only then is the patient's contact revealed — privately and securely.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

// ── Features ───────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🔒",
    title: "Double-Blind Privacy",
    desc: "Phone numbers are never shown publicly. They're only revealed to a donor after they accept — protecting both parties.",
  },
  {
    icon: "📍",
    title: "Geospatial Matching",
    desc: "MongoDB's $geoNear finds compatible donors within a configurable radius using real GPS coordinates.",
  },
  {
    icon: "🔔",
    title: "Instant Push Alerts",
    desc: "Firebase Cloud Messaging delivers browser push notifications. Falls back to SMS via Fast2SMS if needed.",
  },
  {
    icon: "⏰",
    title: "Auto-Expiry",
    desc: "Requests automatically expire after 24 hours using a background cron job — keeping the feed clean and relevant.",
  },
  {
    icon: "🗺️",
    title: "Interactive Map",
    desc: "See nearby requests on a live dark-themed map with urgency-colored pins and your search radius overlay.",
  },
  {
    icon: "🩸",
    title: "Blood Group Filter",
    desc: "By default, donors only see requests matching their own blood group. Toggle to view all types anytime.",
  },
];

// ── LandingPage ────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#080d1a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">LifeDrop</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="btn-ghost text-sm"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="btn-primary text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-24 px-4 overflow-hidden">

        {/* Background grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 65%),
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: "auto, 48px 48px, 48px 48px",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-300 text-xs font-medium mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Emergency Blood Donor Network
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-up delay-100">
            <span className="text-gradient">The fastest way to</span>
            <br />
            <span className="text-gradient-red">find blood donors</span>
            <br />
            <span className="text-gradient">near you.</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            LifeDrop connects emergency patients with nearby willing donors in minutes —
            without ever exposing private contact details publicly.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up delay-300">
            <button
              onClick={() => navigate("/auth")}
              className="btn-primary-lg w-full sm:w-auto glow-red"
            >
              Register as a Donor
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-secondary-lg w-full sm:w-auto"
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-8 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05]">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#080d1a] px-6 py-6 text-center">
              <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gradient">How LifeDrop works</h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              A simple three-step process that connects patients and donors in minutes.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative surface p-6">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-[2.75rem] left-full w-6 h-px bg-white/10 z-10" />
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    {step.icon}
                  </div>
                  <span className="text-xs font-mono font-bold text-red-500/60 tracking-wider">{step.num}</span>
                </div>

                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gradient">Built for real emergencies</h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Every feature is designed around speed, privacy, and reliability.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="surface surface-hover p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="surface p-10 sm:p-14 text-center relative overflow-hidden">
            {/* Glow */}
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full bg-red-500/10 blur-3xl" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-2xl mb-6">
                🩸
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-4">
                Ready to save a life?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Register as a donor today. When someone nearby needs your blood group,
                you'll be the first to know.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="btn-primary-lg glow-red"
              >
                Join LifeDrop — It's Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-400">LifeDrop</span>
          </div>
          <p className="text-xs text-gray-600">
            Built for educational purposes · Every second counts.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/himanshulokhande26/LifeDrop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
