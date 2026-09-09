import { saveCity, loadCity, hasSave, newCity } from '../services/PersistenceService';
import { useState } from 'react';

export default function CityMenu() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [hasSavedGame, setHasSavedGame] = useState(hasSave());

  const handleSave = () => {
    setSaveStatus('saving');
    const ok = saveCity();
    setSaveStatus(ok ? 'saved' : 'failed');
    if (ok) setHasSavedGame(true);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleLoad = () => {
    if (!hasSavedGame) return;
    const ok = loadCity();
    if (ok) setHasSavedGame(true);
  };

  const handleNewCity = () => {
    newCity();
    setHasSavedGame(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: '8px',
        padding: '6px 12px',
        background: 'rgba(12,12,16,0.88)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={handleSave}
        style={{
          padding: '4px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          color: '#D1D5DB',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      >
        💾 Save
      </button>
      <button
        onClick={handleLoad}
        disabled={!hasSavedGame}
        style={{
          padding: '4px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: hasSavedGame ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          color: hasSavedGame ? '#D1D5DB' : '#6B7280',
          cursor: hasSavedGame ? 'pointer' : 'default',
          fontWeight: '500',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (hasSavedGame) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        }}
        onMouseLeave={(e) => {
          if (hasSavedGame) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
      >
        📂 Load
      </button>
      <button
        onClick={handleNewCity}
        style={{
          padding: '4px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(239,68,68,0.1)',
          color: '#F87171',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
      >
        🗑️ New
      </button>
      {saveStatus !== 'idle' && (
        <span
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            color: saveStatus === 'saved' ? '#4ADE80' : saveStatus === 'failed' ? '#EF4444' : '#FBBF24',
          }}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Failed'}
        </span>
      )}
    </div>
  );
}