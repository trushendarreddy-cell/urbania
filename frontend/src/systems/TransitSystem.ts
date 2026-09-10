import useTransitStore, {
  type TransitLine,
  type TransitStop,
  type BusState,
} from "../store/TransitStore";
import useBuildingStore from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import useDistrictStore from "../store/DistrictStore";
import useAlertStore from "../store/AlertStore";
import { getRoadGraph, findPath } from "./PathfindingSystem";
import { useSimulationStore } from "../stores/useSimulationStore";

export interface LineRoute {
  lineId: string;
  stopIds: string[];
  roadPath: string[];
  disrupted: boolean;
  reason: string | null;
}

const routeCache = new Map<string, LineRoute>();

export const clearTransitRouteCache = () => routeCache.clear();

const roadKeyFor = (stop: TransitStop): string => stop.roadKey;

const computeLineRoute = (line: TransitLine): LineRoute => {
  const stops = useTransitStore.getState().stops;
  const lineStops = line.stopIds
    .map((id) => stops.find((s) => s.id === id))
    .filter((s): s is TransitStop => !!s);

  if (lineStops.length < 2) {
    return {
      lineId: line.id,
      stopIds: line.stopIds,
      roadPath: [],
      disrupted: true,
      reason: "Line needs at least two stops",
    };
  }

  const buildings = useBuildingStore.getState().buildings;
  const graph = getRoadGraph(buildings);
  const fullPath: string[] = [];

  for (let i = 0; i < lineStops.length - 1; i++) {
    const startKey = roadKeyFor(lineStops[i]);
    const endKey = roadKeyFor(lineStops[i + 1]);
    const segment = findPath(startKey, endKey, graph);
    if (!segment) {
      return {
        lineId: line.id,
        stopIds: line.stopIds,
        roadPath: [],
        disrupted: true,
        reason: "Road connection unavailable",
      };
    }
    if (i > 0) segment.shift();
    fullPath.push(...segment);
  }

  return {
    lineId: line.id,
    stopIds: line.stopIds,
    roadPath: fullPath,
    disrupted: false,
    reason: null,
  };
};

export const recomputeTransitRoutes = () => {
  const lines = useTransitStore.getState().lines;
  const store = useTransitStore.getState();
  for (const line of lines) {
    const route = computeLineRoute(line);
    routeCache.set(line.id, route);
    if (route.disrupted !== line.disrupted) {
      store.setDisrupted(line.id, route.disrupted, route.reason);
      if (route.disrupted) {
        useAlertStore
          .getState()
          .addAlert(
            "warning",
            "traffic",
            `${line.name} route disrupted: ${route.reason}.`,
            true
          );
      }
    }
  }
};

export const getLineRoute = (lineId: string): LineRoute | undefined =>
  routeCache.get(lineId);

const BUS_SPEED = 3;
const DWELL_HOURS = 0.03;
const MAX_BUSES_PER_LINE = 3;

const busesForLine = (routeLength: number): number => {
  const base = Math.max(1, Math.floor(routeLength / 10));
  return Math.min(MAX_BUSES_PER_LINE, base);
};

export const updateBuses = (deltaHours: number) => {
  const store = useTransitStore.getState();
  const { lines, buses } = store;
  const nextBuses: BusState[] = [];

  for (const line of lines) {
    if (!line.enabled || line.disrupted) continue;
    const route = routeCache.get(line.id);
    if (!route || route.roadPath.length < 2) continue;

    const target = busesForLine(route.roadPath.length);
    const lineBuses = buses.filter((b) => b.lineId === line.id);

    const initialized = [...lineBuses];
    while (initialized.length < target) {
      const idx = initialized.length;
      initialized.push({
        id: `${line.id}-bus-${idx}`,
        lineId: line.id,
        segmentIndex: Math.floor(
          (route.roadPath.length - 1) * (idx / target)
        ),
        progress: 0,
        direction: 1,
        status: "traveling",
        dwell: 0,
      });
    }

    for (const bus of initialized.slice(0, target)) {
      if (bus.status === "boarding") {
        const dwell = bus.dwell - deltaHours;
        if (dwell <= 0) {
          nextBuses.push({
            ...bus,
            status: "traveling",
            dwell: 0,
          });
        } else {
          nextBuses.push({ ...bus, dwell });
        }
        continue;
      }

      const remaining = BUS_SPEED * deltaHours;
      let progress = bus.progress + remaining;
      let segmentIndex = bus.segmentIndex;
      let status: BusState["status"] = "traveling";

      if (progress >= 1) {
        progress = 0;
        if (bus.direction === 1) {
          segmentIndex++;
          if (segmentIndex >= route.roadPath.length - 1) {
            segmentIndex = route.roadPath.length - 1;
            status = "boarding";
          }
        } else {
          segmentIndex--;
          if (segmentIndex < 0) {
            segmentIndex = 0;
            status = "boarding";
          }
        }
      }

      nextBuses.push({
        ...bus,
        segmentIndex,
        progress,
        status,
        dwell: status === "boarding" ? DWELL_HOURS : 0,
      });
    }
  }

  store.setBuses(nextBuses);
};

export const busWorldPosition = (bus: BusState): [number, number, number] => {
  const route = routeCache.get(bus.lineId);
  if (!route || route.roadPath.length === 0) return [0, 0.02, 0];
  const a = route.roadPath[Math.min(bus.segmentIndex, route.roadPath.length - 1)];
  const b =
    route.roadPath[
      Math.min(bus.segmentIndex + 1, route.roadPath.length - 1)
    ];
  const [ax, az] = a.split(",").map(Number);
  const [bx, bz] = b.split(",").map(Number);
  return [
    ax + (bx - ax) * bus.progress,
    0.02,
    az + (bz - az) * bus.progress,
  ];
};

const populationNear = (
  position: [number, number, number],
  radius: number
): { population: number; jobs: number } => {
  const buildings = useBuildingStore.getState().buildings;
  const households = usePopulationStore.getState().households;
  const buildingIds = new Set(
    buildings
      .filter((b) => {
        const dx = b.position[0] - position[0];
        const dz = b.position[2] - position[2];
        return Math.hypot(dx, dz) <= radius;
      })
      .map((b) => b.id)
  );
  let population = 0;
  for (const h of households) {
    if (buildingIds.has(h.buildingId)) population += h.population;
  }
  const jobs = buildings
    .filter(
      (b) =>
        buildingIds.has(b.id) && (b.type === "shop" || b.type === "factory")
    )
    .reduce((sum, b) => sum + (b.type === "shop" ? 2 : 5), 0);
  return { population, jobs };
};

export const STOP_RADIUS = 6;

export const computeStopStats = (stop: TransitStop) => {
  const lines = useTransitStore
    .getState()
    .lines.filter((l) => l.stopIds.includes(stop.id));
  const { population, jobs } = populationNear(stop.position, STOP_RADIUS);
  const riders = estimateRiders(population, jobs, lines.length);
  const level = coverageLevel(riders, population + jobs);
  return { lines: lines.length, population, jobs, riders, level };
};

const estimateRiders = (
  population: number,
  jobs: number,
  lineCount: number
): number => {
  const commuteDemand = Math.min(population, jobs) * 2 + population * 0.5;
  const lineFactor = Math.min(1, lineCount * 0.6);
  return Math.round(commuteDemand * lineFactor);
};

const coverageLevel = (
  riders: number,
  nearby: number
): "Good" | "Fair" | "Poor" | "None" => {
  if (nearby === 0) return "None";
  const ratio = riders / Math.max(nearby, 1);
  if (ratio >= 0.8) return "Good";
  if (ratio >= 0.4) return "Fair";
  return "Poor";
};

export const computeTransitStats = () => {
  const { stops, lines, buses } = useTransitStore.getState();
  const households = usePopulationStore.getState().households;

  let coveredHouseholds = 0;
  const buildings = useBuildingStore.getState().buildings;
  for (const h of households) {
    const building = buildings.find((b) => b.id === h.buildingId);
    if (!building) continue;
    const near = stops.some((s) => {
      const dx = s.position[0] - building.position[0];
      const dz = s.position[2] - building.position[2];
      return Math.hypot(dx, dz) <= STOP_RADIUS;
    });
    if (near) coveredHouseholds++;
  }

  const totalHouseholds = households.length;
  const coverage =
    totalHouseholds > 0 ? (coveredHouseholds / totalHouseholds) * 100 : 0;

  let dailyRiders = 0;
  for (const stop of stops) {
    dailyRiders += computeStopStats(stop).riders;
  }

  const districts = useDistrictStore.getState().districts;
  const stats = useDistrictStore.getState().stats;
  const highDemand: string[] = [];
  const lowCoverage: string[] = [];
  for (const d of districts) {
    const stat = stats[d.id];
    if (!stat) continue;
    const districtStops = stops.filter((s) => {
      const key = s.cellKey;
      return d.cells.includes(key);
    });
    const districtCoverage =
      stat.households > 0
        ? Math.min(1, districtStops.length / Math.max(1, stat.households / 4))
        : 0;
    const demandScore =
      stat.population / 100 + stat.traffic * 2 - districtCoverage * 2;
    if (demandScore >= 1.5) highDemand.push(d.name);
    if (stat.households > 3 && districtCoverage < 0.3)
      lowCoverage.push(d.name);
  }

  let network: "Good" | "Fair" | "Poor" = "Poor";
  if (coverage >= 60 && lines.length >= 2) network = "Good";
  else if (coverage >= 30 || lines.length >= 1) network = "Fair";

  return {
    stopCount: stops.length,
    lineCount: lines.length,
    busCount: buses.length,
    dailyRiders,
    coverage,
    network,
    highDemand,
    lowCoverage,
  };
};

export const processTransit = (deltaHours: number) => {
  recomputeTransitRoutes();
  updateBuses(deltaHours);
};

export const resetTransit = () => {
  clearTransitRouteCache();
};

// Day/night activity multiplier for ridership (0.2 night … 1.0 peak)
export const transitActivityMultiplier = (timeOfDay: number): number => {
  if (timeOfDay >= 7 && timeOfDay < 9) return 1.0;
  if (timeOfDay >= 9 && timeOfDay < 16) return 0.6;
  if (timeOfDay >= 16 && timeOfDay < 19) return 1.0;
  if (timeOfDay >= 19 && timeOfDay < 22) return 0.5;
  return 0.2;
};

export const getTransitDemandLevel = (): "Low" | "Moderate" | "High" | "Very High" => {
  const stats = computeTransitStats();
  const score =
    stats.dailyRiders / 200 + stats.coverage / 100 - stats.busCount / 20;
  if (score >= 1.6) return "Very High";
  if (score >= 1.0) return "High";
  if (score >= 0.5) return "Moderate";
  return "Low";
};

export const getCurrentTransitActivity = (): number => {
  const { timeOfDay } = useSimulationStore.getState();
  return transitActivityMultiplier(timeOfDay);
};