import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import usePopulationStore from "./PopulationStore";
import useEconomyStore from "./EconomyStore";
import useNeedsStore from "./NeedsStore";
import { useSimulationStore } from "../stores/useSimulationStore";

interface CityDemand {
  residential: number; // 0-100
  commercial: number;  // 0-100
  industrial: number;  // 0-100
}

interface CityDemandStore extends CityDemand {
  recompute: () => void;
}

const useCityDemandStore = create<CityDemandStore>((set) => {
  const recompute = () => {
    const buildings = useBuildingStore.getState().buildings;
    const popStore = usePopulationStore.getState();
    // const econStore = useEconomyStore.getState();
    const needsStore = useNeedsStore.getState();

    const totalPopulation = popStore.totalPopulation;
    const totalHouseholds = popStore.totalHouseholds;
    const employed = popStore.employed;
    const unemployed = popStore.unemployed;
    // const totalJobs = popStore.totalJobs;
    const avgHappiness = (() => {
      const values = Object.values(needsStore.needs).map(n => n.happiness);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 50;
    })();

    // Count buildings by type
    const houses = buildings.filter(b => b.type === 'house').length;
    const shops = buildings.filter(b => b.type === 'shop').length;
    const factories = buildings.filter(b => b.type === 'factory').length;

    // Residential demand: based on population vs housing, unemployment, happiness
    let residential = 50; // base
    if (totalPopulation > 0 && totalHouseholds > 0) {
      const housingRatio = houses / (totalHouseholds || 1);
      // If housing is scarce, demand high
      if (housingRatio < 0.8) residential += 30;
      else if (housingRatio < 1.2) residential += 10;
      else residential -= 10;
    } else {
      residential = 20; // low if no people
    }
    // Unemployment decreases residential demand (people can't afford new homes)
    const unemploymentRate = totalPopulation > 0 ? unemployed / totalPopulation : 0;
    residential -= unemploymentRate * 30;
    // Happiness boosts demand
    residential += (avgHappiness - 50) * 0.3;
    residential = Math.max(0, Math.min(100, residential));

    // Commercial demand: based on population vs shops, employment, happiness
    let commercial = 50;
    if (totalPopulation > 0 && shops > 0) {
      const shopRatio = shops / (totalPopulation / 4); // rough: 1 shop per 4 people
      if (shopRatio < 0.5) commercial += 30;
      else if (shopRatio < 1.0) commercial += 10;
      else commercial -= 10;
    } else {
      commercial = 20;
    }
    // Employment: higher employment -> more commercial demand (people have money to spend)
    const employmentRate = totalPopulation > 0 ? employed / totalPopulation : 0;
    commercial += employmentRate * 20;
    commercial += (avgHappiness - 50) * 0.2;
    commercial = Math.max(0, Math.min(100, commercial));

    // Industrial demand: based on commercial demand, population, factories
    let industrial = 30;
    if (totalPopulation > 0 && factories > 0) {
      const factoryRatio = factories / (totalPopulation / 10);
      if (factoryRatio < 0.3) industrial += 30;
      else if (factoryRatio < 0.6) industrial += 10;
      else industrial -= 10;
    } else {
      industrial = 10;
    }
    // Industrial demand linked to commercial (to supply goods)
    industrial += commercial * 0.3;
    industrial = Math.max(0, Math.min(100, industrial));

    set({ residential, commercial, industrial });
  };

  // Recompute on relevant changes
  useBuildingStore.subscribe(() => recompute());
  usePopulationStore.subscribe(() => recompute());
  useEconomyStore.subscribe(() => recompute());
  useNeedsStore.subscribe(() => recompute());
  useSimulationStore.subscribe(() => recompute());

  return {
    residential: 0,
    commercial: 0,
    industrial: 0,
    recompute,
  };
});

export default useCityDemandStore;