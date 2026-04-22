/**
 * RequestCard
 * -----------
 * Displays a single EmergencyRequest in the donor feed.
 * Shows urgency badge, blood group, hospital name, distance,
 * and an "Accept" button that triggers the Double-Blind reveal.
 *
 * Props:
 *   request    : EmergencyRequest document from API
 *   onAccept   : callback(requestId) → called after successful acceptance
 */

const URGENCY_STYLES = {
  Critical: {
    badge:  "bg-red-500/20 text-red-300 border border-red-500/30",
    ring:   "ring-red-500/20",
    pulse:  "bg-red-400",
    icon:   "🔴",
  },
  High: {
    badge:  "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    ring:   "ring-orange-500/20",
    pulse:  "bg-orange-400",
    icon:   "🟠",
  },
  Medium: {
    badge:  "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    ring:   "ring-yellow-500/20",
    pulse:  "bg-yellow-400",
    icon:   "🟡",
  },
  Low: {
    badge:  "bg-green-500/20 text-green-300 border border-green-500/30",
    ring:   "ring-green-500/20",
    pulse:  "bg-green-400",
    icon:   "🟢",
  },
};

/** Format metres → "0.4 km" or "850 m" */
const formatDistance = (metres) => {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
};

/** Format ISO date → "2h ago", "just now", etc. */
const timeAgo = (isoDate) => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const RequestCard = ({ request, onAccept, accepting }) => {
  const style = URGENCY_STYLES[request.urgencyLevel] || URGENCY_STYLES.High;

  return (
    <div
      className={`glass-card p-5 ring-1 ${style.ring} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl`}
    >
      {/* Top row: Blood group pill + Urgency badge */}
      <div className="flex items-start justify-between gap-3 mb-4">

        {/* Blood group */}
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-crimson-600/20 border border-crimson-500/30 shrink-0">
          <span className="text-crimson-300 font-bold text-lg leading-none">
            {request.requiredBloodGroup}
          </span>
        </div>

        {/* Urgency + time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live pulse dot */}
            <span className="relative flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${style.pulse} animate-pulse`} />
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {style.icon} {request.urgencyLevel}
              </span>
            </span>
            <span className="text-gray-600 text-xs">{timeAgo(request.createdAt)}</span>
          </div>

          <h3 className="text-white font-semibold text-sm mt-1.5 truncate">
            {request.patientName}
          </h3>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Hospital */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
          </svg>
          <span className="truncate">{request.hospitalName}</span>
        </div>

        {/* Distance */}
        {request.distanceFromDonor != null && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
            <span>{formatDistance(request.distanceFromDonor)} away</span>
          </div>
        )}
      </div>

      {/* Accept Button */}
      <button
        id={`accept-btn-${request._id}`}
        onClick={() => onAccept(request._id)}
        disabled={accepting}
        className="btn-crimson w-full flex items-center justify-center gap-2 text-sm py-2.5"
      >
        {accepting ? (
          <>
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Processing…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
            I Can Donate
          </>
        )}
      </button>
    </div>
  );
};

export default RequestCard;
