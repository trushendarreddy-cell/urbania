import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import usePopulationStore from "./PopulationStore";

export type ServiceType = "housing" | "recreation" | "healthcare" | "education" | "safety" | "emergency" | "water" | "electricity";
// For now, we'll support recreation, healthcare, education, safety, emergency.
// water, electricity handled by utilities.

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
  getCitizensServed: (buildingId: number) => number;
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
          radius: 8,
        });
      } else if (b.type === "hospital") {
        newProviders.push({
          buildingId: b.id,
          serviceType: "healthcare",
          position: b.position,
          radius: 10,
        });
      } else if (b.type === "school") {
        newProviders.push({
          buildingId: b.id,
          serviceType: "education",
          position: b.position,
          radius: 10,
        });
      } else if (b.type === "police_station") {
        newProviders.push({
          buildingId: b.id,
          serviceType: "safety",
          position: b.position,
          radius: 10,
        });
      } else if (b.type === "fire_station") {
        newProviders.push({
          buildingId: b.id,
          serviceType: "emergency",
          position: b.position,
          radius: 10,
        });
      }
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
  getCitizensServed: (buildingId) => {
      const provider = get().providers.find(p => p.buildingId === buildingId);
      if (!provider) return 0;
      const citizens = usePopulationStore.getState().citizens;
      let count = 0;
      for (const c of citizens) {
        const household = usePopulationStore.getState().households.find(h => h.id === c.householdId);
        if (household) {
          const building = useBuildingStore.getState().buildings.find(b => b.id === household.buildingId);
          if (building) {
            const coverage = get().getCoverage(building.position, provider.serviceType);
            if (coverage.covered && coverage.providerId === buildingId) {
              count++;
            }
          }
        }
      }
      return count;
    },
    recompute,
  };
});

export default useServiceStore;