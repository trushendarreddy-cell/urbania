import { create } from "zustand";
import usePopulationStore from "./PopulationStore";
import useBuildingStore from "./BuildingStore";
import useUtilityStore from "./UtilityStore";
import useNeedsStore from "./NeedsStore";
import { useSimulationStore } from "../stores/useSimulationStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";

const SALARY_SHOP = 50;
const SALARY_FACTORY = 70;
const DAILY_SPENDING_PER_HOUSEHOLD = 20; // base, will be overridden by demand
const SHOP_FIXED_COST = 10;
const SHOP_VARIABLE_COST_PER_EMPLOYEE = 2;
const FACTORY_FIXED_COST = 20;
const FACTORY_VARIABLE_COST_PER_EMPLOYEE = 5;
const BASE_PRODUCTION_PER_WORKER = 10;
const BASE_DEMAND_PER_PERSON = 15; // base demand units per person per day
const DEMAND_FACTOR_INCOME = 0.5; // influence of income on demand
const DEMAND_FACTOR_NEEDS = 0.5; // influence of average needs on demand

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
  // New demand fields
  householdDemand: Record<string, number>; // householdId -> desired demand
  shopDemand: Record<number, number>; // buildingId -> total demand allocated
  shopServed: Record<number, number>; // buildingId -> served demand (actual spending)
  shopUnmet: Record<number, number>; // buildingId -> unmet demand (demand - served)
  factoryDemand: number; // aggregate demand for factory production
  aggregateDemand: number; // total consumer demand across all households
  unmetDemand: number; // total unmet demand (demand not fulfilled due to capacity or money)
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
    const newHouseholdDemand: Record<string, number> = {};
    let aggregateDemand = 0;
    let unmetDemand = 0;
    const needsStore = useNeedsStore.getState();

    // Process each household
    for (const h of households) {
      const building = buildings.find(b => b.id === h.buildingId);
      // Check if household is active (has road access)
      if (!building || !hasRoadAccess(building.position, buildings)) {
        continue; // Inactive: no income, no spending, no demand
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

      // Compute household demand based on needs, income, and size
      let totalNeeds = 0;
      let needsCount = 0;
      for (const c of householdCitizens) {
        const needs = needsStore.getNeeds(c.id);
        if (needs) {
          totalNeeds += needs.happiness; // use overall happiness as proxy for need level
          needsCount++;
        }
      }
      const avgNeed = needsCount > 0 ? totalNeeds / needsCount : 50;
      // Base demand per person
      const size = h.population;
      const incomeFactor = Math.min(1, newMoney / 200); // cap at 1
      const needFactor = avgNeed / 100; // 0-1
      const demandPerPerson = BASE_DEMAND_PER_PERSON * (0.5 + 0.5 * (incomeFactor * DEMAND_FACTOR_INCOME + needFactor * DEMAND_FACTOR_NEEDS));
      const demand = demandPerPerson * size;
      newHouseholdDemand[h.id] = demand;
      aggregateDemand += demand;

      // Actual spending: min(demand, available money)
      const spending = Math.min(demand, newMoney);
      totalSpending += spending;
      newHouseholdMoney[h.id] = newMoney - spending;
      // Unmet demand for this household
      const unmet = demand - spending;
      unmetDemand += unmet;
    }

    // Allocate total spending to shops based on demand, distance, road access, and capacity
    const shops = buildings.filter(b => b.type === 'shop');
    // Calculate shop capacity: each shop can serve up to its employees * 10 demand units (or some fixed capacity)
    const SHOP_CAPACITY_PER_EMPLOYEE = 10;
    const shopCapacities: Record<number, number> = {};
    for (const shop of shops) {
      const employees = citizens.filter(c => c.employmentStatus === 'employed' && c.jobId === String(shop.id)).length;
      shopCapacities[shop.id] = employees * SHOP_CAPACITY_PER_EMPLOYEE + 5; // base capacity
    }

    // Compute demand allocated to each shop based on household proximity and road access
    // For simplicity, we allocate aggregate demand to shops based on distance and capacity
    // We'll treat each household's demand as distributed to nearby shops.
    // Since we already have totalSpending as the actual spending money, we allocate that.
    // But we need to allocate spending, not just demand.
    // We'll allocate the totalSpending to shops based on a weighted score: capacity / distance.
    const shopScores: Record<number, number> = {};
    let totalScore = 0;
    for (const shop of shops) {
      // Check road access: if shop has no road access, penalty
      const hasAccess = hasRoadAccess(shop.position, buildings);
      if (!hasAccess) {
        shopScores[shop.id] = 0;
        continue;
      }
      // Compute distance to all households? For simplicity, we'll use shop position and aggregate demand.
      // We'll compute a rough accessibility score: inverse of distance to city center? Actually, we need household-specific.
      // To keep it simple, we'll use the shop's position relative to average household position.
      // Compute average household position
      let avgX = 0, avgZ = 0;
      let count = 0;
      for (const h of households) {
        const b = buildings.find(bld => bld.id === h.buildingId);
        if (b) {
          avgX += b.position[0];
          avgZ += b.position[2];
          count++;
        }
      }
      if (count > 0) {
        avgX /= count;
        avgZ /= count;
      } else {
        avgX = 0; avgZ = 0;
      }
      const dx = shop.position[0] - avgX;
      const dz = shop.position[2] - avgZ;
      const dist = Math.hypot(dx, dz) + 1; // avoid division by zero
      const capacity = shopCapacities[shop.id] || 1;
      const score = capacity / dist;
      shopScores[shop.id] = score;
      totalScore += score;
    }

    const newBusinessRevenue: Record<number, number> = {};
    let totalBusinessRevenue = 0;
    const newShopDemandAllocated: Record<number, number> = {};
    const newShopServed: Record<number, number> = {};
    const newShopUnmet: Record<number, number> = {};

    if (totalScore > 0 && totalSpending > 0) {
      for (const shop of shops) {
        const score = shopScores[shop.id] || 0;
        const share = score / totalScore;
        // Demand allocated to this shop (desired)
        const demandAllocated = aggregateDemand * share;
        newShopDemandAllocated[shop.id] = demandAllocated;
        // Actual served (spending) is limited by capacity and total spending
        const served = Math.min(demandAllocated, totalSpending * share, shopCapacities[shop.id] || Infinity);
        newShopServed[shop.id] = served;
        newShopUnmet[shop.id] = demandAllocated - served;
        // Revenue is the served amount (money spent)
        const revenue = served;
        newBusinessRevenue[shop.id] = revenue;
        totalBusinessRevenue += revenue;
      }
    } else {
      for (const shop of shops) {
        newShopDemandAllocated[shop.id] = 0;
        newShopServed[shop.id] = 0;
        newShopUnmet[shop.id] = 0;
        newBusinessRevenue[shop.id] = 0;
      }
    }

    // Factories: demand based on aggregate consumer demand, production capacity, utilities
    const factories = buildings.filter(b => b.type === 'factory');
    // Factory demand: proportional to aggregateDemand (consumer demand drives production)
    const factoryDemand = aggregateDemand * 0.1; // scaling factor
    let totalFactoryRevenue = 0;
    const newFactoryProduction: Record<number, number> = {};
    for (const factory of factories) {
      const employees = citizens.filter(c => c.employmentStatus === 'employed' && c.jobId === String(factory.id)).length;
      // Revenue based on served demand, but also employee contribution
      const utilityStatus = useUtilityStore.getState().getUtilityStatus(factory.id);
      let utilityFactor = 1;
      if (utilityStatus) {
        if (!utilityStatus.electricity) utilityFactor *= 0.5;
        if (!utilityStatus.water) utilityFactor *= 0.5;
      }
      // Effective production capacity: employees * BASE_PRODUCTION_PER_WORKER * utilityFactor
      const capacity = employees * BASE_PRODUCTION_PER_WORKER * utilityFactor;
      // Demand for this factory: share of total factory demand based on capacity
      const totalFactoryCapacity = factories.reduce((sum, f) => {
        const emp = citizens.filter(c => c.employmentStatus === 'employed' && c.jobId === String(f.id)).length;
        const util = (() => {
          const stat = useUtilityStore.getState().getUtilityStatus(f.id);
          if (stat) {
            let uf = 1;
            if (!stat.electricity) uf *= 0.5;
            if (!stat.water) uf *= 0.5;
            return uf;
          }
          return 1;
        })();
        return sum + emp * BASE_PRODUCTION_PER_WORKER * util;
      }, 0) || 1;
      const share = capacity / totalFactoryCapacity;
      const assignedDemand = factoryDemand * share;
      const production = Math.min(capacity, assignedDemand);
      // Revenue: simplified, based on production
      const revenue = production * 0.5; // abstract revenue per unit
      newBusinessRevenue[factory.id] = revenue;
      totalBusinessRevenue += revenue;
      totalFactoryRevenue += revenue;
      // Store production for inspection
      newFactoryProduction[factory.id] = production;
    }
    // If no factories, factoryDemand is 0
    const finalFactoryDemand = factories.length > 0 ? factoryDemand : 0;

    // Compute business costs, profit, status (already computed shops and factories above)
    const newBusinessCosts: Record<number, number> = {};
    const newBusinessProfit: Record<number, number> = {};
    const newBusinessStatus: Record<number, 'HEALTHY' | 'WEAK' | 'STRUGGLING'> = {};

    // Compute shop employees for cost calculation
    const shopEmployees: Record<number, number> = {};
    for (const shop of shops) {
      const employees = citizens.filter(c => c.employmentStatus === 'employed' && c.jobId === String(shop.id)).length;
      shopEmployees[shop.id] = employees;
    }

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

    // Factories (cost and profit already computed, but we need status)
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
      householdDemand: newHouseholdDemand,
      shopDemand: newShopDemandAllocated,
      shopServed: newShopServed,
      shopUnmet: newShopUnmet,
      factoryDemand: finalFactoryDemand || 0,
      aggregateDemand,
      unmetDemand,
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
    householdDemand: {},
    shopDemand: {},
    shopServed: {},
    shopUnmet: {},
    factoryDemand: 0,
    aggregateDemand: 0,
    unmetDemand: 0,
    lastDayProcessed: -1,

    initialize,
    processDailyEconomics,

    getHouseholdMoney: (householdId: string) => {
      return get().householdMoney[householdId] || 0;
    },
  };
});

export default useEconomyStore;