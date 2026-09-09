import useBuildingStore from "../store/BuildingStore";
import useVehicleStore from "../store/VehicleStore";
import useRoadUsageStore from "../store/RoadUsageStore";
import { getRoadGraph, findPathWithTraffic } from "./PathfindingSystem";

const MAX_CIVILIAN_VEHICLES = 50;
const SPAWN_INTERVAL_HOURS = 0.2; // spawn every 0.2 hours (12 minutes)

let lastSpawnTime = 0;

export function updateTrafficSystem(deltaHours: number, timeOfDay: number) {
  const vehicleStore = useVehicleStore.getState();
  const currentCount = vehicleStore.getVehicleCount();
  const civilianCount = vehicleStore.getVehiclesByType("car").length;

  // Only spawn if not at max
  if (civilianCount < MAX_CIVILIAN_VEHICLES) {
    lastSpawnTime += deltaHours;
    if (lastSpawnTime >= SPAWN_INTERVAL_HOURS) {
      lastSpawnTime = 0;
      spawnCivilianVehicle();
    }
  }
}

function spawnCivilianVehicle() {
  const buildings = useBuildingStore.getState().buildings;
  const roadGraph = getRoadGraph(buildings);
  const roadKeys = Array.from(roadGraph.keys());
  if (roadKeys.length < 2) return;

  // Pick two distinct road keys at least 3 cells apart
  let startKey, endKey;
  let attempts = 0;
  do {
    startKey = roadKeys[Math.floor(Math.random() * roadKeys.length)];
    endKey = roadKeys[Math.floor(Math.random() * roadKeys.length)];
    attempts++;
  } while ((startKey === endKey || getManhattanDistance(startKey, endKey) < 3) && attempts < 50);

  if (startKey === endKey) return;

  const getUsage = (key: string) => useRoadUsageStore.getState().getUsage(key);
  const route = findPathWithTraffic(startKey, endKey, roadGraph, getUsage);
  if (!route || route.length < 2) return;

  // Spawn civilian car
  useVehicleStore.getState().spawnVehicle(
    "car",
    undefined,
    undefined,
    route,
    false // isEmergency false
  );
}

function getManhattanDistance(keyA: string, keyB: string): number {
  const [ax, az] = keyA.split(',').map(Number);
  const [bx, bz] = keyB.split(',').map(Number);
  return Math.abs(ax - bx) + Math.abs(az - bz);
}

// Cleanup function for when simulation resets
export function resetTrafficSystem() {
  lastSpawnTime = 0;
}