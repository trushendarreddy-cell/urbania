import { create } from "zustand";
import usePopulationStore from "./PopulationStore";
import useEconomyStore from "./EconomyStore";
import useBuildingStore from "./BuildingStore";
import useServiceStore from "./ServiceStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";

export interface CitizenNeeds {
  housing: number;
  food: number;
  safety: number;
  recreation: number;
}

export interface CitizenHappiness extends CitizenNeeds {
  happiness: number;
  category: 'Very Happy' | 'Happy' | 'Neutral' | 'Unhappy' | 'Very Unhappy';
}

interface NeedsStore {
  needs: Record<string, CitizenHappiness>; // citizenId -> needs+happiness
  recomputeAll: () => void;
  getNeeds: (citizenId: string) => CitizenHappiness | undefined;
}

const useNeedsStore = create<NeedsStore>((set, get) => {
  const recomputeAll = () => {
    const citizens = usePopulationStore.getState().citizens;
    const households = usePopulationStore.getState().households;
    const buildings = useBuildingStore.getState().buildings;
    const householdMoney = useEconomyStore.getState().householdMoney;
    const serviceStore = useServiceStore.getState();

    const newNeeds: Record<string, CitizenHappiness> = {};

    for (const citizen of citizens) {
      const household = households.find(h => h.id === citizen.householdId);
      if (!household) continue;
      const homeBuilding = buildings.find(b => b.id === household.buildingId);
      if (!homeBuilding) continue;

      const isActive = hasRoadAccess(homeBuilding.position, buildings);
      const money = householdMoney[household.id] || 0;

      // Housing: 100 if home exists, else 0 (but home exists by construction)
      const housing = 100;

      // Food: based on household money, capped at 100
      let food = 50; // baseline
      if (money >= 200) food = 100;
      else if (money >= 100) food = 75;
      else if (money >= 50) food = 60;
      else if (money >= 10) food = 40;
      else food = 20;
      if (!isActive) food = Math.max(10, food - 20); // inactive reduces food satisfaction

      // Safety: based on active + road access
      let safety = isActive ? 80 : 30;
      // basic infrastructure bonus if there are roads nearby? keep simple
      if (isActive) safety = Math.min(100, safety + 10);

      // Recreation: based on service coverage
      let recreation = 20;
      const coverage = serviceStore.getCoverage(homeBuilding.position, "recreation");
      if (coverage.covered && coverage.distance !== null) {
        const dist = coverage.distance;
        if (dist <= 3) recreation = 100;
        else if (dist <= 6) recreation = 75;
        else if (dist <= 10) recreation = 50;
        else recreation = 30;
      }
      if (!isActive) recreation = Math.max(10, recreation - 20);

      // Clamp all needs 0-100
      const clamp = (v: number) => Math.max(0, Math.min(100, v));
      const needs: CitizenNeeds = {
        housing: clamp(housing),
        food: clamp(food),
        safety: clamp(safety),
        recreation: clamp(recreation),
      };
      const happiness = clamp((needs.housing + needs.food + needs.safety + needs.recreation) / 4);

      let category: CitizenHappiness['category'];
      if (happiness >= 80) category = 'Very Happy';
      else if (happiness >= 60) category = 'Happy';
      else if (happiness >= 40) category = 'Neutral';
      else if (happiness >= 20) category = 'Unhappy';
      else category = 'Very Unhappy';

      newNeeds[citizen.id] = { ...needs, happiness, category };
    }

    set({ needs: newNeeds });
  };

  return {
    needs: {},
    recomputeAll,
    getNeeds: (citizenId: string) => get().needs[citizenId],
  };
});

export default useNeedsStore;