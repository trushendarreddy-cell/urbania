import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import usePopulationStore from "./PopulationStore";

export type ServiceType = "housing" | "recreation" | "healthcare" | "education" | "safety" | "water" | "electricity";

export interface ServiceProvider {
  buildingId: number;
  serviceType: ServiceType;
  position: [number, number, number];
  radius: number;
}

interface ServiceStore {
  providers: ServiceProvider[];
  registerProvider: (buildingId: number, serviceType: ServiceType, position: [number, number, number], radius: number) => void;
  unregisterProvider: (buildingId: number) => void;
  getCoverage: (position: [number, number, number], serviceType: ServiceType) => { covered: boolean; providerId: number | null; distance: number | null };
  getProvidersForService: (serviceType: ServiceType) => ServiceProvider[];
  getHouseholdsServed: (buildingId: number) => number;
  recompute: () => void;
}

const useServiceStore = create<ServiceStore>((set, get) => {
  const recompute = () => {
    // Re-register providers from current buildings
    const buildings = useBuildingStore.getState().buildings;
    // Clear all providers and re-add based on buildings
    const newProviders: ServiceProvider[] = [];
    for (const b of buildings) {
      if (b.type === "park") {
        newProviders.push({
          buildingId: b.id,
          serviceType: "recreation",
          position: b.position,
          radius: 8, // coverage radius in tiles
        });
      }
      // Future: add hospital, school, etc.
    }
    set({ providers: newProviders });
  };

  // Subscribe to building changes to keep providers in sync
  useBuildingStore.subscribe(() => {
    recompute();
  });

  return {
    providers: [],
    registerProvider: (buildingId, serviceType, position, radius) => {
      set((state) => ({
        providers: [
          ...state.providers.filter(p => p.buildingId !== buildingId),
          { buildingId, serviceType, position, radius },
        ],
      }));
    },
    unregisterProvider: (buildingId) => {
      set((state) => ({
        providers: state.providers.filter(p => p.buildingId !== buildingId),
      }));
    },
    getCoverage: (position, serviceType) => {
      const providers = get().providers.filter(p => p.serviceType === serviceType);
      let bestProvider: ServiceProvider | null = null;
      let minDist = Infinity;
      for (const p of providers) {
        const dx = position[0] - p.position[0];
        const dz = position[2] - p.position[2];
        const dist = Math.hypot(dx, dz);
        if (dist <= p.radius && dist < minDist) {
          minDist = dist;
          bestProvider = p;
        }
      }
      if (bestProvider) {
        return { covered: true, providerId: bestProvider.buildingId, distance: minDist };
      }
      return { covered: false, providerId: null, distance: null };
    },
    getProvidersForService: (serviceType) => {
      return get().providers.filter(p => p.serviceType === serviceType);
    },
    getHouseholdsServed: (buildingId) => {
      // Count households within coverage of this provider
      const provider = get().providers.find(p => p.buildingId === buildingId);
      if (!provider) return 0;
      const households = usePopulationStore.getState().households;
      let count = 0;
      for (const h of households) {
        const building = useBuildingStore.getState().buildings.find(b => b.id === h.buildingId);
        if (building) {
          const coverage = get().getCoverage(building.position, provider.serviceType);
          if (coverage.covered && coverage.providerId === buildingId) {
            count++;
          }
        }
      }
      return count;
    },
    recompute,
  };
});

export default useServiceStore;