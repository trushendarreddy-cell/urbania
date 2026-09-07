import useSimulationStore from "../stores/useSimulationStore";

function formatTime(timeOfDay: number): string {
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getTimeIcon(timeOfDay: number): string {
  if (timeOfDay >= 0 && timeOfDay < 5) return "🌙";
  if (timeOfDay >= 5 && timeOfDay < 7) return "🌅";
  if (timeOfDay >= 7 && timeOfDay < 17) return "☀️";
  if (timeOfDay >= 17 && timeOfDay < 19) return "🌇";
  return "🌙";
}

const SPEED_LABELS: Record<number, string> = {
  0: "⏸",
  1: "1x",
  2: "2x",
  4: "4x",
};

export default function SimulationClock() {
  const day = useSimulationStore((state) => state.day);
  const timeOfDay = useSimulationStore(
    (state) => state.timeOfDay
  );
  const isPaused = useSimulationStore(
    (state) => state.isPaused
  );
  const speed = useSimulationStore((state) => state.speed);
  const togglePaused = useSimulationStore(
    (state) => state.togglePaused
  );
  const cycleSpeed = useSimulationStore(
    (state) => state.cycleSpeed
  );

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "6px 14px",
        background: "rgba(20, 20, 20, 0.85)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#F3F4F6",
        fontFamily: "monospace",
        fontSize: "13px",
        zIndex: 10,
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      <span style={{ fontWeight: "700", fontSize: "14px" }}>
        DAY {day}
      </span>
      <span style={{ color: "#9CA3AF" }}>•</span>
      <span>{formatTime(timeOfDay)}</span>
      <span>{getTimeIcon(timeOfDay)}</span>
      <span style={{ color: "#9CA3AF" }}>|</span>
      <button
        onClick={togglePaused}
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: isPaused ? "#FACC15" : "#4ADE80",
          borderRadius: "4px",
          padding: "1px 6px",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "monospace",
          fontWeight: "700",
        }}
        title="Pause/Resume [Space]"
      >
        {isPaused ? "▶" : "⏸"}
      </button>
      <button
        onClick={cycleSpeed}
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#93C5FD",
          borderRadius: "4px",
          padding: "1px 6px",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "monospace",
          fontWeight: "700",
        }}
        title="Cycle speed [*/-]"
      >
        {SPEED_LABELS[speed]}
      </button>
    </div>
  );
}