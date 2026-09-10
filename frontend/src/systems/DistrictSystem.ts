import useDistrictStore, {
  type District,
  type DistrictStats,
  specializationForZoneType,
} from "../store/DistrictStore";
import useBuildingStore from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import useNeedsStore from "../store/NeedsStore";
import useLandValueStore from "../store/LandValueStore";
import useDevelopmentStore from "../store/DevelopmentStore";
import useRoadUsageStore, { ROAD_CAPACITY } from "../store/RoadUsageStore";
import useServiceStore from "../store/ServiceStore";
import useZoneStore from "../store/ZoneStore";

export const cellKey = (x: number, z: number) =>
  `${Math.round(x)},${Math.round(z)}`;

const SERVICE_TYPES = [
  "recreation",
  "healthcare",
  "education",
  "safety",
  "emergency",
] as const;

const JOB_CAPACITY: Record<string, number> = {
  shop: 2,
  factory: 5,
};

const BUILDING_CATEGORY: Record<string, string> = {
  house: "residential",
  shop: "commercial",
  factory: "industrial",
  park: "recreation",
  hospital: "service",
  school: "service",
  police_station: "service",
  fire_station: "service",
  power_plant: "utility",
  water_plant: "utility",
};

export const computeDistrictStats = (district: District): DistrictStats => {
  const cellSet = new Set(district.cells);
  const buildings = useBuildingStore.getState().buildings;
  const households = usePopulationStore.getState().households;
  const citizens = usePopulationStore.getState().citizens;
  const needsStore = useNeedsStore.getState();
  const landValueStore = useLandValueStore.getState();
  const developmentStore = useDevelopmentStore.getState();
  const roadUsage = useRoadUsageStore.getState();
  const serviceStore = useServiceStore.getState();

  const districtBuildings = buildings.filter((b) =>
    cellSet.has(cellKey(b.position[0], b.position[2]))
  );

  const buildingIds = new Set(districtBuildings.map((b) => b.id));
  const districtHouseholds = households.filter((h) =>
    buildingIds.has(h.buildingId)
  );

  let population = 0;
  for (const h of districtHouseholds) population += h.population;

  let jobs = 0;
  const byType: Record<string, number> = {};
  const levelCounts: Record<number, number> = {};
  let landValueSum = 0;
  let pressureSum = 0;
  let landValueCount = 0;

  for (const b of districtBuildings) {
    const category = BUILDING_CATEGORY[b.type ?? ""] ?? "other";
    byType[category] = (byType[category] || 0) + 1;
    const capacity = JOB_CAPACITY[b.type ?? ""] || 0;
    if (capacity) {
      const employees = citizens.filter(
        (c) => c.employmentStatus === "employed" && c.jobId === String(b.id)
      ).length;
      jobs += Math.min(capacity, employees);
    }
    const level = (b as { level?: number }).level || 1;
    levelCounts[level] = (levelCounts[level] || 0) + 1;
    if (b.type === "house" || b.type === "shop" || b.type === "factory") {
      landValueSum += landValueStore.getLandValue(b.id);
      pressureSum += developmentStore.getDevelopmentPressure(b.id);
      landValueCount++;
    }
  }

  const districtHouseholdIds = new Set(districtHouseholds.map((h) => h.id));
  const districtCitizens = citizens.filter((c) =>
    districtHouseholdIds.has(c.householdId)
  );
  let happinessSum = 0;
  let happinessCount = 0;
  for (const c of districtCitizens) {
    const needs = needsStore.getNeeds(c.id);
    if (needs) {
      happinessSum += needs.happiness;
      happinessCount++;
    }
  }

  let trafficSum = 0;
  let trafficCount = 0;
  for (const b of districtBuildings) {
    if (b.type === "road") {
      const usage = roadUsage.getUsage(cellKey(b.position[0], b.position[2]));
      trafficSum += Math.min(usage / ROAD_CAPACITY, 1);
      trafficCount++;
    }
  }

  let serviceScore = 0;
  let serviceChecks = 0;
  for (const b of districtBuildings) {
    if (!["house", "shop", "factory"].includes(b.type ?? "")) continue;
    for (const type of SERVICE_TYPES) {
      const coverage = serviceStore.getCoverage(b.position, type);
      serviceScore += coverage.covered ? 1 : 0;
      serviceChecks++;
    }
  }

  const zones = useZoneStore.getState().zones;
  const zonedCells = zones.filter((z) =>
    cellSet.has(cellKey(z.position[0], z.position[2]))
  ).length;

  const avgLandValue = landValueCount ? landValueSum / landValueCount : 0;
  const avgDevPressure = landValueCount ? pressureSum / landValueCount : 0;
  const avgHappiness = happinessCount ? happinessSum / happinessCount : 0;
  const traffic = trafficCount ? trafficSum / trafficCount : 0;
  const serviceCoverage = serviceChecks ? serviceScore / serviceChecks : 0;

  const strengths: string[] = [];
  const problems: string[] = [];

  if (serviceCoverage >= 0.6) strengths.push("Strong service coverage");
  else if (serviceChecks > 0 && serviceCoverage < 0.25)
    problems.push("Weak service coverage");

  if (avgLandValue >= 55) strengths.push("High land value");
  else if (landValueCount > 0 && avgLandValue < 30)
    problems.push("Low land value");

  if (avgHappiness >= 65) strengths.push("Happy residents");
  else if (happinessCount > 0 && avgHappiness < 45)
    problems.push("Low resident happiness");

  if (traffic >= 0.6) problems.push("Heavy traffic");
  else if (trafficCount > 0 && traffic < 0.25) strengths.push("Free-flowing roads");

  if (avgDevPressure >= 55) strengths.push("Strong development pressure");
  else if (landValueCount > 0 && avgDevPressure < 25)
    problems.push("Low development pressure");

  let score = 0;
  if (avgHappiness > 0) score += (avgHappiness / 100) * 2;
  if (serviceCoverage > 0) score += serviceCoverage * 2;
  if (avgLandValue > 0) score += (avgLandValue / 100) * 2;
  if (trafficCount > 0) score += (1 - Math.min(traffic, 1)) * 2;
  if (landValueCount > 0) score += (avgDevPressure / 100) * 2;

  let health: DistrictStats["health"] = "Fair";
  if (score >= 7) health = "Thriving";
  else if (score >= 5) health = "Good";
  else if (score >= 3) health = "Fair";
  else health = "Needs Attention";

  return {
    population,
    households: districtHouseholds.length,
    jobs,
    buildingCount: districtBuildings.length,
    developedCells: districtBuildings.filter((b) => b.type !== "road").length,
    zonedCells,
    byType,
    levelCounts,
    avgLandValue,
    avgHappiness,
    avgDevPressure,
    traffic,
    serviceCoverage,
    health,
    strengths,
    problems,
  };
};

export const recomputeDistrictStats = () => {
  const districts = useDistrictStore.getState().districts;
  if (districts.length === 0) {
    useDistrictStore.getState().setStats({});
    return;
  }
  const stats: Record<string, DistrictStats> = {};
  for (const d of districts) {
    stats[d.id] = computeDistrictStats(d);
  }
  useDistrictStore.getState().setStats(stats);
};

export const getDistrictSpecializationPressureModifier = (
  cellKeyValue: string,
  zoneType: string
): number => {
  const district = useDistrictStore.getState().getDistrictAt(cellKeyValue);
  if (!district) return 0;
  const spec = district.specialization;
  if (spec === "general" || spec === "mixed") return 0;
  const match = specializationForZoneType(zoneType);
  if (!match) return 0;
  if (spec === match) return 6;
  return -3;
};