import { create } from "zustand";
import usePopulationStore from "./PopulationStore";
import useBuildingStore from "./BuildingStore";
import { useSimulationStore } from "../stores/useSimulationStore";

const SALARY_SHOP = 50;
const SALARY_FACTORY = 70;
const DAILY_SPENDING_PER_HOUSEHOLD = 20;
const FACTORY_REVENUE_PER_EMPLOYEE = 15;

interface EconomyStore {
  householdMoney: Record<string, number>; // householdId -> money
  dailyIncome: number;
  dailySpending: number;
  businessRevenue: Record<number, number>; // buildingId -> revenue
  totalBusinessRevenue: number;
  lastDayProcessed: number;
  initialize: () => void;
  processDailyEconomics: () => void;
  getHouseholdMoney: (householdId: string) => number;
}

const useEconomyStore = create<EconomyStore>((set, get) => {
  // Subscribe to simulation store to process economics on day change
  // We'll use a separate effect in App, but we also need to handle initialization

  const processDailyEconomics = () => {
    const { day } = useSimulationStore.getState();
    const { lastDayProcessed, householdMoney } = get();
    if (lastDayProcessed === day) return; // Already processed this day

    const households = usePopulationStore.getState().households;
    const citizens = usePopulationStore.getState().citizens;
    const buildings = useBuildingStore.getState().buildings;

    let totalIncome = 0;
    let totalSpending = 0;
    let newHouseholdMoney = { ...householdMoney };

    // Process each household
    for (const h of households) {
      const building = buildings.find(b => b.id === h.buildingId);
      // Check if household is active (has road access)
      if (!building || !hasRoadAccess(building.position, buildings)) {
        continue; // Inactive: no income, no spending
      }

      // Calculate income from employed citizens in this household
      const householdCitizens = citizens.filter(c => c.householdId === h.id);
      let income = 0;
      for (const c of householdCitizens) {
        if (c.employmentStatus === 'employed' && c.jobId) {
          const jobBuilding = buildings.find(b => b.id === parseInt(c.jobId!, 10));
          if (jobBuilding) {
            if (jobBuilding.type === 'shop') {
              income += SALARY_SHOP;
            } else if (jobBuilding.type === 'factory') {
              income += SALARY_FACTORY;
            }
          }
        }
      }

      // Add income to household money
      const currentMoney = newHouseholdMoney[h.id] || 0;
      const newMoney = currentMoney + income;
      newHouseholdMoney[h.id] = newMoney;
      totalIncome += income;

      // Spending: fixed daily amount if household has enough money
      if (newMoney >= DAILY_SPENDING_PER_HOUSEHOLD) {
        newHouseholdMoney[h.id] = newMoney - DAILY_SPENDING_PER_HOUSEHOLD;
        totalSpending += DAILY_SPENDING_PER_HOUSEHOLD;
      } else {
        // Spend all available money (or zero)
        totalSpending += newMoney;
        newHouseholdMoney[h.id] = 0;
      }
    }

    // Distribute spending to shops
    const shops = buildings.filter(b => b.type === 'shop');
    // Calculate total shop employees
    let totalShopEmployees = 0;
    const shopEmployees: Record<number, number> = {};
    for (const shop of shops) {
      const employees = citizens.filter(c => c.employmentStatus === 'employed' && c.jobId === String(shop.id));
      const count = employees.length;
      shopEmployees[shop.id] = count;
      totalShopEmployees += count;
    }

    const newBusinessRevenue: Record<number, number> = {};
    let totalBusinessRevenue = 0;

    if (totalShopEmployees > 0 && totalSpending > 0) {
      for (const shop of shops) {
        const share = shopEmployees[shop.id] || 0;
        const revenue = (share / totalShopEmployees) * totalSpending;
        newBusinessRevenue[shop.id] = revenue;
        totalBusinessRevenue += revenue;
      }
    } else {
      for (const shop of shops) {
        newBusinessRevenue[shop.id] = 0;
      }
    }

    // Factories: revenue based on employees
    const factories = buildings.filter(b => b.type === 'factory');
    for (const factory of factories) {
      const employees = citizens.filter(c => c.employmentStatus === 'employed' && c.jobId === String(factory.id));
      const revenue = employees.length * FACTORY_REVENUE_PER_EMPLOYEE;
      newBusinessRevenue[factory.id] = revenue;
      totalBusinessRevenue += revenue;
    }

    set({
      householdMoney: newHouseholdMoney,
      dailyIncome: totalIncome,
      dailySpending: totalSpending,
      businessRevenue: newBusinessRevenue,
      totalBusinessRevenue,
      lastDayProcessed: day,
    });
  };

  // Initialize household money for existing households
  const initialize = () => {
    const households = usePopulationStore.getState().households;
    const newMoney: Record<string, number> = {};
    for (const h of households) {
      newMoney[h.id] = 100; // Starting money
    }
    set({ householdMoney: newMoney, lastDayProcessed: -1 });
    // Also process economics for the current day if not processed
    processDailyEconomics();
  };

  // Subscribe to household changes to add money for new households
  usePopulationStore.subscribe((state) => {
    const currentMoney = get().householdMoney;
    for (const h of state.households) {
      if (!(h.id in currentMoney)) {
        // New household, give starting money
        set((prev) => ({
          householdMoney: { ...prev.householdMoney, [h.id]: 100 }
        }));
      }
    }
    // Also remove money for deleted households
    const householdIds = new Set(state.households.map(h => h.id));
    let needsCleanup = false;
    const updatedMoney = { ...currentMoney };
    for (const id in currentMoney) {
      if (!householdIds.has(id)) {
        delete updatedMoney[id];
        needsCleanup = true;
      }
    }
    if (needsCleanup) {
      set({ householdMoney: updatedMoney });
    }
  });

  return {
    householdMoney: {},
    dailyIncome: 0,
    dailySpending: 0,
    businessRevenue: {},
    totalBusinessRevenue: 0,
    lastDayProcessed: -1,

    initialize,
    processDailyEconomics,

    getHouseholdMoney: (householdId: string) => {
      return get().householdMoney[householdId] || 0;
    },
  };
});

export default useEconomyStore;
// Need to import hasRoadAccess
import { hasRoadAccess } from "../systems/RoadAccessSystem";