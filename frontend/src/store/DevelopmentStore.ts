import { create } from "zustand";
import useLandValueStore from "./LandValueStore";
import useBuildingStore from "./BuildingStore";
import useEconomyStore from "./EconomyStore";
import useNeedsStore from "./NeedsStore";
import usePopulationStore from "./PopulationStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import useServiceStore from "./ServiceStore";
import useAlertStore from "./AlertStore";
import { useSimulationStore } from "../stores/useSimulationStore";

// Configuration
const DEV_CONFIG = {
  // Thresholds for development pressure (0-100)
  pressureThresholdForUpgrade: 65,
  // Progress per day when pressure exceeds threshold
  progressPerDay: 8,
  // Cooldown days after upgrade
  cooldownDays: 3,
  // Max level
  maxLevel: 3,
};

interface DevelopmentStore {
  getDevelopmentPressure: (buildingId: number) => number;
  getDevelopmentProgress: (buildingId: number) => number;
  processDevelopment: () => void;
}

const useDevelopmentStore = create<DevelopmentStore>((_, get) => ({
  getDevelopmentPressure: (buildingId: number) => {
    const buildings = useBuildingStore.getState().buildings;
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return 0;

    const landValue = useLandValueStore.getState().getLandValue(buildingId);
    let pressure = landValue; // base

    // Demand factor (from EconomyStore)
    const economyStore = useEconomyStore.getState();
    const aggregateDemand = economyStore.aggregateDemand || 0;
    const demandFactor = Math.min(aggregateDemand / 500, 1); // 0-1
    pressure += demandFactor * 20;

    // Happiness factor (average of residents)
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
    pressure += (avgHappiness / 100) * 15;

    // Road access boost
    const hasRoad = hasRoadAccess(building.position, buildings);
    if (hasRoad) pressure += 10;

    // Service coverage boost
    const serviceStore = useServiceStore.getState();
    const serviceTypes = ['recreation', 'healthcare', 'education', 'safety', 'emergency'];
    let coveredServices = 0;
    for (const type of serviceTypes) {
      const cov = serviceStore.getCoverage(building.position, type as any);
      if (cov.covered) coveredServices++;
    }
    pressure += (coveredServices / serviceTypes.length) * 15;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, pressure));
  },

  getDevelopmentProgress: (buildingId: number) => {
    // This will be stored in BuildingStore; we'll compute from there
    const buildings = useBuildingStore.getState().buildings;
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return 0;
    // Assume we added developmentProgress to Building interface
    return (building as any).developmentProgress || 0;
  },

  processDevelopment: () => {
    const buildings = useBuildingStore.getState().buildings;
    const { day } = useSimulationStore.getState();

    // Filter buildings that can develop (houses, shops, factories)
    const developableTypes = ['house', 'shop', 'factory'];
    const developable = buildings.filter(b => developableTypes.includes(b.type || ''));

    for (const building of developable) {
      const currentLevel = (building as any).level || 1;
      if (currentLevel >= DEV_CONFIG.maxLevel) continue;

      // Check cooldown
      const lastUpgradeDay = (building as any).lastUpgradeDay || 0;
      if (day - lastUpgradeDay < DEV_CONFIG.cooldownDays) continue;

      const pressure = get().getDevelopmentPressure(building.id);
      const progress = (building as any).developmentProgress || 0;

      if (pressure >= DEV_CONFIG.pressureThresholdForUpgrade) {
        // Add progress
        let newProgress = progress + DEV_CONFIG.progressPerDay;
        if (newProgress >= 100) {
          // Upgrade!
          const newLevel = currentLevel + 1;
          // Update building in store
          useBuildingStore.setState((state) => ({
            buildings: state.buildings.map(b =>
              b.id === building.id
                ? { ...b, level: newLevel, developmentProgress: 0, lastUpgradeDay: day }
                : b
            )
          }));
          // Trigger notification (optional)
          // We can add an alert via AlertStore
          useAlertStore.getState().addAlert(
            'info',
            'economy',
            `${building.type} upgraded to Level ${newLevel}`,
            true
          );
        } else {
          // Update progress
          useBuildingStore.setState((state) => ({
            buildings: state.buildings.map(b =>
              b.id === building.id
                ? { ...b, developmentProgress: newProgress }
                : b
            )
          }));
        }
      } else {
        // Degrade progress slowly? For now, keep it.
        // Optionally, if pressure is very low, decrease progress.
      }
    }
  },
}));

export default useDevelopmentStore;