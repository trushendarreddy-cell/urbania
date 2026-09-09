import { useSimulationStore } from '../stores/useSimulationStore';
import usePopulationStore from '../store/PopulationStore';
import useEconomyStore from '../store/EconomyStore';
import TrafficIndicator from './TrafficIndicator';
import useProgressionStore from '../store/ProgressionStore';
import { useState } from 'react';
import ProgressionPanel from './ProgressionPanel';

export default function HUD() {
  const { day, timeOfDay, isPaused, speed } = useSimulationStore();
  const totalPopulation = usePopulationStore((state) => state.totalPopulation);
  const totalHouseholds = usePopulationStore((state) => state.totalHouseholds);
  const totalMoney = useEconomyStore((state) =>
    Object.values(state.householdMoney).reduce((a, b) => a + b, 0)
  );
  const togglePaused = useSimulationStore((state) => state.togglePaused);
  const cycleSpeed = useSimulationStore((state) => state.cycleSpeed);
  const currentStage = useProgressionStore((state) => state.currentStage);
  const [showProgression, setShowProgression] = useState(false);
  const stageNames: Record<string, string> = {
    village: 'Village',
    town: 'Town',
    city: 'City',
    large_city: 'Large City',
    metropolis: 'Metropolis',
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '6px 24px',
        background: 'rgba(12, 12, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
        color: '#F3F4F6',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        userSelect: 'none',
        pointerEvents: 'none',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '0.08em', color: '#F9FAFB' }}>URBANIA</span>
        <span style={{ color: '#9CA3AF', fontSize: '12px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '12px' }}>DAY {day}</span>
        <span style={{ color: '#9CA3AF', fontSize: '12px', fontFamily: 'monospace' }}>{formatTime(timeOfDay)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>👥</span>
          <span>{totalPopulation}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>🏠</span>
          <span>{totalHouseholds}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>💰</span>
          <span>{Math.round(totalMoney).toLocaleString()}</span>
        </span>
        <TrafficIndicator />
        <button
          onClick={() => setShowProgression(!showProgression)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '2px 10px',
            color: '#F3F4F6',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'inherit',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <span>🏙️</span>
          <span>{stageNames[currentStage] || currentStage}</span>
        </button>
      </div>
      {showProgression && <ProgressionPanel />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
        <button
          onClick={togglePaused}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '4px 14px',
            color: '#F3F4F6',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
            lineHeight: '1.5',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={cycleSpeed}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '4px 14px',
            color: '#F3F4F6',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'inherit',
            fontWeight: '500',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          {speed === 0 ? '0x' : `${speed}x`}
        </button>
      </div>
    </div>
  );
}