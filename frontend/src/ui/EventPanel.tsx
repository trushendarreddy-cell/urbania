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
        bottom: "100px",
        right: "20px",
        padding: "8px 12px",
        background: "rgba(20,20,20,0.9)",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#F3F4F6",
        fontFamily: "monospace",
        fontSize: "13px",
        zIndex: 10,
        pointerEvents: "none",
        userSelect: "none",
        minWidth: "120px",
      }}
    >
      <div style={{ fontWeight: "700", marginBottom: "4px" }}>
        🚨 Active Events: {count}
      </div>
      {activeEvents.map((e) => (
        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
          <span>{iconMap[e.type] || "📌"} {e.type}</span>
          <span style={{ color: e.status === "active" ? "#EF4444" : "#FBBF24" }}>
            {e.status}
          </span>
        </div>
      ))}
    </div>
  );
}