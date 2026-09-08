import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import useRoadUsageStore from "./RoadUsageStore";

export type VehicleType = "fire_truck" | "ambulance" | "police_car";
export type VehicleStatus = "idle" | "responding" | "at_scene" | "returning";

export interface Vehicle {
  id: string;
  type: VehicleType;
  providerId: number; // building id of fire station, hospital, police station
  eventId: string; // event this vehicle is responding to
  status: VehicleStatus;
  route: string[]; // road cell keys
  routeIndex: number; // current position along route
  position: [number, number, number]; // current world position (interpolated)
  targetPosition: [number, number, number]; // next node position
  speed: number; // cells per hour
  eta: number; // remaining time to destination
  returnRoute?: string[]; // route back to provider
  returnIndex?: number;
}

// Fleet configuration per provider type
const FLEET_SIZES: Record<string, number> = {
  fire_station: 2,
  hospital: 2,
  police_station: 2,
};

// Base speed in cells per hour
const BASE_VEHICLE_SPEED = 4; // cells per hour

interface VehicleStore {
  vehicles: Vehicle[];
  spawnVehicle: (type: VehicleType, providerId: number, eventId: string, route: string[]) => void;
  updateVehicles: (deltaHours: number) => void;
  getAvailableVehicle: (providerId: number, type: VehicleType) => Vehicle | null;
  getVehicleForEvent: (eventId: string) => Vehicle | null;
  returnVehicle: (vehicleId: string) => void;
  clear: () => void;
}

const useVehicleStore = create<VehicleStore>((set, get) => {
  const updateVehicles = (deltaHours: number) => {
    const roadUsage = useRoadUsageStore.getState();
    const vehicles = get().vehicles;
    let updated = false;

    const updatedVehicles = vehicles.map((v) => {
      if (v.status === "idle" || v.status === "at_scene" || v.status === "returning" && v.routeIndex === v.route.length - 1) {
        // Idle or done returning
        return v;
      }

      // Responding or returning
      const isResponding = v.status === "responding";
      const route = isResponding ? v.route : v.returnRoute;
      if (!route || route.length === 0) return v;

      // Calculate speed with traffic congestion factor
      let avgCongestion = 0;
      for (const key of route) {
        const usage = roadUsage.getUsage(key);
        const ratio = usage / 5;
        avgCongestion += Math.min(ratio, 1);
      }
      avgCongestion /= route.length;
      const speedFactor = 1 - avgCongestion * 0.5; // 1 (no congestion) to 0.5 (max)
      const speed = v.speed * speedFactor;

      // Distance to cover in this step
      const dist = speed * deltaHours;
      let remaining = dist;
      let newIndex = v.routeIndex;
      let progress = 0;
      // Move along route
      while (remaining > 0 && newIndex < route.length - 1) {
        // distance to next node (Euclidean)
        const keyA = route[newIndex];
        const keyB = route[newIndex + 1];
        const [ax, az] = keyA.split(',').map(Number);
        const [bx, bz] = keyB.split(',').map(Number);
        const cellDist = Math.hypot(bx - ax, bz - az);
        if (remaining >= cellDist) {
          remaining -= cellDist;
          newIndex++;
        } else {
          // partial progress
          progress = remaining / cellDist;
          remaining = 0;
          // Interpolate position between nodes
          const pos: [number, number, number] = [
            ax + (bx - ax) * progress,
            0.02,
            az + (bz - az) * progress,
          ];
          updated = true;
          return {
            ...v,
            routeIndex: newIndex,
            position: pos,
            targetPosition: [bx, 0.02, bz],
            eta: (route.length - newIndex) / speed,
          } as Vehicle;
        }
      }

      // If we've reached the end of the route
      if (newIndex >= route.length - 1) {
        updated = true;
        if (isResponding) {
          // Arrived at incident
          return {
            ...v,
            status: "at_scene",
            routeIndex: newIndex,
            position: [parseInt(route[route.length-1].split(',')[0]), 0.02, parseInt(route[route.length-1].split(',')[1])],
            targetPosition: [0,0,0],
            eta: 0,
          } as Vehicle;
        } else {
          // Returned to station
          return {
            ...v,
            status: "idle",
            routeIndex: newIndex,
            position: [parseInt(route[route.length-1].split(',')[0]), 0.02, parseInt(route[route.length-1].split(',')[1])],
            targetPosition: [0,0,0],
            eta: 0,
          } as Vehicle;
        }
      }

      // Still on route
      const keyA = route[newIndex];
      const keyB = route[newIndex + 1];
      const [ax, az] = keyA.split(',').map(Number);
      const [bx, bz] = keyB.split(',').map(Number);
      const pos: [number, number, number] = [
        ax + (bx - ax) * progress,
        0.02,
        az + (bz - az) * progress,
      ];
      updated = true;
      return {
        ...v,
        routeIndex: newIndex,
        position: pos,
        targetPosition: [bx, 0.02, bz],
        eta: (route.length - newIndex) / speed,
      } as Vehicle;
    });

    if (updated) {
      set({ vehicles: updatedVehicles });
    }
  };

  return {
    vehicles: [],
    spawnVehicle: (type, providerId, eventId, route) => {
      const providerBuilding = useBuildingStore.getState().buildings.find(b => b.id === providerId);
      if (!providerBuilding) return;
      // Determine fleet size for this provider type
      let fleetSize = 2; // default
      const buildingType = providerBuilding.type;
      if (buildingType === 'fire_station') fleetSize = FLEET_SIZES.fire_station;
      else if (buildingType === 'hospital') fleetSize = FLEET_SIZES.hospital;
      else if (buildingType === 'police_station') fleetSize = FLEET_SIZES.police_station;

      // Count active vehicles from this provider
      const activeVehicles = get().vehicles.filter(v => v.providerId === providerId && v.status !== "idle");
      if (activeVehicles.length >= fleetSize) {
        console.warn(`No available vehicle for provider ${providerId}`);
        return;
      }

      // Get start position: nearest road cell of provider
      const startRoad = route[0];
      const [sx, sz] = startRoad.split(',').map(Number);
      const startPos: [number, number, number] = [sx, 0.02, sz];
      const endRoad = route[route.length - 1];
      const [ex, ez] = endRoad.split(',').map(Number);
      const endPos: [number, number, number] = [ex, 0.02, ez];

      const newVehicle: Vehicle = {
        id: `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        providerId,
        eventId,
        status: "responding",
        route,
        routeIndex: 0,
        position: startPos,
        targetPosition: endPos,
        speed: BASE_VEHICLE_SPEED,
        eta: route.length / BASE_VEHICLE_SPEED,
      };

      set((state) => ({
        vehicles: [...state.vehicles, newVehicle],
      }));
    },
    updateVehicles: (deltaHours) => {
      // We'll handle update in a separate subscription in App
      // For now, we'll call this from App on time change
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
      // Calculate return route from current position to provider
      // For simplicity, we can use the reverse of the original route
      // We'll set status to returning and use the reverse route
      const vehicle = get().vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;
      // Reverse the route (excluding the current node?)
      const returnRoute = [...vehicle.route].reverse();
      // We need to set the vehicle to returning state with the reverse route
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                status: "returning",
                returnRoute: returnRoute,
                returnIndex: 0,
                routeIndex: 0,
                route: returnRoute, // use route as the active path
                position: v.position,
                targetPosition: [parseInt(returnRoute[1]?.split(',')[0] || '0'), 0.02, parseInt(returnRoute[1]?.split(',')[1] || '0')],
                eta: returnRoute.length / v.speed,
              }
            : v
        ),
      }));
    },
    clear: () => {
      set({ vehicles: [] });
    },
  };
});

export default useVehicleStore;