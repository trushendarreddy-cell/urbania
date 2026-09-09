import { create } from "zustand";
import usePopulationStore from "./PopulationStore";
import useEconomyStore from "./EconomyStore";
import useBuildingStore from "./BuildingStore";
import useServiceStore from "./ServiceStore";
import useUtilityStore from "./UtilityStore";
import useEventStore from "./EventStore";
import useMunicipalStore from "./MunicipalStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import { TAX_EFFECTS } from "./MunicipalStore";

export interface CitizenNeeds {
  housing: number;
  food: number;
  safety: number;
  recreation: number;
  healthcare: number;
  education: number;
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
    // Helper: get service coverage for a position
    const getServiceSatisfaction = (pos: [number, number, number], serviceType: 'recreation' | 'healthcare' | 'education'): number => {
      const coverage = serviceStore.getCoverage(pos, serviceType);
      if (coverage.covered && coverage.distance !== null) {
        const dist = coverage.distance;
        if (dist <= 3) return 100;
        else if (dist <= 6) return 75;
        else if (dist <= 10) return 50;
        else return 30;
      }
      return 20;
    };

    for (const citizen of citizens) {
      const household = households.find(h => h.id === citizen.householdId);
      if (!household) continue;
      const homeBuilding = buildings.find(b => b.id === household.buildingId);
      if (!homeBuilding) continue;

      const isActive = hasRoadAccess(homeBuilding.position, buildings);
      const money = householdMoney[household.id] || 0;

      // Housing: base 100, reduced if utilities missing
      let housing = 100;
      const utilityStatus = useUtilityStore.getState().getUtilityStatus(homeBuilding.id);
      if (utilityStatus) {
        if (!utilityStatus.electricity) housing -= 20;
        if (!utilityStatus.water) housing -= 20;
      }
      housing = Math.max(0, housing);

      // Food: based on household money, capped at 100
      let food = 50; // baseline
      if (money >= 200) food = 100;
      else if (money >= 100) food = 75;
      else if (money >= 50) food = 60;
      else if (money >= 10) food = 40;
      else food = 20;
      if (!isActive) food = Math.max(10, food - 20); // inactive reduces food satisfaction

      // Safety: based on active + police coverage
      let safety = isActive ? 60 : 20;
      const safetyCoverage = serviceStore.getCoverage(homeBuilding.position, "safety");
      if (isActive && safetyCoverage.covered) {
        safety = 90;
      } else if (isActive && !safetyCoverage.covered) {
        safety = 60;
      }
      // else inactive stays low

      // Recreation, healthcare, education: based on service coverage
      let recreation = getServiceSatisfaction(homeBuilding.position, "recreation");
      if (!isActive) recreation = Math.max(10, recreation - 20);

      let healthcare = getServiceSatisfaction(homeBuilding.position, "healthcare");
      if (!isActive) healthcare = Math.max(10, healthcare - 20);

      let education = 20; // base for children
      if (citizen.age < 18) {
        education = getServiceSatisfaction(homeBuilding.position, "education");
        if (!isActive) education = Math.max(10, education - 20);
      } else {
        education = 100; // adults don't need education for this milestone
      }

      // Clamp all needs 0-100
      const clamp = (v: number) => Math.max(0, Math.min(100, v));
      const needs: CitizenNeeds = {
        housing: clamp(housing),
        food: clamp(food),
        safety: clamp(safety),
        recreation: clamp(recreation),
        healthcare: clamp(healthcare),
        education: clamp(education),
      };
      // Average of 6 needs
      let happiness = (needs.housing + needs.food + needs.safety + needs.recreation + needs.healthcare + needs.education) / 6;
      // Apply event penalties if any active events nearby
      const activeEvents = useEventStore.getState().getActiveEvents();
      let eventPenalty = 0;
      for (const e of activeEvents) {
        if (e.status === 'resolved') continue;
        const dx = homeBuilding.position[0] - e.position[0];
        const dz = homeBuilding.position[2] - e.position[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 10) {
          eventPenalty += e.severity * 2;
        }
      }
      happiness = clamp(happiness - eventPenalty);
      // Also factor in road access: if inactive, reduce happiness further
      if (!isActive) {
        happiness = Math.max(0, happiness - 10);
      }
      // Tax effect on happiness
      const taxRate = useMunicipalStore.getState().taxRate;
      const taxEffect = TAX_EFFECTS[taxRate]?.happinessMod || 0;
      happiness = clamp(happiness + taxEffect);

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