import { create } from "zustand";
import usePopulationStore from "./PopulationStore";
import useEconomyStore from "./EconomyStore";
import useNeedsStore from "./NeedsStore";
import useCityDemandStore from "./CityDemandStore";
import useBuildingStore from "./BuildingStore";
import useServiceStore from "./ServiceStore";
import useUtilityStore from "./UtilityStore";

interface CityStatistics {
  population: number;
  households: number;
  employed: number;
  unemployed: number;
  employmentRate: number;
  averageHappiness: number;
  economicHealth: number;
  residentialDemand: number;
  commercialDemand: number;
  industrialDemand: number;
  totalMoney: number;
  dailyIncome: number;
  dailySpending: number;
  totalBusinessRevenue: number;
  recreationCoverage: number;
  healthcareCoverage: number;
  educationCoverage: number;
  safetyCoverage: number;
  emergencyCoverage: number;
  electricCoverage: number;
  waterCoverage: number;
}

interface CityStatsStore extends CityStatistics {
  recompute: () => void;
}

const useCityStatsStore = create<CityStatsStore>((set, get) => {
  const recompute = () => {
    const pop = usePopulationStore.getState();
    const econ = useEconomyStore.getState();
    const needs = useNeedsStore.getState();
    const demand = useCityDemandStore.getState();
    const buildings = useBuildingStore.getState().buildings;
    const serviceStore = useServiceStore.getState();
    const utilityStore = useUtilityStore.getState();

    const totalPopulation = pop.totalPopulation;
    const totalHouseholds = pop.totalHouseholds;
    const employed = pop.employed;
    const unemployed = pop.unemployed;
    const employmentRate = totalPopulation > 0 ? (employed / totalPopulation) * 100 : 0;

    // Average happiness
    const happinessValues = Object.values(needs.needs).map(n => n.happiness);
    const avgHappiness = happinessValues.length > 0
      ? happinessValues.reduce((a, b) => a + b, 0) / happinessValues.length
      : 0;

    // Total money
    const totalMoney = Object.values(econ.householdMoney).reduce((a, b) => a + b, 0);

    // Service coverage
    const households = pop.households;
    let recCovered = 0, healthCovered = 0, safetyCovered = 0, emergCovered = 0;
    let childrenWithEdu = 0, totalChildren = 0;
    let elecCovered = 0, waterCovered = 0, utilityBuildings = 0;

    for (const h of households) {
      const b = buildings.find(bld => bld.id === h.buildingId);
      if (!b) continue;
      const rec = serviceStore.getCoverage(b.position, "recreation");
      if (rec.covered) recCovered++;
      const health = serviceStore.getCoverage(b.position, "healthcare");
      if (health.covered) healthCovered++;
      const safety = serviceStore.getCoverage(b.position, "safety");
      if (safety.covered) safetyCovered++;
      const emerg = serviceStore.getCoverage(b.position, "emergency");
      if (emerg.covered) emergCovered++;
    }

    for (const c of pop.citizens) {
      if (c.age < 18) {
        totalChildren++;
        const h = households.find(hh => hh.id === c.householdId);
        if (h) {
          const b = buildings.find(bld => bld.id === h.buildingId);
          if (b) {
            const edu = serviceStore.getCoverage(b.position, "education");
            if (edu.covered) childrenWithEdu++;
          }
        }
      }
    }

    for (const b of buildings) {
      if (['house', 'shop', 'factory', 'hospital', 'school', 'police_station', 'fire_station'].includes(b.type || '')) {
        utilityBuildings++;
        const status = utilityStore.getUtilityStatus(b.id);
        if (status) {
          if (status.electricity) elecCovered++;
          if (status.water) waterCovered++;
        }
      }
    }

    const totalHouseholdsCount = households.length || 1;
    const recCoverage = (recCovered / totalHouseholdsCount) * 100;
    const healthCoverage = (healthCovered / totalHouseholdsCount) * 100;
    const safetyCoverage = (safetyCovered / totalHouseholdsCount) * 100;
    const emergCoverage = (emergCovered / totalHouseholdsCount) * 100;
    const eduCoverage = totalChildren > 0 ? (childrenWithEdu / totalChildren) * 100 : 0;
    const elecCoverage = utilityBuildings > 0 ? (elecCovered / utilityBuildings) * 100 : 0;
    const waterCoverage = utilityBuildings > 0 ? (waterCovered / utilityBuildings) * 100 : 0;

    set({
      population: totalPopulation,
      households: totalHouseholds,
      employed,
      unemployed,
      employmentRate,
      averageHappiness: avgHappiness,
      economicHealth: econ.economicHealth,
      residentialDemand: demand.residential,
      commercialDemand: demand.commercial,
      industrialDemand: demand.industrial,
      totalMoney,
      dailyIncome: econ.dailyIncome,
      dailySpending: econ.dailySpending,
      totalBusinessRevenue: econ.totalBusinessRevenue,
      recreationCoverage: recCoverage,
      healthcareCoverage: healthCoverage,
      educationCoverage: eduCoverage,
      safetyCoverage,
      emergencyCoverage: emergCoverage,
      electricCoverage: elecCoverage,
      waterCoverage,
    });
  };

  // Subscribe to all relevant stores
  usePopulationStore.subscribe(() => recompute());
  useEconomyStore.subscribe(() => recompute());
  useNeedsStore.subscribe(() => recompute());
  useCityDemandStore.subscribe(() => recompute());
  useBuildingStore.subscribe(() => recompute());
  useServiceStore.subscribe(() => recompute());
  useUtilityStore.subscribe(() => recompute());

  return {
    population: 0,
    households: 0,
    employed: 0,
    unemployed: 0,
    employmentRate: 0,
    averageHappiness: 0,
    economicHealth: 0,
    residentialDemand: 0,
    commercialDemand: 0,
    industrialDemand: 0,
    totalMoney: 0,
    dailyIncome: 0,
    dailySpending: 0,
    totalBusinessRevenue: 0,
    recreationCoverage: 0,
    healthcareCoverage: 0,
    educationCoverage: 0,
    safetyCoverage: 0,
    emergencyCoverage: 0,
    electricCoverage: 0,
    waterCoverage: 0,
    recompute,
  };
});

export default useCityStatsStore;