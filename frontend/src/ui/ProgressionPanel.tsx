import useProgressionStore from '../store/ProgressionStore';
import useCityStatsStore from '../store/CityStatsStore';

export default function ProgressionPanel() {
  const { currentStage, getNextStage, getStageRequirements, getMilestones } = useProgressionStore();
  const stats = useCityStatsStore();
  const stageNames: Record<string, string> = {
    village: 'Village',
    town: 'Town',
    city: 'City',
    large_city: 'Large City',
    metropolis: 'Metropolis',
  };
  const nextStage = getNextStage();
  const requirements = getStageRequirements();
  const milestones = getMilestones();

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        background: 'rgba(12, 12, 16, 0.92)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '20px 24px',
        color: '#F3F4F6',
        fontFamily: 'Inter, system-ui, sans-serif',
        maxWidth: '420px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#F9FAFB' }}>City Progression</h2>
        <span style={{ fontSize: '14px', color: '#9CA3AF' }}>
          {stageNames[currentStage] || currentStage}
        </span>
      </div>

      {/* Progress to next stage */}
      {nextStage && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9CA3AF' }}>
            <span>Next: {stageNames[nextStage.id]}</span>
            <span>{(stats.population / 50 * 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (stats.population / 50) * 100)}%`, height: '100%', background: '#4ADE80', borderRadius: '3px' }} />
          </div>
        </div>
      )}

      {/* Requirements for current stage */}
      {requirements.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#D1D5DB' }}>Requirements</div>
          {requirements.map((req, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '2px 0' }}>
              <span style={{ color: req.met ? '#4ADE80' : '#EF4444' }}>{req.met ? '✓' : '✗'}</span>
              <span style={{ color: req.met ? '#D1D5DB' : '#9CA3AF' }}>{req.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Milestones */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#D1D5DB' }}>Milestones</div>
        {milestones.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: m.completed ? '#4ADE80' : '#6B7280' }}>{m.completed ? '✅' : '⏳'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: m.completed ? '#F9FAFB' : '#9CA3AF' }}>{m.name}</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.description}</div>
            </div>
            {m.completed && <span style={{ fontSize: '11px', color: '#4ADE80' }}>Completed</span>}
          </div>
        ))}
      </div>
    </div>
  );
}