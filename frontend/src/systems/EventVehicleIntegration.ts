import useEventStore from "../store/EventStore";
import useVehicleStore from "../store/VehicleStore";
import useBuildingStore from "../store/BuildingStore";
import { getRoadGraph, findPath } from "./PathfindingSystem";

// This function should be called when an emergency event is dispatched.
// It finds the nearest available vehicle of the appropriate type and sends it.
export function dispatchEmergencyVehicle(eventId: string) {
  const eventStore = useEventStore.getState();
  const event = eventStore.events.find(e => e.id === eventId);
  if (!event) return false;

  const buildingStore = useBuildingStore.getState();
  const buildings = buildingStore.buildings;

  // Determine vehicle type from event type
  let vehicleType: "fire_truck" | "ambulance" | "police_car" | null = null;
  if (event.type === "fire") vehicleType = "fire_truck";
  else if (event.type === "medical") vehicleType = "ambulance";
  else if (event.type === "crime" || event.type === "police") vehicleType = "police_car";
  if (!vehicleType) return false;

  // Find the nearest provider (fire station, hospital, police station)
  const providerType = 
    vehicleType === "fire_truck" ? "fire_station" :
    vehicleType === "ambulance" ? "hospital" :
    "police_station";

  const providers = buildings.filter(b => b.type === providerType);
  if (providers.length === 0) return false;

  // Sort by distance to event location
  const eventPos = event.position;
  providers.sort((a, b) => {
    const distA = Math.hypot(a.position[0] - eventPos[0], a.position[2] - eventPos[2]);
    const distB = Math.hypot(b.position[0] - eventPos[0], b.position[2] - eventPos[2]);
    return distA - distB;
  });

  const vehicleStore = useVehicleStore.getState();
  for (const provider of providers) {
    const available = vehicleStore.getAvailableVehicle(provider.id, vehicleType);
    if (available) {
      // Compute route from provider to event
      const graph = getRoadGraph(buildings);
      const startKey = `${Math.round(provider.position[0])},${Math.round(provider.position[2])}`;
      const endKey = `${Math.round(eventPos[0])},${Math.round(eventPos[2])}`;
      const route = findPath(startKey, endKey, graph);
      if (route && route.length > 0) {
        vehicleStore.spawnVehicle(vehicleType, provider.id, eventId, route, true);
        // Mark vehicle assigned in event? Not needed; event can track via vehicle id.
        return true;
      }
    }
  }
  return false;
}