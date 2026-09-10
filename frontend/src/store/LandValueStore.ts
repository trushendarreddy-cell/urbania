import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import useServiceStore from "./ServiceStore";
import useUtilityStore from "./UtilityStore";
import useNeedsStore from "./NeedsStore";
import useRoadUsageStore from "./RoadUsageStore";
import usePopulationStore from "./PopulationStore";
import useEconomyStore from "./EconomyStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import { ROAD_CAPACITY } from "./RoadUsageStore";

// Configuration for land value factors
const LAND_VALUE_CONFIG = {
  baseValue: 30,
  roadAccessBonus: 25,
  serviceBonus: 20,
  utilityBonus: 15,
  happinessBonus: 20,
  congestionPenalty: 20,
  demandBonus: 15,
  // Max values
  maxValue: 100,
};

interface LandValueStore {
  // Computed on demand; no persistent state
  getLandValue: (buildingId: number) => number;
  getLandValueAtPosition: (position: [number, number, number]) => number;
}

const useLandValueStore = create<LandValueStore>((_, _get) => ({
  getLandValue: (buildingId: number) => {
    const buildings = useBuildingStore.getState().buildings;
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return 0;

    const pos = building.position;
    let value = LAND_VALUE_CONFIG.baseValue;

    // 1. Road access
    const hasRoad = hasRoadAccess(pos, buildings);
    if (hasRoad) {
      value += LAND_VALUE_CONFIG.roadAccessBonus;
      // Bonus if road is not congested
      const roadKey = `${Math.round(pos[0])},${Math.round(pos[2])}`;
      const usage = useRoadUsageStore.getState().getUsage(roadKey);
      const congestionRatio = usage / ROAD_CAPACITY;
      // Penalty: reduce road bonus based on congestion
      const roadPenalty = Math.min(congestionRatio, 1) * 0.8; // up to 80% reduction
      value -= roadPenalty * LAND_VALUE_CONFIG.roadAccessBonus * 0.5;
    }

    // 2. Services: average coverage of all service types
    const serviceStore = useServiceStore.getState();
    const serviceTypes: Array<'recreation' | 'healthcare' | 'education' | 'safety' | 'emergency'> =
      ['recreation', 'healthcare', 'education', 'safety', 'emergency'];
    let serviceScore = 0;
    let serviceCount = 0;
    for (const type of serviceTypes) {
      const coverage = serviceStore.getCoverage(pos, type);
      if (coverage.covered) {
        // Score based on distance: closer is better (max 100)
        const dist = coverage.distance || 0;
        const score = Math.max(0, 100 - dist * 5); // 0 distance -> 100, 10 -> 50, 20 -> 0
        serviceScore += score;
        serviceCount++;
      }
    }
    if (serviceCount > 0) {
      const avgService = serviceScore / serviceCount;
      value += (avgService / 100) * LAND_VALUE_CONFIG.serviceBonus;
    }

    // 3. Utilities
    const utilityStatus = useUtilityStore.getState().getUtilityStatus(building.id);
    if (utilityStatus) {
      let utilityScore = 0;
      if (utilityStatus.electricity) utilityScore += 1;
      if (utilityStatus.water) utilityScore += 1;
      value += (utilityScore / 2) * LAND_VALUE_CONFIG.utilityBonus;
    }

    // 4. Happiness of residents (if household)
    const households = usePopulationStore.getState().households;
    const household = households.find(h => h.buildingId === buildingId);
    let avgHappiness = 50;
    if (household) {
      const citizens = usePopulationStore.getState().citizens.filter(c => c.householdId === household.id);
      const needsStore = useNeedsStore.getState();
      let sum = 0, count = 0;
      for (const c of citizens) {
        const needs = needsStore.getNeeds(c.id);
        if (needs) { sum += needs.happiness; count++; }
      }
      if (count > 0) avgHappiness = sum / count;
    }
    value += (avgHappiness / 100) * LAND_VALUE_CONFIG.happinessBonus;

    // 5. Congestion penalty (based on nearby road usage)
    // Use average congestion of roads within 2 tiles
    let totalCongestion = 0;
    let roadCount = 0;
    const offsets = [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]];
    for (const [dx, dz] of offsets) {
      const key = `${Math.round(pos[0] + dx)},${Math.round(pos[2] + dz)}`;
      const usage = useRoadUsageStore.getState().getUsage(key);
      if (usage > 0) {
        totalCongestion += Math.min(usage / ROAD_CAPACITY, 1);
        roadCount++;
      }
    }
    if (roadCount > 0) {
      const avgCongestion = totalCongestion / roadCount;
      value -= avgCongestion * LAND_VALUE_CONFIG.congestionPenalty * 0.5;
    }

    // 6. Demand bonus (from EconomyStore)
    const economyStore = useEconomyStore.getState();
    const aggregateDemand = economyStore.aggregateDemand || 0;
    // Scale demand: assume 0-1000 demand -> 0-100% bonus
    const demandFactor = Math.min(aggregateDemand / 1000, 1);
    value += demandFactor * LAND_VALUE_CONFIG.demandBonus;

    // Clamp
    return Math.max(0, Math.min(LAND_VALUE_CONFIG.maxValue, value));
  },

  getLandValueAtPosition: (position) => {
    const buildings = useBuildingStore.getState().buildings;
    const pos = position;
    let value = LAND_VALUE_CONFIG.baseValue;

    const hasRoad = hasRoadAccess(pos, buildings);
    if (hasRoad) {
      value += LAND_VALUE_CONFIG.roadAccessBonus;
      const roadKey = `${Math.round(pos[0])},${Math.round(pos[2])}`;
      const usage = useRoadUsageStore.getState().getUsage(roadKey);
      const congestionRatio = usage / ROAD_CAPACITY;
      const roadPenalty = Math.min(congestionRatio, 1) * 0.8;
      value -= roadPenalty * LAND_VALUE_CONFIG.roadAccessBonus * 0.5;
    }

    const serviceStore = useServiceStore.getState();
    const serviceTypes: Array<'recreation' | 'healthcare' | 'education' | 'safety' | 'emergency'> =
      ['recreation', 'healthcare', 'education', 'safety', 'emergency'];
    let serviceScore = 0;
    let serviceCount = 0;
    for (const type of serviceTypes) {
      const coverage = serviceStore.getCoverage(pos, type);
      if (coverage.covered) {
        const dist = coverage.distance || 0;
        const score = Math.max(0, 100 - dist * 5);
        serviceScore += score;
        serviceCount++;
      }
    }
    if (serviceCount > 0) {
      value += (serviceScore / serviceCount / 100) * LAND_VALUE_CONFIG.serviceBonus;
    }

    let totalCongestion = 0;
    let roadCount = 0;
    const offsets = [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]];
    for (const [dx, dz] of offsets) {
      const key = `${Math.round(pos[0] + dx)},${Math.round(pos[2] + dz)}`;
      const usage = useRoadUsageStore.getState().getUsage(key);
      if (usage > 0) {
        totalCongestion += Math.min(usage / ROAD_CAPACITY, 1);
        roadCount++;
      }
    }
    if (roadCount > 0) {
      value -= (totalCongestion / roadCount) * LAND_VALUE_CONFIG.congestionPenalty * 0.5;
    }

    const economyStore = useEconomyStore.getState();
    const aggregateDemand = economyStore.aggregateDemand || 0;
    const demandFactor = Math.min(aggregateDemand / 1000, 1);
    value += demandFactor * LAND_VALUE_CONFIG.demandBonus;

    return Math.max(0, Math.min(LAND_VALUE_CONFIG.maxValue, value));
  },
}));

export default useLandValueStore;