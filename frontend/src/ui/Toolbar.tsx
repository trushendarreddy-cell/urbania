import type { BuildMode } from "../types/game";

interface ToolbarProps {
  selected: BuildMode;
  onSelect: (tool: BuildMode) => void;
}

export default function Toolbar({
  selected,
  onSelect,
}: ToolbarProps) {
  const tools: { id: BuildMode; icon: string; label: string }[] = [
    {
      id: "house",
      icon: "🏠",
      label: "House",
    },
    {
      id: "tree",
      icon: "🌳",
      label: "Tree",
    },
    {
      id: "rock",
      icon: "🪨",
      label: "Rock",
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
        gap: "12px",

        padding: "12px 16px",

        background: "rgba(35,35,35,0.9)",

        borderRadius: "14px",

        boxShadow:
          "0 6px 18px rgba(0,0,0,0.35)",
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onSelect(tool.id)}
          style={{
            width: "64px",
            height: "64px",

            fontSize: "30px",

            borderRadius: "12px",

            border: "none",

            cursor: "pointer",

            background:
              selected === tool.id
                ? "#58B368"
                : "#ECECEC",

            transition: "0.2s",
          }}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}