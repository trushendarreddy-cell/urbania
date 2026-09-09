import useServiceStore from "../store/ServiceStore";
import useBuildingStore from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import { useSimulationStore } from "../stores/useSimulationStore";

export default function ServiceOverview() {
  const buildings = useBuildingStore((state) => state.buildings);
  const households = usePopulationStore((state) => state.households);
  const serviceStore = useServiceStore.getState();
  const { isPaused } = useSimulationStore();

  // Active households (with road access)
  const activeHouseholds = households.filter(h => {
    const b = buildings.find(bld => bld.id === h.buildingId);
    return b && hasRoadAccess(b.position, buildings);
  });

  const serviceTypes: Array<'recreation' | 'healthcare' | 'education' | 'safety' | 'emergency'> = ['recreation', 'healthcare', 'education', 'safety', 'emergency'];
  const serviceLabels: Record<string, string> = {
    recreation: 'Recreation',
    healthcare: 'Healthcare',
    education: 'Education',
    safety: 'Safety',
    emergency: 'Emergency'
  };
  const serviceIcons: Record<string, string> = {
    recreation: '🌳',
    healthcare: '🏥',
    education: '📚',
    safety: '👮',
    emergency: '🚒'
  };

  const coverageData = serviceTypes.map(type => {
    const providers = serviceStore.getProvidersForService(type);
    let covered = 0;
    for (const h of activeHouseholds) {
      const building = buildings.find(b => b.id === h.buildingId);
      if (!building) continue;
      const cov = serviceStore.getCoverage(building.position, type);
      if (cov.covered) covered++;
    }
    const total = activeHouseholds.length;
    const coverage = total > 0 ? (covered / total) * 100 : 0;
    return { type, label: serviceLabels[type], icon: serviceIcons[type], coverage, providers: providers.length };
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '24px',
        padding: '12px 16px',
        background: 'rgba(12, 12, 16, 0.88)',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: '#F3F4F6',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        zIndex: 10,
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: '1.6',
        minWidth: '180px',
        maxWidth: '220px',
      }}
    >
      <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', color: '#F9FAFB', letterSpacing: '0.03em' }}>
        🏛️ SERVICES
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {coverageData.map(({ type, label, icon, coverage, providers }) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span style={{ color: '#9CA3AF', width: '70px' }}>{label}</span>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(coverage, 100)}%`,
                  height: '100%',
                  background: coverage > 70 ? '#4ADE80' : coverage > 40 ? '#FBBF24' : '#EF4444',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '10px', color: '#9CA3AF', minWidth: '30px', textAlign: 'right' }}>
              {providers > 0 ? `${Math.round(coverage)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
      {isPaused && (
        <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px', color: '#FACC15', fontSize: '10px' }}>
          ⏸ Paused
        </div>
      )}
    </div>
  );
}