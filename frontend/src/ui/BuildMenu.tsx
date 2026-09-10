import { useState } from 'react';
import type { BuildTool } from '../types/BuildTool';
import useProgressionStore from '../store/ProgressionStore';

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
    id: 'zoning',
    label: 'Zoning',
    icon: '🗺️',
    tools: [
      { id: 'zone_residential', label: 'Residential', icon: '🏘️', key: 'z' },
      { id: 'zone_commercial', label: 'Commercial', icon: '🏬', key: 'x' },
      { id: 'zone_industrial', label: 'Industrial', icon: '🏗️', key: 'v' },
    ],
  },
  {
    id: 'districts',
    label: 'Districts',
    icon: '📍',
    tools: [
      { id: 'district', label: 'Paint District', icon: '📍', key: 'd' },
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
  const unlockedBuildings = useProgressionStore((state) => state.unlockedBuildings);
  const currentStage = useProgressionStore((state) => state.currentStage);
  const stageNames: Record<string, string> = {
    village: 'Village',
    town: 'Town',
    city: 'City',
    large_city: 'Large City',
    metropolis: 'Metropolis',
  };

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '95vw',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 14px',
          background: 'rgba(12, 12, 16, 0.9)',
          borderRadius: '20px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
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
                  padding: '5px 14px',
                  borderRadius: '12px',
                  border: isExpanded ? '2px solid #4ADE80' : '1px solid rgba(255,255,255,0.06)',
                  background: isExpanded ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: isExpanded ? '#FFFFFF' : '#D1D5DB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{ fontSize: '9px', opacity: 0.5 }}>
                  {isExpanded ? '▲' : '▼'}
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
                    gap: '4px',
                    padding: '6px 10px',
                    background: 'rgba(12, 12, 16, 0.95)',
                    borderRadius: '14px',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    flexWrap: 'nowrap',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.tools.map((tool) => {
                    const isSelected = selected === tool.id;
                    const isUnlocked = unlockedBuildings.includes(tool.id);
                    const isLocked = !isUnlocked;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          if (isUnlocked) {
                            onSelect(tool.id);
                            setExpandedCategory(null);
                          }
                        }}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #4ADE80' : '1px solid rgba(255,255,255,0.06)',
                          background: isSelected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
                          color: isLocked ? '#6B7280' : (isSelected ? '#FFFFFF' : '#D1D5DB'),
                          cursor: isLocked ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit',
                          opacity: isLocked ? 0.6 : 1,
                        }}
                        title={isLocked ? `Unlocks at ${stageNames[currentStage] || ''} stage` : `${tool.label} [${tool.key}]`}
                        onMouseEnter={(e) => {
                          if (!isSelected && isUnlocked) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && isUnlocked) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }}
                      >
                        <span>{tool.icon}</span>
                        <span>{tool.label}</span>
                        {isLocked && <span style={{ fontSize: '11px' }}>🔒</span>}
                        <span style={{ fontSize: '9px', opacity: 0.4, background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>
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
            padding: '5px 14px',
            borderRadius: '12px',
            border: selected === 'bulldozer' ? '2px solid #EF4444' : '1px solid rgba(255,255,255,0.06)',
            background: selected === 'bulldozer' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.04)',
            color: '#D1D5DB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (selected !== 'bulldozer') e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            if (selected !== 'bulldozer') e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
        >
          <span>🗑️</span>
          <span>Bulldoze</span>
          <span style={{ fontSize: '9px', opacity: 0.5 }}>[4]</span>
        </button>
        <button
          onClick={() => onSelect('select')}
          style={{
            padding: '5px 14px',
            borderRadius: '12px',
            border: selected === 'select' ? '2px solid #60A5FA' : '1px solid rgba(255,255,255,0.06)',
            background: selected === 'select' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.04)',
            color: '#D1D5DB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (selected !== 'select') e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            if (selected !== 'select') e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
        >
          <span>👆</span>
          <span>Select</span>
          <span style={{ fontSize: '9px', opacity: 0.5 }}>[0]</span>
        </button>
      </div>
        <div
          style={{
            fontSize: '11px',
            color: '#9CA3AF',
            background: 'rgba(12, 12, 16, 0.7)',
            padding: '4px 14px',
            borderRadius: '12px',
            letterSpacing: '0.05em',
            pointerEvents: 'none',
            fontFamily: 'monospace',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <span style={{ marginRight: '12px' }}>🔄 R: Rotate</span>
          <span>✕ Esc: Cancel</span>
        </div>
    </div>
  );
}