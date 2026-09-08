import useEventStore from "../store/EventStore";

export default function EventPanel() {
  const events = useEventStore((state) => state.events);
  const activeEvents = events.filter((e) => e.status !== "resolved");
  const count = activeEvents.length;

  if (count === 0) return null;

  const iconMap: Record<string, string> = {
    fire: "🔥",
    medical: "⚕️",
    crime: "🛡️",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "120px",
        right: "24px",
        padding: "12px 16px",
        background: "rgba(12, 12, 16, 0.92)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        color: "#F3F4F6",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        zIndex: 10,
        pointerEvents: "none",
        userSelect: "none",
        minWidth: "160px",
      }}
    >
      <div style={{ fontWeight: "600", marginBottom: "6px", fontSize: "14px", color: "#FACC15" }}>
        ⚠️ Active Incidents: {count}
      </div>
      {activeEvents.map((e) => (
        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <span>{iconMap[e.type] || "📌"} {e.type}</span>
          <span style={{ color: e.status === "active" ? "#EF4444" : "#FBBF24", fontWeight: "500" }}>
            {e.status}
            {e.status === "responding" && e.eta !== undefined && ` ${Math.round(e.eta)}h`}
          </span>
        </div>
      ))}
    </div>
  );
}