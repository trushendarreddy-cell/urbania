import { useState } from 'react';
import type { BuildTool } from '../types/BuildTool';

interface BuildMenuProps {
  selected: BuildTool;
  onSelect: (tool: BuildTool) => void;
}

type Category = {
  id: string;
  label: string;
  icon: string;
  tools: {
    id: BuildTool;
    label: string;
    icon: string;
    key: string;
  }[];
};

const categories: Category[] = [
  {
    id: 'residential',
    label: 'Residential',
    icon: '🏠',
    tools: [
      { id: 'house', label: 'House', icon: '🏠', key: '1' },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: '🏪',
    tools: [
      { id: 'shop', label: 'Shop', icon: '🏪', key: '6' },
    ],
  },
  {
    id: 'industrial',
    label: 'Industrial',
    icon: '🏭',
    tools: [
      { id: 'factory', label: 'Factory', icon: '🏭', key: '7' },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: '🏛️',
    tools: [
      { id: 'park', label: 'Park', icon: '🌳', key: '8' },
      { id: 'hospital', label: 'Hospital', icon: '🏥', key: 'h' },
      { id: 'school', label: 'School', icon: '🎓', key: 's' },
      { id: 'police_station', label: 'Police', icon: '🛡️', key: 'p' },
      { id: 'fire_station', label: 'Fire', icon: '🔥', key: 'f' },
    ],
  },
  {
    id: 'decoration',
    label: 'Decoration',
    icon: '🌲',
    tools: [
      { id: 'tree', label: 'Tree', icon: '🌲', key: '2' },
      { id: 'rock', label: 'Rock', icon: '🪨', key: '3' },
    ],
  },
  {
    id: 'roads',
    label: 'Roads',
    icon: '🛣️',
    tools: [
      { id: 'road', label: 'Road', icon: '🛣️', key: '5' },
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: '⚡',
    tools: [
      { id: 'power_plant', label: 'Power', icon: '⚡', key: '9' },
      { id: 'water_plant', label: 'Water', icon: '💧', key: '0' },
    ],
  },
];

export default function BuildMenu({ selected, onSelect }: BuildMenuProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '90vw',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 12px',
          background: 'rgba(24, 24, 27, 0.92)',
          borderRadius: '16px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.id;
          return (
            <div key={cat.id} style={{ position: 'relative' }}>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: isExpanded ? '2px solid #4ADE80' : '1px solid rgba(255,255,255,0.05)',
                  background: isExpanded ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: '#D1D5DB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              {isExpanded && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    padding: '8px 10px',
                    background: 'rgba(24, 24, 27, 0.95)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    flexWrap: 'nowrap',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.tools.map((tool) => {
                    const isSelected = selected === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onSelect(tool.id);
                          setExpandedCategory(null);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #4ADE80' : '1px solid rgba(255,255,255,0.05)',
                          background: isSelected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                          color: isSelected ? '#FFFFFF' : '#D1D5DB',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.15s ease',
                        }}
                        title={`${tool.label} [${tool.key}]`}
                      >
                        <span>{tool.icon}</span>
                        <span>{tool.label}</span>
                        <span style={{ fontSize: '9px', opacity: 0.5, background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '4px' }}>
                          {tool.key}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {/* Bulldozer always visible */}
        <button
          onClick={() => onSelect('bulldozer')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: selected === 'bulldozer' ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.05)',
            background: selected === 'bulldozer' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
            color: '#D1D5DB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <span>🗑️</span>
          <span>Bulldoze</span>
          <span style={{ fontSize: '10px', opacity: 0.6 }}>[4]</span>
        </button>
        <button
          onClick={() => onSelect('select')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: selected === 'select' ? '2px solid #60A5FA' : '1px solid rgba(255,255,255,0.05)',
            background: selected === 'select' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.04)',
            color: '#D1D5DB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <span>👆</span>
          <span>Select</span>
          <span style={{ fontSize: '10px', opacity: 0.6 }}>[0]</span>
        </button>
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#9CA3AF',
          background: 'rgba(17, 24, 39, 0.75)',
          padding: '3px 10px',
          borderRadius: '6px',
          letterSpacing: '0.03em',
          pointerEvents: 'none',
        }}
      >
        Rotate: [R] | Cancel: [Esc]
      </div>
    </div>
  );
}