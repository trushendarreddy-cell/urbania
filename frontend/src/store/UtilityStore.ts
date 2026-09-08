import { create } from "zustand";
import useBuildingStore from "./BuildingStore";

export type UtilityType = "electricity" | "water";

export interface UtilityProvider {
  id: string;
  buildingId: number;
  type: UtilityType;
  position: [number, number, number];
  capacity: number;
  radius: number;
}

export interface UtilityConnection {
  electricity: boolean;
  water: boolean;
}

// Demand per building type (units)
const BUILDING_DEMAND: Record<string, { electricity: number; water: number }> = {
  house: { electricity: 1, water: 1 },
  shop: { electricity: 2, water: 1 },
  factory: { electricity: 5, water: 3 },
  park: { electricity: 0, water: 0 },
  tree: { electricity: 0, water: 0 },
  rock: { electricity: 0, water: 0 },
  road: { electricity: 0, water: 0 },
  power_plant: { electricity: 0, water: 0 },
  water_plant: { electricity: 0, water: 0 },
  hospital: { electricity: 2, water: 1 },
  school: { electricity: 2, water: 1 },
  police_station: { electricity: 2, water: 1 },
  fire_station: { electricity: 2, water: 1 },
};

interface UtilityStore {
  providers: UtilityProvider[];
  connections: Record<number, UtilityConnection>; // buildingId -> connection state
  recompute: () => void;
  getUtilityStatus: (buildingId: number) => UtilityConnection | null;
  getProviderInfo: (buildingId: number) => { type: UtilityType; capacity: number; used: number; available: number } | null;
}

const useUtilityStore = create<UtilityStore>((set, get) => {
  const recompute = () => {
    const buildings = useBuildingStore.getState().buildings;
    const providers: UtilityProvider[] = [];
    for (const b of buildings) {
      if (b.type === "power_plant") {
        providers.push({
          id: `power-${b.id}`,
          buildingId: b.id,
          type: "electricity",
          position: b.position,
          capacity: 10,
          radius: 12,
        });
      } else if (b.type === "water_plant") {
        providers.push({
          id: `water-${b.id}`,
          buildingId: b.id,
          type: "water",
          position: b.position,
          capacity: 10,
          radius: 12,
        });
      }
    }

    // Compute demand for each building
    const demandMap: Record<number, { electricity: number; water: number }> = {};
    for (const b of buildings) {
      const demand = BUILDING_DEMAND[b.type || "house"];
      if (demand) {
        demandMap[b.id] = { electricity: demand.electricity, water: demand.water };
      }
    }

    // Assign connections
    const connections: Record<number, UtilityConnection> = {};
    const assigned: Record<string, { electricity: { providerId: string; used: number }[]; water: { providerId: string; used: number }[] }> = {};

    // For each utility type
    for (const type of ["electricity", "water"] as UtilityType[]) {
      const typeProviders = providers.filter(p => p.type === type);
      // Sort providers by buildingId for determinism
      typeProviders.sort((a, b) => a.buildingId - b.buildingId);
      // Track remaining capacity
      const remainingCapacity: Record<string, number> = {};
      for (const p of typeProviders) {
        remainingCapacity[p.id] = p.capacity;
      }

      // Get buildings with demand for this utility
      const buildingsWithDemand = Object.keys(demandMap).map(Number).filter(id => demandMap[id][type] > 0);
      // Sort by position for determinism
    buildingsWithDemand.sort((idA, idB) => {
      const posA = buildings.find(bld => bld.id === idA)?.position || [0,0,0];
      const posB = buildings.find(bld => bld.id === idB)?.position || [0,0,0];
      return (posA[0] + posA[2]) - (posB[0] + posB[2]);
    });

      for (const buildingId of buildingsWithDemand) {
        const building = buildings.find(b => b.id === buildingId);
        if (!building) continue;
        const demand = demandMap[buildingId][type];
        // Find nearest provider with remaining capacity
        let bestProvider: UtilityProvider | null = null;
        let bestDist = Infinity;
        for (const p of typeProviders) {
          if (remainingCapacity[p.id] >= demand) {
            const dx = building.position[0] - p.position[0];
            const dz = building.position[2] - p.position[2];
            const dist = Math.hypot(dx, dz);
            if (dist <= p.radius && dist < bestDist) {
              bestDist = dist;
              bestProvider = p;
            }
          }
        }
        if (bestProvider) {
          remainingCapacity[bestProvider.id] -= demand;
          if (!connections[buildingId]) {
            connections[buildingId] = { electricity: false, water: false };
          }
          if (type === "electricity") {
            connections[buildingId].electricity = true;
          } else {
            connections[buildingId].water = true;
          }
          // Track assignment for provider info
          if (!assigned[bestProvider.id]) {
            assigned[bestProvider.id] = { electricity: [], water: [] };
          }
          assigned[bestProvider.id][type].push({ providerId: bestProvider.id, used: demand });
        } else {
          // Not connected
          if (!connections[buildingId]) {
            connections[buildingId] = { electricity: false, water: false };
          }
          if (type === "electricity") {
            connections[buildingId].electricity = false;
          } else {
            connections[buildingId].water = false;
          }
        }
      }
    }

    // For buildings with no demand, set both false
    for (const bld of buildings) {
      if (!connections[bld.id]) {
        connections[bld.id] = { electricity: false, water: false };
      }
    }

    set({ providers, connections });
  };

  // Subscribe to building changes
  useBuildingStore.subscribe(() => {
    recompute();
  });

  return {
    providers: [],
    connections: {},
    recompute,
    getUtilityStatus: (buildingId: number) => {
      return get().connections[buildingId] || null;
    },
    getProviderInfo: (buildingId: number) => {
      const providers = get().providers;
      const provider = providers.find(p => p.buildingId === buildingId);
      if (!provider) return null;
      // Compute used capacity by summing demand of buildings assigned to this provider
      // We need to track assignments. We'll store assignments in a separate map.
      // For simplicity, we'll compute used by summing demand of all buildings that are connected to this provider's utility type.
      // But we don't have assignment per provider. We'll just return capacity and 0 used for now, or we can compute total demand of all buildings within radius.
      // Let's compute total demand of buildings within radius and with connection.
      const buildings = useBuildingStore.getState().buildings;
      let used = 0;
      const connections = get().connections;
      for (const b of buildings) {
        const demand = BUILDING_DEMAND[b.type || "house"];
        if (!demand) continue;
        const conn = connections[b.id];
        if (!conn) continue;
        const isConnected = provider.type === "electricity" ? conn.electricity : conn.water;
        if (isConnected) {
          const dx = b.position[0] - provider.position[0];
          const dz = b.position[2] - provider.position[2];
          const dist = Math.hypot(dx, dz);
          if (dist <= provider.radius) {
            used += provider.type === "electricity" ? demand.electricity : demand.water;
          }
        }
      }
      const available = Math.max(0, provider.capacity - used);
      return { type: provider.type, capacity: provider.capacity, used, available };
    },
  };
});

export default useUtilityStore;