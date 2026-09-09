import { create } from "zustand";
import { useSimulationStore } from "../stores/useSimulationStore";
import useVehicleStore from "./VehicleStore";
import usePopulationStore from "./PopulationStore";

export type ActivityLevel = "QUIET" | "NORMAL" | "BUSY" | "PEAK";
export type TimeOfDayLabel = "DAWN" | "DAY" | "DUSK" | "NIGHT";

interface ActivityState {
  // Derived
  level: ActivityLevel;
  timeLabel: TimeOfDayLabel;
  // Computed for UI
  getActivityLabel: () => string;
  getTimeLabel: () => string;
  // For building window emission
  getWindowIntensity: (buildingType: string, level: number) => number;
  // For traffic density
  getTrafficDensity: () => number; // 0-1
}

const useActivityStore = create<ActivityState>((set, get) => {
  const compute = () => {
    const { timeOfDay } = useSimulationStore.getState();
    const vehicleCount = useVehicleStore.getState().getVehicleCount();
    const totalPopulation = usePopulationStore.getState().totalPopulation;

    // Time label
    let timeLabel: TimeOfDayLabel;
    if (timeOfDay >= 5 && timeOfDay < 8) timeLabel = "DAWN";
    else if (timeOfDay >= 8 && timeOfDay < 17) timeLabel = "DAY";
    else if (timeOfDay >= 17 && timeOfDay < 20) timeLabel = "DUSK";
    else timeLabel = "NIGHT";

    // Activity level based on time and traffic/population
    let level: ActivityLevel = "NORMAL";
    const isDay = timeOfDay >= 8 && timeOfDay < 17;
    const isEvening = timeOfDay >= 17 && timeOfDay < 20;
    const isNight = timeOfDay >= 20 || timeOfDay < 5;
    const isMorning = timeOfDay >= 5 && timeOfDay < 8;

    // Base level from time
    if (isNight) level = "QUIET";
    else if (isMorning || isEvening) level = "PEAK";
    else if (isDay) {
      // During day, activity depends on population and traffic
      if (totalPopulation > 100 || vehicleCount > 20) level = "BUSY";
      else level = "NORMAL";
    }

    // Adjust for low population
    if (totalPopulation < 10) level = "QUIET";

    set({ level, timeLabel });
  };

  // Subscribe to simulation store changes
  useSimulationStore.subscribe(() => compute());
  useVehicleStore.subscribe(() => compute());
  usePopulationStore.subscribe(() => compute());

  // Initial computation
  setTimeout(compute, 0);

  return {
    level: "NORMAL",
    timeLabel: "DAY",

    getActivityLabel: () => {
      const level = get().level;
      return level;
    },

    getTimeLabel: () => {
      return get().timeLabel;
    },

    getWindowIntensity: (buildingType: string, level: number) => {
      const { timeLabel, level: activityLevel } = get();
      // Base intensity from building type and level
      let base = 0;
      if (buildingType === "house") base = 0.3;
      else if (buildingType === "shop") base = 0.5;
      else if (buildingType === "factory") base = 0.2;
      else return 0;

      // Scale by level (higher level = more windows)
      base *= (0.7 + level * 0.15);

      // Time factor
      let timeFactor = 0;
      if (timeLabel === "NIGHT") timeFactor = 0.8;
      else if (timeLabel === "DAWN" || timeLabel === "DUSK") timeFactor = 0.4;
      else timeFactor = 0.1;

      // Activity factor
      let activityFactor = 0;
      if (activityLevel === "QUIET") activityFactor = 0.3;
      else if (activityLevel === "NORMAL") activityFactor = 0.6;
      else if (activityLevel === "BUSY") activityFactor = 0.8;
      else if (activityLevel === "PEAK") activityFactor = 1.0;

      // Shop: higher activity in evening
      if (buildingType === "shop" && (timeLabel === "DUSK" || timeLabel === "NIGHT")) {
        activityFactor *= 1.2;
      }

      let intensity = base * (timeFactor * 0.6 + activityFactor * 0.4);
      return Math.min(1, intensity);
    },

    getTrafficDensity: () => {
      const { level } = get();
      const vehicleCount = useVehicleStore.getState().getVehicleCount();
      const maxVehicles = 50;
      const ratio = Math.min(1, vehicleCount / maxVehicles);
      if (level === "PEAK") return Math.min(1, ratio * 1.2);
      if (level === "BUSY") return ratio * 0.8;
      if (level === "NORMAL") return ratio * 0.5;
      return ratio * 0.2;
    },
  };
});

export default useActivityStore;