import useVehicleStore from "../store/VehicleStore";
import useRoadUsageStore from "../store/RoadUsageStore";

// Periodically clean up stale road usage by comparing with active vehicles
// This is a safety net; vehicles should already clean up their own usage.
export function cleanRoadUsage() {
  const vehicles = useVehicleStore.getState().vehicles;
  const activeRoadKeys = new Set<string>();
  for (const v of vehicles) {
    if (v.route) {
      for (const key of v.route) {
        activeRoadKeys.add(key);
      }
    }
    if (v.returnRoute) {
      for (const key of v.returnRoute) {
        activeRoadKeys.add(key);
      }
    }
  }
  const usageStore = useRoadUsageStore.getState();
  const currentUsage = usageStore.usage;
  // Iterate over a copy of keys
  const toRemove: string[] = [];
  for (const [key] of currentUsage.entries()) {
    if (!activeRoadKeys.has(key)) {
      toRemove.push(key);
    }
  }
  if (toRemove.length > 0) {
    // Decrement and remove
    for (const key of toRemove) {
      usageStore.decrement(key); // will delete if usage goes to 0
    }
  }
}