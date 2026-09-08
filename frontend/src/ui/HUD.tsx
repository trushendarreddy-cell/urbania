import { useSimulationStore } from '../stores/useSimulationStore';
import usePopulationStore from '../store/PopulationStore';
import useEconomyStore from '../store/EconomyStore';

export default function HUD() {
  const { day, timeOfDay, isPaused, speed } = useSimulationStore();
  const totalPopulation = usePopulationStore((state) => state.totalPopulation);
  const totalHouseholds = usePopulationStore((state) => state.totalHouseholds);
  const totalMoney = useEconomyStore((state) =>
    Object.values(state.householdMoney).reduce((a, b) => a + b, 0)
  );
  const togglePaused = useSimulationStore((state) => state.togglePaused);
  const cycleSpeed = useSimulationStore((state) => state.cycleSpeed);

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
        padding: '8px 20px',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
        color: '#F3F4F6',
        fontFamily: 'monospace',
        fontSize: '13px',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontWeight: '700', fontSize: '16px', letterSpacing: '0.05em' }}>URBANIA</span>
        <span style={{ color: '#9CA3AF' }}>Day {day}</span>
        <span style={{ color: '#9CA3AF' }}>{formatTime(timeOfDay)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>👥 {totalPopulation}</span>
        <span>🏠 {totalHouseholds}</span>
        <span>💰 {Math.round(totalMoney)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
        <button
          onClick={togglePaused}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#F3F4F6',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'monospace',
          }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={cycleSpeed}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#F3F4F6',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'monospace',
          }}
        >
          {speed === 0 ? '0x' : `${speed}x`}
        </button>
      </div>
    </div>
  );
}