import useDistrictStore, {
  type District,
  type DistrictStats,
  type NeighborhoodCharacter,
  type DevelopmentTrend,
  type ServiceBreakdown,
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
import useAlertStore from "../store/AlertStore";
import { hasRoadAccess } from "./RoadAccessSystem";

export const cellKey = (x: number, z: number) =>
  `${Math.round(x)},${Math.round(z)}`;

const SERVICE_LABELS: Record<string, string> = {
  recreation: "Parks",
  healthcare: "Healthcare",
  education: "Education",
  safety: "Police",
  emergency: "Fire",
};

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
  hospital: "civic",
  school: "civic",
  police_station: "civic",
  fire_station: "civic",
  power_plant: "utility",
  water_plant: "utility",
};

const deriveCharacter = (byType: Record<string, number>): NeighborhoodCharacter => {
  const residential = byType.residential || 0;
  const commercial = byType.commercial || 0;
  const industrial = byType.industrial || 0;
  const civic = byType.civic || 0;
  const total = residential + commercial + industrial + civic;

  if (total < 3) return "Emerging";

  const share = (n: number) => n / total;
  const r = share(residential);
  const c = share(commercial);
  const i = share(industrial);
  const v = share(civic);

  if (i >= 0.5) return "Industrial";
  if (v >= 0.5) return "Civic";
  if (r >= 0.6) return "Residential";
  if (c >= 0.6) return "Commercial";
  if (r >= 0.35 && c >= 0.25) return "Mixed";
  if (i >= 0.3) return "Industrial";
  if (c >= 0.35) return "Commercial";
  if (r >= 0.35) return "Residential";
  return "Mixed";
};

const deriveTrend = (
  avgDevPressure: number,
  avgLandValue: number,
  avgHappiness: number,
  serviceCoverage: number,
  traffic: number,
  zonedCells: number,
  buildingCount: number
): DevelopmentTrend => {
  if (buildingCount === 0) return "Stable";

  let score = 0;
  score += avgDevPressure >= 65 ? 2 : avgDevPressure >= 45 ? 1 : avgDevPressure < 25 ? -1 : 0;
  score += avgLandValue >= 55 ? 1 : avgLandValue < 30 ? -1 : 0;
  score += avgHappiness >= 65 ? 1 : avgHappiness > 0 && avgHappiness < 45 ? -1 : 0;
  score += serviceCoverage >= 0.6 ? 1 : serviceCoverage > 0 && serviceCoverage < 0.25 ? -1 : 0;
  score += traffic >= 0.6 ? -1 : 0;
  score += zonedCells >= 3 ? 1 : 0;

  if (score >= 4) return "Rapid Growth";
  if (score >= 2) return "Growing";
  if (score >= -1) return "Stable";
  if (score >= -3) return "Stagnating";
  return "Declining";
};

const serviceLevelFromCoverage = (coverage: number): "Good" | "Fair" | "Poor" => {
  if (coverage >= 0.6) return "Good";
  if (coverage >= 0.25) return "Fair";
  return "Poor";
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
  let developedUnits = 0;
  let highLevelCount = 0;
  let roadCount = 0;

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
    if (level >= 2) highLevelCount++;
    if (b.type === "road") roadCount++;
    if (b.type === "house" || b.type === "shop" || b.type === "factory") {
      developedUnits++;
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

  const serviceStats: Record<string, { covered: number; total: number }> = {};
  for (const type of SERVICE_TYPES) {
    serviceStats[type] = { covered: 0, total: 0 };
  }
  let roadAccessCount = 0;
  let accessChecks = 0;
  for (const b of districtBuildings) {
    if (!["house", "shop", "factory"].includes(b.type ?? "")) continue;
    accessChecks++;
    if (hasRoadAccess(b.position, buildings)) roadAccessCount++;
    for (const type of SERVICE_TYPES) {
      const coverage = serviceStore.getCoverage(b.position, type);
      serviceStats[type].total++;
      if (coverage.covered) serviceStats[type].covered++;
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
  const accessibility = accessChecks ? roadAccessCount / accessChecks : 0;

  let serviceScore = 0;
  let serviceChecks = 0;
  for (const type of SERVICE_TYPES) {
    serviceScore += serviceStats[type].covered;
    serviceChecks += serviceStats[type].total;
  }
  const serviceCoverage = serviceChecks ? serviceScore / serviceChecks : 0;

  const services: ServiceBreakdown[] = SERVICE_TYPES.map((type) => {
    const stat = serviceStats[type];
    const level =
      stat.total === 0
        ? "None"
        : serviceLevelFromCoverage(stat.covered / stat.total);
    return { label: SERVICE_LABELS[type], level };
  });

  const character = deriveCharacter(byType);
  const trend = deriveTrend(
    avgDevPressure,
    avgLandValue,
    avgHappiness,
    serviceCoverage,
    traffic,
    zonedCells,
    districtBuildings.length
  );

  const trafficLevel: DistrictStats["trafficLevel"] =
    trafficCount === 0
      ? "None"
      : traffic >= 0.6
      ? "Heavy"
      : traffic >= 0.3
      ? "Moderate"
      : "Low";

  let developmentActivity: DistrictStats["developmentActivity"] = "None";
  if (zonedCells > 0 || avgDevPressure >= 55) developmentActivity = "High";
  else if (avgDevPressure >= 35) developmentActivity = "Moderate";
  else if (developedUnits > 0) developmentActivity = "Low";

  let quality = 0;
  quality += (avgHappiness / 100) * 30;
  quality += serviceCoverage * 25;
  quality += (avgLandValue / 100) * 20;
  quality += accessibility * 15;
  quality += Math.min(1, avgDevPressure / 60) * 10;
  quality -= Math.min(traffic, 1) * 10;
  quality = Math.max(0, Math.min(100, Math.round(quality)));

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

  if (trafficLevel === "Heavy") problems.push("Heavy traffic");
  else if (trafficLevel === "Low") strengths.push("Free-flowing roads");

  if (accessibility >= 0.8) strengths.push("Good road access");
  else if (accessChecks > 0 && accessibility < 0.5)
    problems.push("Poor road access");

  if (avgDevPressure >= 55) strengths.push("Strong development pressure");
  else if (landValueCount > 0 && avgDevPressure < 25)
    problems.push("Low development pressure");

  const worst = services
    .filter((s) => s.level !== "None")
    .sort((a, b) => {
      const rank: Record<string, number> = { Poor: 0, Fair: 1, Good: 2 };
      return rank[a.level] - rank[b.level];
    })[0];
  const priority =
    worst && worst.level !== "Good" ? `Improve ${worst.label}` : null;

  let health: DistrictStats["health"] = "Fair";
  if (quality >= 75) health = "Thriving";
  else if (quality >= 55) health = "Good";
  else if (quality >= 35) health = "Fair";
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
    character,
    trend,
    quality,
    qualityReasons: [...strengths.slice(0, 3), ...problems.slice(0, 3)],
    services,
    priority,
    trafficLevel,
    developmentActivity,
  };
};

let lastNotifiedTrend: Record<string, string> = {};
let lastNotifiedTraffic: Record<string, string> = {};

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
  emitDistrictNotifications(districts, stats);
};

const emitDistrictNotifications = (
  districts: District[],
  stats: Record<string, DistrictStats>
) => {
  const alertStore = useAlertStore.getState();
  const nextTrend: Record<string, string> = {};
  const nextTraffic: Record<string, string> = {};

  for (const d of districts) {
    const stat = stats[d.id];
    if (!stat) continue;
    nextTrend[d.id] = stat.trend;
    nextTraffic[d.id] = stat.trafficLevel;

    const prevTrend = lastNotifiedTrend[d.id];
    if (
      (stat.trend === "Rapid Growth" || stat.trend === "Declining") &&
      prevTrend !== stat.trend
    ) {
      if (stat.trend === "Rapid Growth") {
        alertStore.addAlert(
          "info",
          "population",
          `${d.name} is experiencing rapid growth.`,
          true
        );
      } else {
        alertStore.addAlert(
          "warning",
          "population",
          `${d.name} is declining.`,
          true
        );
      }
    }

    const prevTraffic = lastNotifiedTraffic[d.id];
    if (stat.trafficLevel === "Heavy" && prevTraffic !== "Heavy") {
      alertStore.addAlert(
        "warning",
        "traffic",
        `${d.name} has heavy traffic.`,
        true
      );
    }

    if (stat.health === "Needs Attention" && prevTrend !== "Needs Attention") {
      alertStore.addAlert(
        "warning",
        "service",
        `${d.name} needs attention (quality ${stat.quality}).`,
        true
      );
    }
  }

  lastNotifiedTrend = nextTrend;
  lastNotifiedTraffic = nextTraffic;
};

export const resetDistrictNotifications = () => {
  lastNotifiedTrend = {};
  lastNotifiedTraffic = {};
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