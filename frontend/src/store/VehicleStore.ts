import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import useRoadUsageStore from "./RoadUsageStore";

export type VehicleType = "fire_truck" | "ambulance" | "police_car" | "car";
export type VehicleStatus = "idle" | "responding" | "at_scene" | "returning" | "traveling";

export interface Vehicle {
  id: string;
  type: VehicleType;
  providerId?: number; // optional for civilian cars
  eventId?: string; // optional for civilian cars
  status: VehicleStatus;
  route: string[];
  routeIndex: number;
  position: [number, number, number];
  targetPosition: [number, number, number];
  speed: number;
  eta: number;
  returnRoute?: string[];
  returnIndex?: number;
  isEmergency: boolean; // true for emergency vehicles, false for civilian
}

const FLEET_SIZES: Record<string, number> = {
  fire_station: 2,
  hospital: 2,
  police_station: 2,
};

const BASE_VEHICLE_SPEED = 4;
const CIVILIAN_SPEED = 3;

interface VehicleStore {
  vehicles: Vehicle[];
  spawnVehicle: (
    type: VehicleType,
    providerId: number | undefined,
    eventId: string | undefined,
    route: string[],
    isEmergency?: boolean
  ) => void;
  updateVehicles: (deltaHours: number) => void;
  getAvailableVehicle: (providerId: number, type: VehicleType) => Vehicle | null;
  getVehicleForEvent: (eventId: string) => Vehicle | null;
  returnVehicle: (vehicleId: string) => void;
  removeVehicle: (vehicleId: string) => void;
  clear: () => void;
  getVehicleCount: () => number;
  getVehiclesByType: (type: VehicleType) => Vehicle[];
  getVehicles: () => Vehicle[]; // added for debugging/UI
}

const useVehicleStore = create<VehicleStore>((set, get) => {
  const incrementRouteUsage = (route: string[]) => {
    const usageStore = useRoadUsageStore.getState();
    for (const key of route) {
      usageStore.increment(key);
    }
  };

  const decrementRouteUsage = (route: string[]) => {
    const usageStore = useRoadUsageStore.getState();
    for (const key of route) {
      usageStore.decrement(key);
    }
  };

  const isValidRoute = (route: string[]): boolean => {
    const buildings = useBuildingStore.getState().buildings;
    const roadSet = new Set(
      buildings
        .filter(b => b.type === "road")
        .map(b => `${Math.round(b.position[0])},${Math.round(b.position[2])}`)
    );
    for (const key of route) {
      if (!roadSet.has(key)) return false;
    }
    return true;
  };

  const updateVehicles = (deltaHours: number) => {
    const roadUsage = useRoadUsageStore.getState();
    const vehicles = get().vehicles;
    let updated = false;
    const updatedVehicles: Vehicle[] = [];

    for (const v of vehicles) {
      if (v.status === "idle" || v.status === "at_scene") {
        updatedVehicles.push(v);
        continue;
      }

      // If route invalid, remove vehicle
      if (!isValidRoute(v.route)) {
        decrementRouteUsage(v.route);
        updated = true;
        continue; // skip adding
      }

      const isResponding = v.status === "responding" || v.status === "traveling";
      const route = isResponding ? v.route : v.returnRoute;
      if (!route || route.length === 0) {
        updatedVehicles.push(v);
        continue;
      }

      // Speed with congestion
      let avgCongestion = 0;
      for (const key of route) {
        const usage = roadUsage.getUsage(key);
        const ratio = usage / 5;
        avgCongestion += Math.min(ratio, 1);
      }
      avgCongestion /= route.length;
      let speedFactor;
      if (v.isEmergency) {
        // Emergency vehicles get priority: less congestion penalty
        speedFactor = 1 - avgCongestion * 0.2; // 1 to 0.8
      } else {
        speedFactor = 1 - avgCongestion * 0.5; // 1 to 0.5
      }
      const speed = v.speed * speedFactor;

      let remaining = speed * deltaHours;
      let newIndex = v.routeIndex;
      let progress = 0;
      let pushed = false;
      while (remaining > 0 && newIndex < route.length - 1) {
        const keyA = route[newIndex];
        const keyB = route[newIndex + 1];
        const [ax, az] = keyA.split(',').map(Number);
        const [bx, bz] = keyB.split(',').map(Number);
        const cellDist = Math.hypot(bx - ax, bz - az);
        if (remaining >= cellDist) {
          remaining -= cellDist;
          newIndex++;
        } else {
          progress = remaining / cellDist;
          remaining = 0;
          const pos: [number, number, number] = [
            ax + (bx - ax) * progress,
            0.02,
            az + (bz - az) * progress,
          ];
          updated = true;
          pushed = true;
          updatedVehicles.push({
            ...v,
            routeIndex: newIndex,
            position: pos,
            targetPosition: [bx, 0.02, bz],
            eta: (route.length - newIndex) / speed,
          });
          break;
        }
      }

      // If we finished the loop without breaking, we reached the end
      if (remaining >= 0 && newIndex >= route.length - 1) {
        updated = true;
        if (isResponding && v.isEmergency) {
          // Emergency arrived at scene
          decrementRouteUsage(v.route);
          updatedVehicles.push({
            ...v,
            status: "at_scene",
            routeIndex: newIndex,
            position: [
              parseInt(route[route.length - 1].split(',')[0]),
              0.02,
              parseInt(route[route.length - 1].split(',')[1]),
            ],
            targetPosition: [0, 0, 0],
            eta: 0,
          });
        } else if (isResponding && !v.isEmergency) {
          // Civilian car reached destination -> despawn
          decrementRouteUsage(v.route);
          updated = true;
          // do not add to updatedVehicles
        } else {
          // Returning to station (emergency only)
          decrementRouteUsage(v.route);
          updatedVehicles.push({
            ...v,
            status: "idle",
            routeIndex: newIndex,
            position: [
              parseInt(route[route.length - 1].split(',')[0]),
              0.02,
              parseInt(route[route.length - 1].split(',')[1]),
            ],
            targetPosition: [0, 0, 0],
            eta: 0,
          });
        }
      } else {
        if (!pushed && remaining >= 0 && newIndex < route.length - 1) {
          // need to compute position for remaining
          const keyA = route[newIndex];
          const keyB = route[newIndex + 1];
          const [ax, az] = keyA.split(',').map(Number);
          const [bx, bz] = keyB.split(',').map(Number);
          const pos: [number, number, number] = [
            ax + (bx - ax) * progress,
            0.02,
            az + (bz - az) * progress,
          ];
          updatedVehicles.push({
            ...v,
            routeIndex: newIndex,
            position: pos,
            targetPosition: [bx, 0.02, bz],
            eta: (route.length - newIndex) / speed,
          });
          updated = true;
        }
      }
    }

    if (updated) {
      set({ vehicles: updatedVehicles });
    }
  };

  return {
    vehicles: [],
    spawnVehicle: (type, providerId, eventId, route, isEmergency = false) => {
      // Determine speed
      const speed = isEmergency ? BASE_VEHICLE_SPEED : CIVILIAN_SPEED;

      // For emergency vehicles, check fleet capacity
      if (isEmergency && providerId !== undefined) {
        const providerBuilding = useBuildingStore.getState().buildings.find(b => b.id === providerId);
        if (!providerBuilding) return;
        let fleetSize = 2;
        const buildingType = providerBuilding.type;
        if (buildingType === 'fire_station') fleetSize = FLEET_SIZES.fire_station;
        else if (buildingType === 'hospital') fleetSize = FLEET_SIZES.hospital;
        else if (buildingType === 'police_station') fleetSize = FLEET_SIZES.police_station;
        const activeVehicles = get().vehicles.filter(v => v.providerId === providerId && v.status !== "idle");
        if (activeVehicles.length >= fleetSize) {
          console.warn(`No available vehicle for provider ${providerId}`);
          return;
        }
      }

      const startRoad = route[0];
      const [sx, sz] = startRoad.split(',').map(Number);
      const startPos: [number, number, number] = [sx, 0.02, sz];
      const endRoad = route[route.length - 1];
      const [ex, ez] = endRoad.split(',').map(Number);
      const endPos: [number, number, number] = [ex, 0.02, ez];
      // Ensure route is valid before registering
      if (!isValidRoute(route)) return;

      const newVehicle: Vehicle = {
        id: `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        providerId,
        eventId,
        status: isEmergency ? "responding" : "traveling",
        route,
        routeIndex: 0,
        position: startPos,
        targetPosition: endPos,
        speed,
        eta: route.length / speed,
        isEmergency,
      };

      // Register road usage (only if route is valid)
      incrementRouteUsage(route);

      set((state) => ({
        vehicles: [...state.vehicles, newVehicle],
      }));
    },
    updateVehicles: (deltaHours) => {
      updateVehicles(deltaHours);
    },
    getAvailableVehicle: (providerId, type) => {
      const vehicles = get().vehicles;
      return vehicles.find(v => v.providerId === providerId && v.type === type && v.status === "idle") || null;
    },
    getVehicleForEvent: (eventId) => {
      return get().vehicles.find(v => v.eventId === eventId) || null;
    },
    returnVehicle: (vehicleId) => {
      const vehicle = get().vehicles.find(v => v.id === vehicleId);
      if (!vehicle || !vehicle.isEmergency) return;
      const returnRoute = [...vehicle.route].reverse();
      // Remove current route usage (will be re-added when returning)
      decrementRouteUsage(vehicle.route);
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                status: "returning",
                returnRoute: returnRoute,
                returnIndex: 0,
                routeIndex: 0,
                route: returnRoute,
                position: v.position,
                targetPosition: [
                  parseInt(returnRoute[1]?.split(',')[0] || '0'),
                  0.02,
                  parseInt(returnRoute[1]?.split(',')[1] || '0'),
                ],
                eta: returnRoute.length / v.speed,
              }
            : v
        ),
      }));
      // Register usage for return route
      incrementRouteUsage(returnRoute);
    },
    removeVehicle: (vehicleId) => {
      const vehicle = get().vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        decrementRouteUsage(vehicle.route);
        set((state) => ({
          vehicles: state.vehicles.filter(v => v.id !== vehicleId),
        }));
      }
    },
    clear: () => {
      const vehicles = get().vehicles;
      for (const v of vehicles) {
        decrementRouteUsage(v.route);
      }
      set({ vehicles: [] });
    },
    getVehicleCount: () => {
      return get().vehicles.length;
    },
    getVehiclesByType: (type) => {
      return get().vehicles.filter(v => v.type === type);
    },
    // For debugging: get all vehicles
    getVehicles: () => get().vehicles,
  };
});

export default useVehicleStore;