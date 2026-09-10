import useCityEventStore from "../store/CityEventStore";
import useDistrictStore from "../store/DistrictStore";

const SEVERITY_COLOR: Record<string, string> = {
  info: "#60A5FA",
  warning: "#FBBF24",
  critical: "#EF4444",
};

const SEVERITY_ICON: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

export default function CityEventPanel() {
  const events = useCityEventStore((state) => state.events);
  const panelOpen = useCityEventStore((state) => state.panelOpen);
  const setPanelOpen = useCityEventStore((state) => state.setPanelOpen);
  const setSelectedDistrictId = useDistrictStore((s) => s.setSelectedDistrictId);

  if (!panelOpen) return null;

  const active = events.filter((e) => e.status === "active");
  const recent = events.filter((e) => e.status !== "active").slice(0, 8);

  const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const sortedActive = [...active].sort(
    (a, b) => order[a.severity] - order[b.severity]
  );

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "80px",
        left: "24px",
        width: "320px",
        maxHeight: "calc(100vh - 160px)",
        overflowY: "auto",
        padding: "16px 20px",
        background: "rgba(12, 12, 16, 0.92)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#F3F4F6",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        zIndex: 12,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "8px",
        }}
      >
        <span style={{ fontWeight: "600", fontSize: "15px", color: "#F9FAFB" }}>
          CITY EVENTS
        </span>
        <button
          onClick={() => setPanelOpen(false)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#9CA3AF",
            borderRadius: "8px",
            padding: "2px 12px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "inherit",
          }}
        >
          ✕ Close
        </button>
      </div>

      {sortedActive.length === 0 && (
        <div style={{ color: "#9CA3AF", fontSize: "12px", marginBottom: "10px" }}>
          No active events. The city is stable.
        </div>
      )}

      {sortedActive.map((e) => (
        <div
          key={e.id}
          style={{
            border: `1px solid ${SEVERITY_COLOR[e.severity]}`,
            borderRadius: "10px",
            padding: "8px 10px",
            marginBottom: "8px",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: SEVERITY_COLOR[e.severity], fontWeight: 600 }}>
            <span>{SEVERITY_ICON[e.severity]} {e.severity.toUpperCase()}</span>
            <span style={{ color: "#6B7280" }}>{e.category}</span>
          </div>
          <div style={{ fontWeight: "600", marginTop: "2px" }}>{e.title}</div>
          <div style={{ fontSize: "12px", color: "#D1D5DB", marginTop: "2px" }}>
            {e.description}
          </div>
          {e.districtName && (
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
              📍 {e.districtName}
            </div>
          )}
          <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
            {e.districtId && (
              <button
                onClick={() => setSelectedDistrictId(e.districtId)}
                style={smallBtn}
              >
                Inspect District
              </button>
            )}
            {e.navigation === "budget" && (
              <span style={{ fontSize: "11px", color: "#9CA3AF", alignSelf: "center" }}>
                → Municipal Budget
              </span>
            )}
          </div>
        </div>
      ))}

      {recent.length > 0 && (
        <>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              marginTop: "8px",
              paddingTop: "8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#9CA3AF",
              letterSpacing: "0.04em",
              marginBottom: "4px",
            }}
          >
            RECENT
          </div>
          {recent.map((e) => (
            <div key={e.id} style={{ fontSize: "11px", padding: "2px 0", color: "#9CA3AF" }}>
              {e.status === "resolved" ? "✓" : "•"} {e.title}
              {e.districtName ? ` — ${e.districtName}` : ""}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const smallBtn: React.CSSProperties = {
  padding: "3px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#D1D5DB",
  cursor: "pointer",
  fontSize: "11px",
  fontFamily: "inherit",
  fontWeight: 500,
};