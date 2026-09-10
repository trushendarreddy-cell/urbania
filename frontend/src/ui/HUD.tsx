import { useSimulationStore } from '../stores/useSimulationStore';
import usePopulationStore from '../store/PopulationStore';
import useEconomyStore from '../store/EconomyStore';
import TrafficIndicator from './TrafficIndicator';
import useProgressionStore from '../store/ProgressionStore';
import useActivityStore from '../store/ActivityStore';
import useMunicipalStore from '../store/MunicipalStore';
import useCityEventStore from '../store/CityEventStore';
import { useState } from 'react';
import ProgressionPanel from './ProgressionPanel';
import MunicipalPanel from './MunicipalPanel';

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
  const activityLevel = useActivityStore((state) => state.level);
  const timeLabel = useActivityStore((state) => state.timeLabel);
  const treasury = useMunicipalStore((state) => state.treasury);
  const dailyNet = useMunicipalStore((state) => state.dailyNet);
  const cityEvents = useCityEventStore((state) => state.events);
  const setCityEventPanelOpen = useCityEventStore((state) => state.setPanelOpen);
  const activeCityEvents = cityEvents.filter((e) => e.status === "active");
  const criticalCityEvents = activeCityEvents.filter((e) => e.severity === "critical").length;
  const [showProgression, setShowProgression] = useState(false);
  const [showMunicipal, setShowMunicipal] = useState(false);
  const stageNames: Record<string, string> = {
    village: 'Village',
    town: 'Town',
    city: 'City',
    large_city: 'Large City',
    metropolis: 'Metropolis',
  };
  const activityColors: Record<string, string> = {
    QUIET: '#6B7280',
    NORMAL: '#60A5FA',
    BUSY: '#FBBF24',
    PEAK: '#EF4444',
  };
  const timeLabels: Record<string, string> = {
    DAWN: '🌅 Dawn',
    DAY: '☀️ Day',
    DUSK: '🌇 Dusk',
    NIGHT: '🌙 Night',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#9CA3AF' }}>
          <span style={{ color: activityColors[activityLevel] || '#9CA3AF' }}>●</span>
          <span>{activityLevel}</span>
          <span style={{ marginLeft: '4px' }}>{timeLabels[timeLabel] || timeLabel}</span>
        </div>
        <button
          onClick={() => setShowMunicipal(!showMunicipal)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '2px 10px',
            color: '#F3F4F6',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'inherit',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <span>🏛️</span>
          <span>{Math.round(treasury).toLocaleString()}</span>
          <span style={{ color: dailyNet >= 0 ? '#4ADE80' : '#EF4444', fontSize: '10px' }}>
            {dailyNet >= 0 ? '+' : ''}{Math.round(dailyNet)}
          </span>
        </button>
        <button
          onClick={() => setCityEventPanelOpen(true)}
          style={{
            background: criticalCityEvents > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${criticalCityEvents > 0 ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
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
          onMouseLeave={(e) => e.currentTarget.style.background = criticalCityEvents > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)'}
        >
          <span>{criticalCityEvents > 0 ? '🚨' : '⚠️'}</span>
          <span>{activeCityEvents.length}</span>
        </button>
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
      {showMunicipal && <MunicipalPanel />}
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