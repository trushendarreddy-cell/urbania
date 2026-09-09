import useVehicleStore from "../store/VehicleStore";
import useRoadUsageStore, { getCongestionLevel, ROAD_CAPACITY } from "../store/RoadUsageStore";
import useBuildingStore from "../store/BuildingStore";
import { getRoadGraph } from "../systems/PathfindingSystem";
import { useSimulationStore } from "../stores/useSimulationStore";

export default function TrafficPanel() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const totalVehicles = vehicles.length;
  const emergencyVehicles = vehicles.filter(v => v.isEmergency).length;
  const civilianVehicles = vehicles.filter(v => !v.isEmergency).length;

  const usageMap = useRoadUsageStore((state) => state.usage);
  const roadCount = useBuildingStore((state) => state.buildings.filter(b => b.type === "road")).length;

  let totalUsage = 0;
  let congestedRoads = 0;
  let overloadedRoads = 0;
  for (const [key, usage] of usageMap.entries()) {
    totalUsage += usage;
    const level = getCongestionLevel(usage);
    if (level === 'high' || level === 'overloaded') congestedRoads++;
    if (level === 'overloaded') overloadedRoads++;
  }
  const avgUsage = roadCount > 0 ? totalUsage / roadCount : 0;
  const avgCongestion = roadCount > 0 ? (congestedRoads / roadCount) * 100 : 0;

  const timeOfDay = useSimulationStore((state) => state.timeOfDay);
  const isPaused = useSimulationStore((state) => state.isPaused);
  const speed = useSimulationStore((state) => state.speed);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        padding: "12px 16px",
        background: "rgba(12, 12, 16, 0.88)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#F3F4F6",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        zIndex: 10,
        pointerEvents: "none",
        userSelect: "none",
        lineHeight: "1.6",
        minWidth: "160px",
      }}
    >
      <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "6px", color: "#F9FAFB", letterSpacing: "0.03em" }}>
        🚦 TRAFFIC
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
        <span style={{ color: "#9CA3AF" }}>Vehicles</span>
        <span style={{ textAlign: "right" }}>{totalVehicles}</span>
        <span style={{ color: "#9CA3AF" }}>Emergency</span>
        <span style={{ textAlign: "right" }}>{emergencyVehicles}</span>
        <span style={{ color: "#9CA3AF" }}>Civilian</span>
        <span style={{ textAlign: "right" }}>{civilianVehicles}</span>
        <span style={{ color: "#9CA3AF" }}>Avg Usage</span>
        <span style={{ textAlign: "right" }}>{avgUsage.toFixed(1)}</span>
        <span style={{ color: "#9CA3AF" }}>Congestion</span>
        <span style={{ textAlign: "right" }}>
          <span
            style={{
              color: avgCongestion > 50 ? '#EF4444' : avgCongestion > 25 ? '#FBBF24' : '#4ADE80',
            }}
          >
            {Math.round(avgCongestion)}%
          </span>
        </span>
        <span style={{ color: "#9CA3AF" }}>Overloaded</span>
        <span style={{ textAlign: "right" }}>{overloadedRoads}</span>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "6px", paddingTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Time</span>
          <span>{Math.floor(timeOfDay)}:{String(Math.round((timeOfDay % 1) * 60)).padStart(2, '0')}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Speed</span>
          <span>{isPaused ? '⏸' : `${speed}x`}</span>
        </div>
      </div>
    </div>
  );
}