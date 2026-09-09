import useRoadUsageStore, { getCongestionLevel } from "../store/RoadUsageStore";

export default function TrafficIndicator() {
  const usageMap = useRoadUsageStore((state) => state.usage);
  let totalUsage = 0;
  let roadCount = 0;
  for (const [_, usage] of usageMap.entries()) {
    totalUsage += usage;
    roadCount++;
  }
  const avgUsage = roadCount > 0 ? totalUsage / roadCount : 0;
  const level = getCongestionLevel(avgUsage);
  const color = {
    low: '#4ADE80',
    moderate: '#FBBF24',
    high: '#F97316',
    overloaded: '#EF4444'
  }[level];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF' }}>
      <span>🚦</span>
      <span style={{ color, fontWeight: '600' }}>{level.toUpperCase()}</span>
      <span>({Math.round(avgUsage)})</span>
    </div>
  );
}