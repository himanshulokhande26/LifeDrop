import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";

// ---------------------------------------------------------------------------
// Fix Leaflet's default icon paths broken by Vite's asset pipeline
// ---------------------------------------------------------------------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ---------------------------------------------------------------------------
// Custom SVG marker icons
// ---------------------------------------------------------------------------

/** Create a colored SVG pin icon for a request marker */
const createRequestIcon = (urgency) => {
  const colors = {
    Critical: "#ef4444", // red-500
    High:     "#f97316", // orange-500
    Medium:   "#eab308", // yellow-500
    Low:      "#22c55e", // green-500
  };
  const color = colors[urgency] || colors.High;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 24 16 24s16-13.5 16-24C32 7.163 24.837 0 16 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="13" font-weight="bold"
        font-family="sans-serif">🩸</text>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize:   [32, 40],
    iconAnchor: [16, 40],
    popupAnchor:[0, -42],
  });
};

/** Donor's own location — blue pulsing dot */
const donorIcon = L.divIcon({
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:rgba(59,130,246,0.3);
        animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="
        position:absolute;inset:3px;border-radius:50%;
        background:#3b82f6;border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>
    <style>
      @keyframes ping {
        75%,100% { transform:scale(2.5); opacity:0; }
      }
    </style>`,
  className: "",
  iconSize:   [20, 20],
  iconAnchor: [10, 10],
  popupAnchor:[0, -14],
});

// ---------------------------------------------------------------------------
// FlyToUser — centers map on donor when coords are available
// ---------------------------------------------------------------------------
const FlyToUser = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.latitude, coords.longitude], 13, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
};

// ---------------------------------------------------------------------------
// Urgency badge colors for the popup
// ---------------------------------------------------------------------------
const URGENCY_BADGE = {
  Critical: "background:#ef444420;color:#fca5a5;border:1px solid #ef444450",
  High:     "background:#f9731620;color:#fdba74;border:1px solid #f9731650",
  Medium:   "background:#eab30820;color:#fde047;border:1px solid #eab30850",
  Low:      "background:#22c55e20;color:#86efac;border:1px solid #22c55e50",
};

// ---------------------------------------------------------------------------
// MapView — Main Component
// ---------------------------------------------------------------------------
/**
 * MapView
 * -------
 * Props:
 *   requests      : array of EmergencyRequest docs from getNearbyRequests
 *   donorCoords   : { latitude, longitude } | null
 *   radiusKm      : number — search radius for the translucent circle overlay
 *   onAccept      : (requestId) => void — called when Popup accept btn clicked
 *   acceptingId   : string | null — request currently being accepted
 */
const MapView = ({ requests, donorCoords, radiusKm, onAccept, acceptingId }) => {
  const defaultCenter = donorCoords
    ? [donorCoords.latitude, donorCoords.longitude]
    : [20.5937, 78.9629]; // Center of India fallback

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
         style={{ height: "460px" }}>
      <MapContainer
        center={defaultCenter}
        zoom={donorCoords ? 13 : 5}
        style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Dark map tiles — CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Fly to donor on load / coord change */}
        {donorCoords && <FlyToUser coords={donorCoords} />}

        {/* ── Donor Location Marker ── */}
        {donorCoords && (
          <>
            <Marker
              position={[donorCoords.latitude, donorCoords.longitude]}
              icon={donorIcon}
            >
              <Popup className="lifedrop-popup">
                <div style={{ fontSize: "13px", color: "#f1f5f9" }}>
                  <strong>📍 Your Location</strong>
                  <p style={{ color: "#94a3b8", margin: "4px 0 0" }}>
                    You are here. Donors nearby will see requests within {radiusKm} km.
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Search radius circle */}
            <Circle
              center={[donorCoords.latitude, donorCoords.longitude]}
              radius={radiusKm * 1000}
              pathOptions={{
                color:       "#3b82f6",
                fillColor:   "#3b82f6",
                fillOpacity: 0.06,
                weight:      1.5,
                dashArray:   "6 4",
              }}
            />
          </>
        )}

        {/* ── Blood Request Markers ── */}
        {requests.map((req) => {
          const [lng, lat] = req.coordinates.coordinates;
          const isAccepting = acceptingId === req._id;

          return (
            <Marker
              key={req._id}
              position={[lat, lng]}
              icon={createRequestIcon(req.urgencyLevel)}
            >
              <Popup
                minWidth={220}
                maxWidth={260}
              >
                {/* Custom styled popup content */}
                <div style={{
                  background: "#1e293b",
                  borderRadius: "12px",
                  padding: "12px",
                  color: "#f1f5f9",
                  fontFamily: "Inter, sans-serif",
                  margin: "-14px -19px",
                }}>
                  {/* Urgency badge */}
                  <span style={{
                    ...Object.fromEntries(
                      (URGENCY_BADGE[req.urgencyLevel] || URGENCY_BADGE.High)
                        .split(";").filter(Boolean)
                        .map(s => s.trim().split(":").map(v => v.trim()))
                    ),
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    marginBottom: "8px",
                  }}>
                    {req.urgencyLevel}
                  </span>

                  {/* Blood group */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div style={{
                      background: "#be123c30",
                      border: "1px solid #be123c60",
                      borderRadius: "8px",
                      width: "40px", height: "40px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: "700", color: "#fda4af",
                      flexShrink: 0,
                    }}>
                      {req.requiredBloodGroup}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "13px" }}>
                        {req.patientName}
                      </p>
                      <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: "11px" }}>
                        {req.hospitalName}
                      </p>
                    </div>
                  </div>

                  {/* Distance */}
                  {req.distanceFromDonor != null && (
                    <p style={{ color: "#64748b", fontSize: "11px", margin: "0 0 10px" }}>
                      📍 {req.distanceFromDonor >= 1000
                          ? `${(req.distanceFromDonor / 1000).toFixed(1)} km away`
                          : `${Math.round(req.distanceFromDonor)} m away`}
                    </p>
                  )}

                  {/* Accept button */}
                  <button
                    onClick={() => onAccept(req._id)}
                    disabled={isAccepting}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "none",
                      background: isAccepting ? "#be123c80" : "#be123c",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "12px",
                      cursor: isAccepting ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                    }}
                  >
                    {isAccepting ? "Processing…" : "🩸 I Can Donate"}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
