import useBuildingStore from '../store/BuildingStore';
import usePopulationStore from '../store/PopulationStore';
import useEconomyStore from '../store/EconomyStore';
import useUtilityStore from '../store/UtilityStore';
import useServiceStore from '../store/ServiceStore';
import useEventStore from '../store/EventStore';
import useVehicleStore from '../store/VehicleStore';
import useRoadUsageStore from '../store/RoadUsageStore';
import useNeedsStore from '../store/NeedsStore';
import useMunicipalStore from '../store/MunicipalStore';
import useZoneStore from '../store/ZoneStore';
import useDistrictStore from '../store/DistrictStore';
import { useSimulationStore } from '../stores/useSimulationStore';
import type { Building } from '../store/BuildingStore';
import type { Household, Citizen } from '../store/PopulationStore';
import type { CityEvent } from '../store/EventStore';
import type { Vehicle } from '../store/VehicleStore';
import type { Zone } from '../store/ZoneStore';
import type { District } from '../store/DistrictStore';

const SAVE_KEY = 'urbania_save';
const VERSION = 1;
export const AUTOSAVE_INTERVAL = 60000;

export interface SaveData {
  version: number;
  timestamp: number;
  city: {
    buildings: Building[];
    households: Household[];
    citizens: Citizen[];
    simulation: {
      day: number;
      timeOfDay: number;
      isPaused: boolean;
      speed: number;
    };
    economy: {
      householdMoney: Record<string, number>;
      dailyIncome: number;
      dailySpending: number;
      businessRevenue: Record<number, number>;
      totalBusinessRevenue: number;
      businessCosts: Record<number, number>;
      businessProfit: Record<number, number>;
      businessStatus: Record<number, 'HEALTHY' | 'WEAK' | 'STRUGGLING'>;
      factoryProduction: Record<number, number>;
      economicHealth: number;
      householdFinancialState: Record<string, 'STABLE' | 'TIGHT' | 'STRAINED'>;
      householdDemand: Record<string, number>;
      shopDemand: Record<number, number>;
      shopServed: Record<number, number>;
      shopUnmet: Record<number, number>;
      factoryDemand: number;
      aggregateDemand: number;
      unmetDemand: number;
      lastDayProcessed: number;
    };
    events: CityEvent[];
    vehicles: Vehicle[];
    municipal: {
      treasury: number;
      taxRate: string;
      cityPolicy: string;
      serviceFunding: Record<string, number>;
      lastPolicyChangeDay: number;
    };
    zones?: Zone[];
    districts?: District[];
  };
}

export function saveCity() {
  try {
    const buildings = useBuildingStore.getState().buildings;
    const households = usePopulationStore.getState().households;
    const citizens = usePopulationStore.getState().citizens;
    const sim = useSimulationStore.getState();
    const econ = useEconomyStore.getState();
    const events = useEventStore.getState().events;
    const vehicles = useVehicleStore.getState().vehicles;
    const municipal = useMunicipalStore.getState();
    const zones = useZoneStore.getState().zones;
    const districts = useDistrictStore.getState().districts;

    const saveData: SaveData = {
      version: VERSION,
      timestamp: Date.now(),
      city: {
        buildings,
        households,
        citizens,
        simulation: {
          day: sim.day,
          timeOfDay: sim.timeOfDay,
          isPaused: sim.isPaused,
          speed: sim.speed,
        },
        economy: {
          householdMoney: econ.householdMoney,
          dailyIncome: econ.dailyIncome,
          dailySpending: econ.dailySpending,
          businessRevenue: econ.businessRevenue,
          totalBusinessRevenue: econ.totalBusinessRevenue,
          businessCosts: econ.businessCosts,
          businessProfit: econ.businessProfit,
          businessStatus: econ.businessStatus,
          factoryProduction: econ.factoryProduction,
          economicHealth: econ.economicHealth,
          householdFinancialState: econ.householdFinancialState,
          householdDemand: econ.householdDemand,
          shopDemand: econ.shopDemand,
          shopServed: econ.shopServed,
          shopUnmet: econ.shopUnmet,
          factoryDemand: econ.factoryDemand,
          aggregateDemand: econ.aggregateDemand,
          unmetDemand: econ.unmetDemand,
          lastDayProcessed: econ.lastDayProcessed,
        },
        events,
        vehicles,
        municipal: {
          treasury: municipal.treasury,
          taxRate: municipal.taxRate,
          cityPolicy: municipal.cityPolicy,
          serviceFunding: municipal.serviceFunding,
          lastPolicyChangeDay: municipal.lastPolicyChangeDay,
        },
        zones,
        districts,
      },
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export function loadCity() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw) as SaveData;
    if (data.version !== VERSION) {
      console.warn('Save version mismatch, expected', VERSION, 'got', data.version);
      return false;
    }

    const { city } = data;

    // Restore buildings
    useBuildingStore.setState({ buildings: city.buildings, selectedObjectId: null });

    // Restore population
    usePopulationStore.setState({
      households: city.households,
      citizens: city.citizens,
    });
    // Recompute derived population stats
    usePopulationStore.getState().recompute();

    // Restore simulation
    useSimulationStore.setState({
      day: city.simulation.day,
      timeOfDay: city.simulation.timeOfDay,
      isPaused: city.simulation.isPaused,
      speed: city.simulation.speed as 0 | 1 | 2 | 4,
    });

    // Restore economy
    const econ = city.economy;
    useEconomyStore.setState({
      householdMoney: econ.householdMoney,
      dailyIncome: econ.dailyIncome,
      dailySpending: econ.dailySpending,
      businessRevenue: econ.businessRevenue,
      totalBusinessRevenue: econ.totalBusinessRevenue,
      businessCosts: econ.businessCosts,
      businessProfit: econ.businessProfit,
      businessStatus: econ.businessStatus,
      factoryProduction: econ.factoryProduction,
      economicHealth: econ.economicHealth,
      householdFinancialState: econ.householdFinancialState,
      householdDemand: econ.householdDemand,
      shopDemand: econ.shopDemand,
      shopServed: econ.shopServed,
      shopUnmet: econ.shopUnmet,
      factoryDemand: econ.factoryDemand,
      aggregateDemand: econ.aggregateDemand,
      unmetDemand: econ.unmetDemand,
      lastDayProcessed: econ.lastDayProcessed,
    });

    // Restore events
    useEventStore.setState({ events: city.events, providerUsage: {} });
    // Recompute event dispatch (will reassign providers and vehicles)
    useEventStore.getState().updateEvents();

    // Restore vehicles
    useVehicleStore.setState({ vehicles: city.vehicles });

    // Restore zones
    useZoneStore.setState({ zones: city.zones || [] });

    // Restore districts
    useDistrictStore.setState({
      districts: city.districts || [],
      selectedDistrictId: null,
      activeDistrictId: null,
      districtMode: false,
    });

    // Restore municipal
    if (city.municipal) {
      useMunicipalStore.setState({
        treasury: city.municipal.treasury,
        taxRate: city.municipal.taxRate as any,
        cityPolicy: city.municipal.cityPolicy as any,
        serviceFunding: city.municipal.serviceFunding,
        lastPolicyChangeDay: city.municipal.lastPolicyChangeDay,
      });
    } else {
      useMunicipalStore.getState().reset();
    }
    // Process budget for current day
    useMunicipalStore.getState().processDailyBudget();

    // Recompute utilities and services (they subscribe to building store, but we need to force)
    useUtilityStore.getState().recompute();
    useServiceStore.getState().recompute();

    // Recompute needs
    useNeedsStore.getState().recomputeAll();

    // Clear road usage (will be rebuilt by citizen movement)
    useRoadUsageStore.getState().clear();

    return true;
  } catch (e) {
    console.error('Load failed:', e);
    return false;
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function newCity() {
  if (!confirm('Start a new city? Unsaved progress will be lost.')) return;

  // Reset all stores to initial state
  useBuildingStore.setState({ buildings: [], selectedObjectId: null });
  usePopulationStore.setState({ households: [], citizens: [], totalPopulation: 0, totalHouseholds: 0, activePopulation: 0, totalJobs: 0, employed: 0, unemployed: 0, totalCitizens: 0, activeCitizens: 0 });
  useEconomyStore.setState({
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
  });
  useUtilityStore.setState({ providers: [], connections: {} });
  useServiceStore.setState({ providers: [] });
  useEventStore.setState({ events: [], providerUsage: {} });
  useVehicleStore.setState({ vehicles: [] });
  useRoadUsageStore.setState({ usage: new Map() });
  useZoneStore.getState().clear();
  useDistrictStore.getState().clear();
  useSimulationStore.getState().reset();
  useMunicipalStore.getState().reset();

  // Recompute derived states
  usePopulationStore.getState().recompute();
  useUtilityStore.getState().recompute();
  useServiceStore.getState().recompute();
  useNeedsStore.getState().recomputeAll();
  useEconomyStore.getState().initialize(); // setup household money for any existing houses? After reset there are none, so fine.
}