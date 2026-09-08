import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";

export interface Household {
  id: string;
  buildingId: number;
  population: number;
}

interface PopulationStore {
  households: Household[];
  totalPopulation: number;
  totalHouseholds: number;
  activePopulation: number;
  totalJobs: number;
  employed: number;
  unemployed: number;
  addHousehold: (buildingId: number) => void;
  removeHousehold: (buildingId: number) => void;
  initialize: () => void;
  recompute: () => void;
}

const usePopulationStore = create<PopulationStore>((set, get) => {
  const recompute = () => {
    const households = get().households;
    const buildings = useBuildingStore.getState().buildings;
    let totalPop = 0;
    let activePop = 0;
    for (const h of households) {
      totalPop += h.population;
      const building = buildings.find(b => b.id === h.buildingId);
      if (building && hasRoadAccess(building.position, buildings)) {
        activePop += h.population;
      }
    }

    // Compute jobs from shops and factories
    let totalJobs = 0;
    for (const b of buildings) {
      if (b.type === "shop") totalJobs += 2;
      else if (b.type === "factory") totalJobs += 5;
    }
    const employed = Math.min(activePop, totalJobs);
    const unemployed = activePop - employed;

    set({
      totalPopulation: totalPop,
      totalHouseholds: households.length,
      activePopulation: activePop,
      totalJobs,
      employed,
      unemployed,
    });
  };

  // Subscribe to building changes to update active population
  useBuildingStore.subscribe(() => {
    recompute();
  });

  return {
    households: [],
    totalPopulation: 0,
    totalHouseholds: 0,
    activePopulation: 0,
    totalJobs: 0,
    employed: 0,
    unemployed: 0,

    addHousehold: (buildingId) => {
      const existing = get().households.find(h => h.buildingId === buildingId);
      if (existing) return;
      set((state) => ({
        households: [
          ...state.households,
          { id: `household-${buildingId}`, buildingId, population: 4 },
        ],
      }));
      recompute();
    },

    removeHousehold: (buildingId) => {
      set((state) => ({
        households: state.households.filter(h => h.buildingId !== buildingId),
      }));
      recompute();
    },

    initialize: () => {
      const buildings = useBuildingStore.getState().buildings;
      const existingIds = get().households.map(h => h.buildingId);
      for (const b of buildings) {
        if (b.type === "house" && !existingIds.includes(b.id)) {
          get().addHousehold(b.id);
        }
      }
      recompute();
    },

    recompute,
  };
});

export default usePopulationStore;