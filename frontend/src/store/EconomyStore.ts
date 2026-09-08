import { create } from "zustand";
import usePopulationStore from "./PopulationStore";
import useBuildingStore from "./BuildingStore";
import useUtilityStore from "./UtilityStore";
import { useSimulationStore } from "../stores/useSimulationStore";

const SALARY_SHOP = 50;
const SALARY_FACTORY = 70;
const DAILY_SPENDING_PER_HOUSEHOLD = 20;
const FACTORY_REVENUE_PER_EMPLOYEE = 15;
const SHOP_FIXED_COST = 10;
const SHOP_VARIABLE_COST_PER_EMPLOYEE = 2;
const FACTORY_FIXED_COST = 20;
const FACTORY_VARIABLE_COST_PER_EMPLOYEE = 5;
const BASE_PRODUCTION_PER_WORKER = 10;

interface EconomyStore {
  householdMoney: Record<string, number>; // householdId -> money
  dailyIncome: number;
  dailySpending: number;
  businessRevenue: Record<number, number>; // buildingId -> revenue
  totalBusinessRevenue: number;
  businessCosts: Record<number, number>; // buildingId -> cost
  businessProfit: Record<number, number>; // buildingId -> profit
  businessStatus: Record<number, 'HEALTHY' | 'WEAK' | 'STRUGGLING'>;
  factoryProduction: Record<number, number>; // buildingId -> production units
  economicHealth: number;
  householdFinancialState: Record<string, 'STABLE' | 'TIGHT' | 'STRAINED'>;
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

    // Compute business costs, profit, status, and production
    const newBusinessCosts: Record<number, number> = {};
    const newBusinessProfit: Record<number, number> = {};
    const newBusinessStatus: Record<number, 'HEALTHY' | 'WEAK' | 'STRUGGLING'> = {};
    const newFactoryProduction: Record<number, number> = {};
    const utilityStore = useUtilityStore.getState();

    // Shops
    for (const shop of shops) {
      const employees = shopEmployees[shop.id] || 0;
      const cost = SHOP_FIXED_COST + SHOP_VARIABLE_COST_PER_EMPLOYEE * employees;
      newBusinessCosts[shop.id] = cost;
      const revenue = newBusinessRevenue[shop.id] || 0;
      const profit = revenue - cost;
      newBusinessProfit[shop.id] = profit;
      if (profit > cost * 0.2) newBusinessStatus[shop.id] = 'HEALTHY';
      else if (profit > 0) newBusinessStatus[shop.id] = 'WEAK';
      else newBusinessStatus[shop.id] = 'STRUGGLING';
    }

    // Factories
    for (const factory of factories) {
      const employees = citizens.filter(c => c.employmentStatus === 'employed' && c.jobId === String(factory.id)).length;
      const cost = FACTORY_FIXED_COST + FACTORY_VARIABLE_COST_PER_EMPLOYEE * employees;
      newBusinessCosts[factory.id] = cost;
      const revenue = newBusinessRevenue[factory.id] || 0;
      const profit = revenue - cost;
      newBusinessProfit[factory.id] = profit;
      if (profit > cost * 0.2) newBusinessStatus[factory.id] = 'HEALTHY';
      else if (profit > 0) newBusinessStatus[factory.id] = 'WEAK';
      else newBusinessStatus[factory.id] = 'STRUGGLING';

      // Production: base * workers * utility factor
      const utilityStatus = utilityStore.getUtilityStatus(factory.id);
      let utilityFactor = 1;
      if (utilityStatus) {
        if (!utilityStatus.electricity) utilityFactor *= 0.5;
        if (!utilityStatus.water) utilityFactor *= 0.5;
      }
      const production = BASE_PRODUCTION_PER_WORKER * employees * utilityFactor;
      newFactoryProduction[factory.id] = production;
    }

    // Compute household financial state
    const newHouseholdFinancialState: Record<string, 'STABLE' | 'TIGHT' | 'STRAINED'> = {};
    for (const h of households) {
      const building = buildings.find(b => b.id === h.buildingId);
      if (!building || !hasRoadAccess(building.position, buildings)) continue;
      const income = citizens.filter(c => c.householdId === h.id && c.employmentStatus === 'employed' && c.jobId)
        .reduce((sum, c) => {
          const jobBuilding = buildings.find(b => b.id === parseInt(c.jobId!, 10));
          if (jobBuilding) {
            if (jobBuilding.type === 'shop') return sum + SALARY_SHOP;
            else if (jobBuilding.type === 'factory') return sum + SALARY_FACTORY;
          }
          return sum;
        }, 0);
      const spending = DAILY_SPENDING_PER_HOUSEHOLD;
      if (income >= spending * 1.5) newHouseholdFinancialState[h.id] = 'STABLE';
      else if (income >= spending * 0.8) newHouseholdFinancialState[h.id] = 'TIGHT';
      else newHouseholdFinancialState[h.id] = 'STRAINED';
    }

    // Compute economic health
    const totalActiveHouseholds = households.filter(h => {
      const b = buildings.find(bld => bld.id === h.buildingId);
      return b && hasRoadAccess(b.position, buildings);
    }).length;
    const employmentRate = totalActiveHouseholds > 0 ? usePopulationStore.getState().employed / totalActiveHouseholds : 0;
    const avgProfitRatio = Object.values(newBusinessProfit).reduce((a, b) => a + b, 0) / (Object.keys(newBusinessProfit).length || 1);
    const avgBalance = Object.values(newHouseholdMoney).reduce((a, b) => a + b, 0) / (Object.keys(newHouseholdMoney).length || 1);
    // Scale to 0-100
    const healthScore = Math.min(100, Math.max(0,
      (employmentRate * 100) * 0.4 +
      (Math.min(1, avgProfitRatio / 20) * 100) * 0.3 +
      (Math.min(1, avgBalance / 200) * 100) * 0.3
    ));
    const economicHealth = Math.round(healthScore);

    set({
      householdMoney: newHouseholdMoney,
      dailyIncome: totalIncome,
      dailySpending: totalSpending,
      businessRevenue: newBusinessRevenue,
      totalBusinessRevenue,
      businessCosts: newBusinessCosts,
      businessProfit: newBusinessProfit,
      businessStatus: newBusinessStatus,
      factoryProduction: newFactoryProduction,
      economicHealth,
      householdFinancialState: newHouseholdFinancialState,
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
    businessCosts: {},
    businessProfit: {},
    businessStatus: {},
    factoryProduction: {},
    economicHealth: 0,
    householdFinancialState: {},
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