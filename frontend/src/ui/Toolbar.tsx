import type { BuildTool } from "../types/BuildTool";

interface ToolbarProps {
  selected: BuildTool;
  onSelect: (tool: BuildTool) => void;
}

export default function Toolbar({
  selected,
  onSelect,
}: ToolbarProps) {
  const tools: {
    id: BuildTool;
    icon: string;
    label: string;
    key: string;
  }[] = [
    {
      id: "select",
      icon: "👆",
      label: "Select",
      key: "0",
    },
    {
      id: "house",
      icon: "🏠",
      label: "House",
      key: "1",
    },
    {
      id: "shop",
      icon: "🏪",
      label: "Shop",
      key: "6",
    },
    {
      id: "factory",
      icon: "🏭",
      label: "Factory",
      key: "7",
    },
    {
      id: "park",
      icon: "🌳",
      label: "Park",
      key: "8",
    },
    {
      id: "tree",
      icon: "🌲",
      label: "Tree",
      key: "2",
    },
    {
      id: "rock",
      icon: "🪨",
      label: "Rock",
      key: "3",
    },
    {
      id: "road",
      icon: "🛣️",
      label: "Road",
      key: "5",
    },
    {
      id: "bulldozer",
      icon: "🗑️",
      label: "Bulldoze",
      key: "4",
    },
  ];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "10px 14px",
          background: "rgba(24, 24, 27, 0.9)",
          borderRadius: "16px",
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {tools.map((tool) => {
          const isSelected = selected === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelect(tool.id)}
              style={{
                width: "72px",
                height: "68px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                borderRadius: "10px",
                border: isSelected
                  ? "2px solid #4ADE80"
                  : "1px solid rgba(255,255,255,0.05)",
                cursor: "pointer",
                background: isSelected
                  ? "rgba(34, 197, 94, 0.25)"
                  : "rgba(255, 255, 255, 0.04)",
                color: isSelected ? "#FFFFFF" : "#D1D5DB",
                transition: "all 0.15s ease",
              }}
              title={`${tool.label} [${tool.key}]`}
            >
              <span style={{ fontSize: "24px", lineHeight: "1" }}>
                {tool.icon}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "0.02em",
                }}
              >
                {tool.label}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: isSelected ? "#86EFAC" : "#9CA3AF",
                  background: "rgba(0,0,0,0.3)",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  lineHeight: "1.2",
                }}
              >
                {tool.key}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          fontSize: "11px",
          color: "#9CA3AF",
          background: "rgba(17, 24, 39, 0.75)",
          padding: "3px 10px",
          borderRadius: "6px",
          letterSpacing: "0.03em",
          pointerEvents: "none",
        }}
      >
        Rotate: [R] | Cancel: [Esc]
      </div>
    </div>
  );
}
