import useTransitStore, {
  type TransitLine,
  type TransitStop,
  type BusState,
} from "../store/TransitStore";
import useBuildingStore, { type Building } from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import useDistrictStore from "../store/DistrictStore";
import useAlertStore from "../store/AlertStore";
import useRoadUsageStore from "../store/RoadUsageStore";
import { getRoadGraph, findPath, findNearestRoadCell } from "./PathfindingSystem";
import { useSimulationStore } from "../stores/useSimulationStore";
import {
  getAccessibility,
  type LineAccessibility,
} from "./TransitAccessibilitySystem";

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

export const validateLineDraft = (stopIds: string[]): string | null => {
  if (stopIds.length < 2) return "Select at least 2 stops.";
  const stops = useTransitStore.getState().stops;
  for (const id of stopIds) {
    if (!stops.some((s) => s.id === id)) return "Stop does not exist.";
  }
  if (new Set(stopIds).size !== stopIds.length)
    return "Stop already selected.";
  const buildings = useBuildingStore.getState().buildings;
  const graph = getRoadGraph(buildings);
  const roadKeys = stopIds.map((id) => {
    const stop = stops.find((s) => s.id === id);
    return stop ? stop.roadKey : null;
  });
  for (let i = 0; i < roadKeys.length - 1; i++) {
    const a = roadKeys[i];
    const b = roadKeys[i + 1];
    if (!a || !b || !findPath(a, b, graph))
      return "Stops are not road-connected.";
  };
  return null;
};

const BUS_SPEED = 3;
const DWELL_HOURS = 0.03;
const MAX_BUSES_PER_LINE = 3;

/**
 * Road-cell keys of the line's stops along the cached route. A bus dwells
 * whenever the end of its current segment coincides with one of these cells.
 */
const stopCellsForLine = (line: TransitLine): Set<string> => {
  const stops = useTransitStore.getState().stops;
  const roadKeys = new Set<string>();
  for (const id of line.stopIds) {
    const stop = stops.find((s) => s.id === id);
    if (stop) roadKeys.add(stop.roadKey);
  }
  return roadKeys;
};

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

    const stopCells = stopCellsForLine(line);

    for (const bus of initialized.slice(0, target)) {
      if (bus.status === "boarding") {
        const dwell = bus.dwell - deltaHours;
        if (dwell <= 0) {
          // Departure: reverse direction at a route endpoint
          let direction = bus.direction;
          if (bus.segmentIndex === 0) direction = 1;
          else if (bus.segmentIndex >= route.roadPath.length - 1)
            direction = -1;
          nextBuses.push({
            ...bus,
            status: "traveling",
            dwell: 0,
            direction,
          });
        } else {
          nextBuses.push({ ...bus, dwell });
        }
        continue;
      }

      const remaining = BUS_SPEED * deltaHours;
      let progress = bus.progress + remaining;
      let segmentIndex = bus.segmentIndex;
      let direction = bus.direction;
      let status: BusState["status"] = "traveling";

      while (progress >= 1) {
        progress -= 1;
        segmentIndex += direction;

        // Reached an endpoint: bounce rather than leave the route
        if (segmentIndex >= route.roadPath.length - 1) {
          segmentIndex = route.roadPath.length - 1;
          direction = -1;
          progress = 0;
          status = "boarding";
          break;
        }
        if (segmentIndex <= 0 && direction === -1) {
          segmentIndex = 0;
          direction = 1;
          progress = 0;
          status = "boarding";
          break;
        }

        // Arrived at a stop cell: dwell here
        const cell = route.roadPath[segmentIndex];
        if (stopCells.has(cell)) {
          progress = 0;
          status = "boarding";
          break;
        }
      }

      nextBuses.push({
        ...bus,
        segmentIndex,
        progress,
        direction,
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

export const busWorldRotation = (bus: BusState): number => {
  const route = routeCache.get(bus.lineId);
  if (!route || route.roadPath.length < 2) return 0;
  const a = route.roadPath[Math.min(bus.segmentIndex, route.roadPath.length - 1)];
  const b = route.roadPath[Math.min(bus.segmentIndex + 1, route.roadPath.length - 1)];
  const [ax, az] = a.split(",").map(Number);
  const [bx, bz] = b.split(",").map(Number);
  return Math.atan2(bx - ax, bz - az);
};

let registeredTransitKeys: string[] = [];

export const syncTransitRoadUsage = () => {
  const usageStore = useRoadUsageStore.getState();
  for (const key of registeredTransitKeys) {
    usageStore.decrement(key);
  }
  registeredTransitKeys = [];
  const { lines } = useTransitStore.getState();
  const keys = new Set<string>();
  for (const line of lines) {
    if (!line.enabled || line.disrupted) continue;
    const route = routeCache.get(line.id);
    if (!route) continue;
    for (const key of route.roadPath) keys.add(key);
  }
  for (const key of keys) {
    usageStore.increment(key);
    registeredTransitKeys.push(key);
  }
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

export const canPlaceStop = (
  position: [number, number, number],
  buildings: Building[]
): { valid: boolean; roadKey: string | null } => {
  const occupied = buildings.some(
    (b) =>
      Math.abs(b.position[0] - position[0]) < 0.5 &&
      Math.abs(b.position[2] - position[2]) < 0.5
  );
  if (occupied) return { valid: false, roadKey: null };
  const road = findNearestRoadCell(position, buildings);
  if (!road) return { valid: false, roadKey: null };
  return { valid: true, roadKey: `${road[0]},${road[1]}` };
};

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

export const computeLineStats = (line: TransitLine) => {
  const stops = useTransitStore.getState().stops;
  const lineStops = line.stopIds
    .map((id) => stops.find((s) => s.id === id))
    .filter((s): s is TransitStop => !!s);
  let riders = 0;
  for (const s of lineStops) {
    const { population, jobs } = populationNear(s.position, STOP_RADIUS);
    riders += estimateRiders(population, jobs, 1);
  }
  const busCount = useTransitStore
    .getState()
    .buses.filter((b) => b.lineId === line.id).length;
  const route = routeCache.get(line.id);
  return {
    stops: lineStops,
    riders,
    busCount,
    routeLength: route?.roadPath.length ?? 0,
  };
};

/**
 * Derived, deterministic ridership estimate for a line (2.54).
 *
 * The pool comes from actual city state: citizens whose home and workplace
 * are both walkable to the line's stops (accessibility snapshot). Commuters
 * contribute 2 trips/day (round trip), other nearby residents 0.4 leisure
 * trips/day, scaled by the line's service quality (buses + enabled) and the
 * time-of-day activity multiplier. No passenger entities are created.
 */
export const estimateLineRidership = (line: TransitLine) => {
  const access: LineAccessibility | undefined =
    getAccessibility().lineAccessibility[line.id];
  const commuters = access?.commuteEligible ?? 0;
  const homeAccessible = access?.homeAccessible ?? 0;

  const route = routeCache.get(line.id);
  const busCount = useTransitStore
    .getState()
    .buses.filter((b) => b.lineId === line.id).length;

  // Service quality: an enabled line with buses actually running carries more
  const serviceFactor =
    !line.enabled || line.disrupted
      ? 0
      : Math.min(1, 0.5 + busCount * 0.25);

  const commuteTrips = commuters * 2;
  const leisureTrips = Math.max(0, homeAccessible - commuters) * 0.4;
  const dailyTrips =
    (commuteTrips + leisureTrips) * serviceFactor;

  const { timeOfDay } = useSimulationStore.getState();
  const instantaneous = dailyTrips * transitActivityMultiplier(timeOfDay);

  // Utilization: estimated daily trips relative to fleet capacity.
  // Capacity model: each bus makes ~24 round trips/day over the route.
  const roundTripsPerBusPerDay = 24;
  const routeLength = route?.roadPath.length ?? 0;
  const capacity =
    routeLength > 0 ? busCount * roundTripsPerBusPerDay * 4 : 0; // ~4 riders per bus trip
  const utilization = capacity > 0 ? Math.min(1, dailyTrips / capacity) : 0;

  return {
    /** Instantaneous demand estimate at the current simulation time. */
    currentRiders: Math.round(instantaneous),
    /** Estimated full-day trips (commute + leisure, service-scaled). */
    estimatedDailyRidership: Math.round(dailyTrips),
    /** 0–1 against a simple fleet-capacity model. */
    utilization,
    /** Coarse usage band for UI display. */
    usageLevel: utilizationLevel(utilization),
    commuteEligible: commuters,
    homeAccessible,
    busCount,
  };
};

export const utilizationLevel = (
  utilization: number
): "Low" | "Moderate" | "High" => {
  if (utilization >= 0.6) return "High";
  if (utilization >= 0.25) return "Moderate";
  return "Low";
};

export const computeTransitStats = () => {
  const { stops, lines, buses } = useTransitStore.getState();
  const accessibility = getAccessibility();

  let dailyRiders = 0;
  for (const line of lines) {
    dailyRiders += estimateLineRidership(line).estimatedDailyRidership;
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

  const coverage = accessibility.accessibilityPercent;

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
    /** Share of citizens with effective transit access at home (0–100). */
    accessibilityPercent: Math.round(accessibility.accessibilityPercent),
    accessibleCitizens: accessibility.accessibleCitizens,
    totalCitizens: accessibility.totalCitizens,
  };
};

export const processTransit = (deltaHours: number) => {
  recomputeTransitRoutes();
  updateBuses(deltaHours);
  syncTransitRoadUsage();
};

/**
 * Deterministically reconstruct the vehicle fleet from line state
 * (used after load / route recompute); safe while the simulation is paused
 * because it spawns buses without advancing them.
 */
export const rebuildBuses = () => {
  recomputeTransitRoutes();
  updateBuses(0);
};

export const invalidateTransitRoute = (lineId: string) => {
  routeCache.delete(lineId);
};

export const resetTransit = () => {
  const usageStore = useRoadUsageStore.getState();
  for (const key of registeredTransitKeys) {
    usageStore.decrement(key);
  }
  registeredTransitKeys = [];
  clearTransitRouteCache();
};

export const sanitizeLinesForStops = (
  lines: TransitLine[],
  stops: TransitStop[]
): TransitLine[] => {
  const validStopIds = new Set(stops.map((s) => s.id));
  return lines
    .map((line) => ({
      ...line,
      stopIds: line.stopIds.filter((id) => validStopIds.has(id)),
    }))
    .map((line) =>
      line.stopIds.length < 2
        ? {
            ...line,
            enabled: false,
            disrupted: true,
            disruptedReason: "Line needs at least two stops",
          }
        : line
    );
};

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