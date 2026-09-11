import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import usePopulationStore from "./PopulationStore";
import useEconomyStore from "./EconomyStore";
import useTransitStore from "./TransitStore";

import { useSimulationStore } from "../stores/useSimulationStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";

export type TaxRate = 'low' | 'normal' | 'high';
export type CityPolicy = 'growth' | 'balanced' | 'austerity';

export const TAX_RATES: Record<TaxRate, number> = {
  low: 0.05,
  normal: 0.10,
  high: 0.15,
};

export const TAX_EFFECTS: Record<TaxRate, { happinessMod: number; demandMod: number }> = {
  low: { happinessMod: 5, demandMod: 10 },
  normal: { happinessMod: 0, demandMod: 0 },
  high: { happinessMod: -8, demandMod: -15 },
};

export const POLICY_EFFECTS: Record<CityPolicy, { devPressureMod: number; expenseMod: number; happinessMod: number }> = {
  growth: { devPressureMod: 8, expenseMod: 1.1, happinessMod: 0 },
  balanced: { devPressureMod: 0, expenseMod: 1.0, happinessMod: 0 },
  austerity: { devPressureMod: -5, expenseMod: 0.9, happinessMod: -3 },
};

// Service base costs per provider per day
const SERVICE_BASE_COST: Record<string, number> = {
  hospital: 12,
  school: 10,
  police_station: 10,
  fire_station: 10,
  park: 4,
  power_plant: 8,
  water_plant: 8,
};

// Service types for funding
export type ServiceType = 'healthcare' | 'education' | 'safety';

interface MunicipalState {
  treasury: number;
  taxRate: TaxRate;
  cityPolicy: CityPolicy;
  serviceFunding: Record<ServiceType, number>; // 0-100
  lastPolicyChangeDay: number;
  // Derived
  dailyRevenue: number;
  dailyExpenses: number;
  dailyNet: number;
  // Actions
  setTaxRate: (rate: TaxRate) => void;
  setCityPolicy: (policy: CityPolicy) => void;
  setServiceFunding: (type: ServiceType, value: number) => void;
  processDailyBudget: () => void;
  canAfford: (amount: number) => boolean;
  spend: (amount: number) => boolean;
  reset: () => void;
}

const useMunicipalStore = create<MunicipalState>((set, get) => ({
  treasury: 500, // starting funds
  taxRate: 'normal',
  cityPolicy: 'balanced',
  serviceFunding: { healthcare: 100, education: 100, safety: 100 },
  lastPolicyChangeDay: 0,
  dailyRevenue: 0,
  dailyExpenses: 0,
  dailyNet: 0,

  setTaxRate: (rate) => {
    const { day } = useSimulationStore.getState();
    const lastChange = get().lastPolicyChangeDay;
    if (day - lastChange < 1) return; // cooldown 1 day
    set({ taxRate: rate, lastPolicyChangeDay: day });
  },

  setCityPolicy: (policy) => {
    const { day } = useSimulationStore.getState();
    const lastChange = get().lastPolicyChangeDay;
    if (day - lastChange < 1) return;
    set({ cityPolicy: policy, lastPolicyChangeDay: day });
  },

  setServiceFunding: (type, value) => {
    set((state) => ({
      serviceFunding: { ...state.serviceFunding, [type]: Math.max(0, Math.min(100, value)) },
    }));
  },

  processDailyBudget: () => {
    const buildings = useBuildingStore.getState().buildings;
    const households = usePopulationStore.getState().households;
    const { businessRevenue } = useEconomyStore.getState();
    // const { day } = useSimulationStore.getState();

    // Revenue: taxes
    const taxRate = TAX_RATES[get().taxRate];
    // Residential tax: based on population (per active person)
    const activeHouseholds = households.filter(h => {
      const b = buildings.find(bld => bld.id === h.buildingId);
      return b && hasRoadAccess(b.position, buildings);
    });
    const totalActivePop = activeHouseholds.reduce((sum, h) => sum + h.population, 0);
    const residentialTax = totalActivePop * 2 * taxRate; // base 2 per person

    // Commercial tax: based on shop revenue
    const shops = buildings.filter(b => b.type === 'shop');
    let shopRevenue = 0;
    for (const shop of shops) {
      shopRevenue += businessRevenue[shop.id] || 0;
    }
    const commercialTax = shopRevenue * taxRate * 0.5; // 50% of revenue taxed

    // Industrial tax: based on factory revenue
    const factories = buildings.filter(b => b.type === 'factory');
    let factoryRevenue = 0;
    for (const factory of factories) {
      factoryRevenue += businessRevenue[factory.id] || 0;
    }
    const industrialTax = factoryRevenue * taxRate * 0.4;

    const totalRevenue = residentialTax + commercialTax + industrialTax;

    // Expenses
    const policy = get().cityPolicy;
    const expenseMod = POLICY_EFFECTS[policy].expenseMod;

    // Service building operating costs
    let serviceExpenses = 0;
    const funding = get().serviceFunding;
    // Map building type to service type
    const serviceMap: Record<string, ServiceType> = {
      hospital: 'healthcare',
      school: 'education',
      police_station: 'safety',
    };
    for (const b of buildings) {
      const cost = SERVICE_BASE_COST[b.type || ''];
      if (cost) {
        let fundingFactor = 1;
        if (b.type === 'hospital' || b.type === 'school' || b.type === 'police_station') {
          const st = serviceMap[b.type];
          fundingFactor = (funding[st] || 100) / 100;
        }
        // Also add a base cost for utilities and parks
        serviceExpenses += cost * fundingFactor;
      }
    }

    // Infrastructure: roads maintenance (small)
    const roadCount = buildings.filter(b => b.type === 'road').length;
    const infrastructureCost = roadCount * 0.2;

    // Public transport: stop upkeep + per-line operating cost
    const transit = useTransitStore.getState();
    const transitStopCost = transit.stops.length * 0.5;
    const activeTransitLines = transit.lines.filter(
      (l) => l.enabled && !l.disrupted
    ).length;
    const transitLineCost = activeTransitLines * 3;
    const transitCost = transitStopCost + transitLineCost;

    // Policy extra costs: growth increases expenses
    let policyExtra = 0;
    if (policy === 'growth') {
      policyExtra = serviceExpenses * 0.1; // 10% extra
    }

    const totalExpenses =
      (serviceExpenses + infrastructureCost + transitCost) * expenseMod + policyExtra;

    // Update treasury
    const net = totalRevenue - totalExpenses;
    const newTreasury = get().treasury + net;

    set({
      treasury: Math.max(0, newTreasury), // prevent negative
      dailyRevenue: totalRevenue,
      dailyExpenses: totalExpenses,
      dailyNet: net,
    });
  },

  canAfford: (amount) => get().treasury >= amount,

  spend: (amount) => {
    if (amount <= 0) return true;
    if (get().treasury < amount) return false;
    set({ treasury: get().treasury - amount });
    return true;
  },

  reset: () => {
    set({
      treasury: 500,
      taxRate: 'normal',
      cityPolicy: 'balanced',
      serviceFunding: { healthcare: 100, education: 100, safety: 100 },
      lastPolicyChangeDay: 0,
      dailyRevenue: 0,
      dailyExpenses: 0,
      dailyNet: 0,
    });
  },
}));

export default useMunicipalStore;