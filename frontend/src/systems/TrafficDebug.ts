import useVehicleStore from "../store/VehicleStore";
import useRoadUsageStore from "../store/RoadUsageStore";

export function logTrafficState() {
  const vehicles = useVehicleStore.getState().vehicles;
  const usage = useRoadUsageStore.getState().usage;
  console.log(`[Traffic] ${vehicles.length} vehicles, ${usage.size} roads with usage`);
  for (const v of vehicles) {
    console.log(`  ${v.type} ${v.status} ${v.position}`);
  }
}