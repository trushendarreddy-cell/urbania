import { Html } from "@react-three/drei";

interface EventIndicatorProps {
  position: [number, number, number];
  type: "fire" | "medical" | "crime";
  status: "active" | "responding" | "resolved";
}

export default function EventIndicator({ position, type, status }: EventIndicatorProps) {
  const icons = {
    fire: "🔥",
    medical: "⚕️",
    crime: "🛡️",
  };
  const colors = {
    active: "#EF4444",
    responding: "#FBBF24",
    resolved: "#4ADE80",
  };
  const icon = icons[type];
  const color = colors[status];

  if (status === "resolved") return null;

  return (
    <Html position={[position[0], position[1] + 1.2, position[2]]} center>
      <div
        style={{
          fontSize: "24px",
          color: color,
          background: "rgba(0,0,0,0.6)",
          borderRadius: "50%",
          padding: "4px 8px",
          border: `2px solid ${color}`,
          pointerEvents: "none",
          userSelect: "none",
          fontFamily: "monospace",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {icon}
        <span style={{ fontSize: "10px", color: "#fff" }}>
          {status === "active" ? "!" : "⏳"}
        </span>
      </div>
    </Html>
  );
}