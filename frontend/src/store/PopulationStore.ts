import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";

export interface Household {
  id: string;
  buildingId: number;
  population: number;
}

export interface Citizen {
  id: string;
  householdId: string;
  age: number;
  employmentStatus: "employed" | "unemployed" | "inactive";
  jobId?: string;
  // activity is derived, not stored
}

interface PopulationStore {
  households: Household[];
  citizens: Citizen[];
  totalPopulation: number;
  totalHouseholds: number;
  activePopulation: number;
  totalJobs: number;
  employed: number;
  unemployed: number;
  totalCitizens: number;
  activeCitizens: number;
  addHousehold: (buildingId: number) => void;
  removeHousehold: (buildingId: number) => void;
  initialize: () => void;
  recompute: () => void;
}

const usePopulationStore = create<PopulationStore>((set, get) => {
  const recompute = () => {
    const households = get().households;
    const citizens = get().citizens;
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
    // Build job slots: for each shop/factory, add capacity slots with buildingId
    const jobSlots: Array<{ buildingId: number }> = [];
    for (const b of buildings) {
      if (b.type === "shop") {
        const capacity = 2;
        totalJobs += capacity;
        for (let i = 0; i < capacity; i++) {
          jobSlots.push({ buildingId: b.id });
        }
      } else if (b.type === "factory") {
        const capacity = 5;
        totalJobs += capacity;
        for (let i = 0; i < capacity; i++) {
          jobSlots.push({ buildingId: b.id });
        }
      }
    }
    const employedCount = Math.min(activePop, totalJobs);
    const unemployedCount = activePop - employedCount;

    // Update citizen employment statuses and assign jobIds
    // Get all adult citizens (age >= 18) from active households
    const activeHouseholdIds = households
      .filter(h => {
        const building = buildings.find(b => b.id === h.buildingId);
        return building && hasRoadAccess(building.position, buildings);
      })
      .map(h => h.id);
    const adultCitizens = citizens
      .filter(c => activeHouseholdIds.includes(c.householdId) && c.age >= 18)
      .sort((a, b) => a.id.localeCompare(b.id)); // deterministic order

    // Assign employed status and jobId to the first 'employedCount' adults
    const employedSet = new Set<string>();
    const jobAssignments: Record<string, number> = {}; // citizenId -> buildingId
    for (let i = 0; i < Math.min(employedCount, adultCitizens.length, jobSlots.length); i++) {
      const citizenId = adultCitizens[i].id;
      employedSet.add(citizenId);
      jobAssignments[citizenId] = jobSlots[i].buildingId;
    }

    // Update each citizen's employment status and jobId
    const updatedCitizens = citizens.map(c => {
      const isAdult = c.age >= 18;
      const isActive = activeHouseholdIds.includes(c.householdId);
      let status: "employed" | "unemployed" | "inactive" = "inactive";
      let jobId = c.jobId; // preserve existing if any
      if (isActive && isAdult) {
        if (employedSet.has(c.id)) {
          status = "employed";
          jobId = jobAssignments[c.id] !== undefined ? String(jobAssignments[c.id]) : undefined;
        } else {
          status = "unemployed";
          jobId = undefined;
        }
      } else {
        jobId = undefined;
      }
      return { ...c, employmentStatus: status, jobId };
    });

    const totalCitizens = citizens.length;
    const activeCitizens = updatedCitizens.filter(c => activeHouseholdIds.includes(c.householdId)).length;

    set({
      totalPopulation: totalPop,
      totalHouseholds: households.length,
      activePopulation: activePop,
      totalJobs,
      employed: employedCount,
      unemployed: unemployedCount,
      totalCitizens,
      activeCitizens,
      citizens: updatedCitizens,
    });
  };

  // Subscribe to building changes to update active population
  useBuildingStore.subscribe(() => {
    recompute();
  });

  return {
    households: [],
    citizens: [],
    totalPopulation: 0,
    totalHouseholds: 0,
    activePopulation: 0,
    totalJobs: 0,
    employed: 0,
    unemployed: 0,
    totalCitizens: 0,
    activeCitizens: 0,

    addHousehold: (buildingId) => {
      const existing = get().households.find(h => h.buildingId === buildingId);
      if (existing) return;
      const householdId = `household-${buildingId}`;
      // Generate 4 citizens with deterministic ages
      const ages = [32, 30, 8, 5]; // adults then children
      const newCitizens = ages.map((age, index) => ({
        id: `citizen-${buildingId}-${index}`,
        householdId,
        age,
        employmentStatus: "inactive" as const,
      }));
      set((state) => ({
        households: [
          ...state.households,
          { id: householdId, buildingId, population: 4 },
        ],
        citizens: [...state.citizens, ...newCitizens],
      }));
      recompute();
    },

    removeHousehold: (buildingId) => {
      set((state) => ({
        households: state.households.filter(h => h.buildingId !== buildingId),
        citizens: state.citizens.filter(c => c.householdId !== `household-${buildingId}`),
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