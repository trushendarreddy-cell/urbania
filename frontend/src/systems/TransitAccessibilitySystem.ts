import useTransitStore from "../store/TransitStore";
import useBuildingStore from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import { getCitizenActivity } from "./CitizenActivitySystem";
import { getRoadGraph } from "./PathfindingSystem";

export const STOP_RADIUS = 6;

let cache: AccessibilitySnapshot | null = null;

// Road, population, and transit changes invalidate this derived snapshot.
useBuildingStore.subscribe((state, previous) => {
  if (state.buildings !== previous.buildings) cache = null;
});
usePopulationStore.subscribe((state, previous) => {
  if (
    state.households !== previous.households ||
    state.citizens !== previous.citizens
  ) {
    cache = null;
  }
});
useTransitStore.subscribe((state, previous) => {
  if (state.stops !== previous.stops || state.lines !== previous.lines) cache = null;
});
/**
 * Transit accessibility (2.54).
 *
 * A stop only provides *effective* access when it belongs to at least one
 * enabled, non-disrupted line whose route is intact. Locations count as
 * transit-accessible when a stop with effective access is within walking
 * distance (STOP_RADIUS) of the location's road cell.
 *
 * Everything here is derived and cached; nothing is persisted. The cache is
 * invalidated when transit, road/building, or population state changes.
 * Consumers call `getAccessibility()` which recomputes at most once per change.
 */

export interface LineAccessibility {
  lineId: string;
  /** Residents whose home is walkable to this line. */
  homeAccessible: number;
  /** Employed residents whose home and workplace are both accessible to this line. */
  commuteEligible: number;
  /** Non-commuting adult residents with a scheduled leisure period. */
  leisureEligible: number;
  /** Residents with an accessible home, used for district aggregation. */
  homeAccessibleCitizenIds: Set<string>;
  /** Commuters with accessible home and workplace, used for aggregation. */
  commuteEligibleCitizenIds: Set<string>;
  /** Deterministic line assignment prevents overlapping lines double-counting. */
  estimatedCommuteCitizenIds: Set<string>;
  estimatedLeisureCitizenIds: Set<string>;
}

export interface AccessibilitySnapshot {
  /** Stop IDs that provide effective access (enabled line + intact route). */
  effectiveStopIds: Set<string>;
  /** Buildings with effective transit access, keyed by building id. */
  accessibleBuildingIds: Set<number>;
  /** Households living in an accessible building. */
  accessibleHouseholds: number;
  /** Citizens living in an accessible building. */
  accessibleCitizens: number;
  /** Citizens with a home AND a workplace both transit-accessible. */
  commutingCitizensWithAccess: number;
  /** Employed citizens with transit access at home. */
  employedWithAccess: number;
  /** Total households / citizens examined (0 when city is empty). */
  totalHouseholds: number;
  totalCitizens: number;
  /** 0–100: share of citizens whose home has effective transit access. */
  accessibilityPercent: number;
  /** Enabled, intact, road-connected lines that currently provide access. */
  activeLineIds: Set<string>;
  /** Per-line accessibility and commute/leisure demand pools for valid lines. */
  lineAccessibility: Record<string, LineAccessibility>;
}

const EMPTY: AccessibilitySnapshot = {
  effectiveStopIds: new Set(),
  accessibleBuildingIds: new Set(),
  accessibleHouseholds: 0,
  accessibleCitizens: 0,
  commutingCitizensWithAccess: 0,
  employedWithAccess: 0,
  totalHouseholds: 0,
  totalCitizens: 0,
  accessibilityPercent: 0,
  activeLineIds: new Set(),
  lineAccessibility: {},
};

export const invalidateAccessibility = () => {
  cache = null;
};

const roadCellsWithinWalkingRadius = (
  start: string,
  graph: Map<string, string[]>
): Set<string> => {
  if (!graph.has(start)) return new Set();
  const reachable = new Set([start]);
  const distance = new Map([[start, 0]]);
  const queue = [start];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    const currentDistance = distance.get(current) ?? STOP_RADIUS;
    if (currentDistance >= STOP_RADIUS) continue;
    for (const neighbor of graph.get(current) ?? []) {
      if (distance.has(neighbor)) continue;
      distance.set(neighbor, currentDistance + 1);
      reachable.add(neighbor);
      queue.push(neighbor);
    }
  }
  return reachable;
};

const computeSnapshot = (): AccessibilitySnapshot => {
  const { stops, lines } = useTransitStore.getState();
  const buildings = useBuildingStore.getState().buildings;
  const { households, citizens } = usePopulationStore.getState();
  const emptySnapshot = (): AccessibilitySnapshot => ({
    ...EMPTY,
    effectiveStopIds: new Set(),
    accessibleBuildingIds: new Set(),
    activeLineIds: new Set(),
    lineAccessibility: {},
    totalHouseholds: households.length,
    totalCitizens: citizens.length,
  });

  if (stops.length === 0 || lines.length === 0) {
    return emptySnapshot();
  }

  const graph = getRoadGraph(buildings);
  if (graph.size === 0) return emptySnapshot();

  // One component pass verifies actual route connectivity without repeatedly
  // searching the complete road graph for every stop pair.
  const roadComponent = new Map<string, number>();
  let nextComponent = 0;
  for (const start of graph.keys()) {
    if (roadComponent.has(start)) continue;
    const queue = [start];
    roadComponent.set(start, nextComponent);
    for (let index = 0; index < queue.length; index++) {
      for (const neighbor of graph.get(queue[index]) ?? []) {
        if (roadComponent.has(neighbor)) continue;
        roadComponent.set(neighbor, nextComponent);
        queue.push(neighbor);
      }
    }
    nextComponent++;
  }

  const stopsById = new Map(stops.map((stop) => [stop.id, stop]));
  const effectiveStopIds = new Set<string>();
  const activeLineIds = new Set<string>();
  for (const line of lines) {
    if (!line.enabled || line.disrupted || line.stopIds.length < 2) continue;
    const lineStops = line.stopIds.map((id) => stopsById.get(id));
    if (lineStops.some((stop) => !stop)) continue;
    const component = roadComponent.get(lineStops[0]?.roadKey ?? "");
    if (component === undefined) continue;
    if (lineStops.some((stop) => roadComponent.get(stop?.roadKey ?? "") !== component)) continue;
    if (new Set(lineStops.map((stop) => stop?.roadKey)).size < 2) continue;
    activeLineIds.add(line.id);
    for (const stop of lineStops) {
      if (stop) effectiveStopIds.add(stop.id);
    }
  }
  if (activeLineIds.size === 0) return emptySnapshot();

  const roadCellAccessByLine = new Map<string, Set<string>>();
  const walkingCellsByRoadKey = new Map<string, Set<string>>();
  const walkingCellsForStop = (roadKey: string): Set<string> => {
    const cached = walkingCellsByRoadKey.get(roadKey);
    if (cached) return cached;
    const reachable = roadCellsWithinWalkingRadius(roadKey, graph);
    walkingCellsByRoadKey.set(roadKey, reachable);
    return reachable;
  };
  for (const line of lines) {
    if (!activeLineIds.has(line.id)) continue;
    const lineCells = new Set<string>();
    for (const stopId of line.stopIds) {
      const stop = stopsById.get(stopId);
      if (!stop) continue;
      for (const cell of walkingCellsForStop(stop.roadKey)) lineCells.add(cell);
    }
    roadCellAccessByLine.set(line.id, lineCells);
  }

  const roadCellKeys = new Set(graph.keys());
  const buildingRoadCell = new Map<number, string>();
  const roadOffsets: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const building of buildings) {
    if (building.type === "road") continue;
    const x = Math.round(building.position[0]);
    const z = Math.round(building.position[2]);
    for (const [dx, dz] of roadOffsets) {
      const key = `${x + dx},${z + dz}`;
      if (roadCellKeys.has(key)) {
        buildingRoadCell.set(building.id, key);
        break;
      }
    }
  }

  const accessibleBuildingIds = new Set<number>();
  const accessibleBuildingIdsByLine = new Map<string, Set<number>>();
  for (const [lineId, lineCells] of roadCellAccessByLine) {
    const accessibleIds = new Set<number>();
    for (const [buildingId, roadCell] of buildingRoadCell) {
      if (lineCells.has(roadCell)) accessibleIds.add(buildingId);
    }
    accessibleBuildingIdsByLine.set(lineId, accessibleIds);
    for (const buildingId of accessibleIds) accessibleBuildingIds.add(buildingId);
  }

  const householdById = new Map(households.map((household) => [household.id, household]));
  const accessibleHouseholdIds = new Set<string>();
  for (const household of households) {
    if (accessibleBuildingIds.has(household.buildingId)) {
      accessibleHouseholdIds.add(household.id);
    }
  }

  let accessibleCitizens = 0;
  let employedWithAccess = 0;
  let commutingCitizensWithAccess = 0;
  for (const citizen of citizens) {
    const household = householdById.get(citizen.householdId);
    if (!household || !accessibleBuildingIds.has(household.buildingId)) continue;
    accessibleCitizens++;
    if (citizen.employmentStatus !== "employed" || !citizen.jobId) continue;
    employedWithAccess++;
    const jobBuildingId = Number.parseInt(citizen.jobId, 10);
    if (Number.isInteger(jobBuildingId) && accessibleBuildingIds.has(jobBuildingId)) {
      commutingCitizensWithAccess++;
    }
  }

  const lineAccessibility: Record<string, LineAccessibility> = {};
  const leisureEligibleIdsByLine = new Map<string, Set<string>>();
  for (const line of lines) {
    const accessibleBuildings = accessibleBuildingIdsByLine.get(line.id);
    if (!accessibleBuildings) continue;
    const homeAccessibleCitizenIds = new Set<string>();
    const commuteEligibleCitizenIds = new Set<string>();
    for (const citizen of citizens) {
      const household = householdById.get(citizen.householdId);
      if (!household || !accessibleBuildings.has(household.buildingId)) continue;
      homeAccessibleCitizenIds.add(citizen.id);
      if (citizen.employmentStatus !== "employed" || !citizen.jobId) continue;
      const jobBuildingId = Number.parseInt(citizen.jobId, 10);
      if (Number.isInteger(jobBuildingId) && accessibleBuildings.has(jobBuildingId)) {
        commuteEligibleCitizenIds.add(citizen.id);
      }
    }
    const leisureEligibleCitizenIds = new Set(
      citizens
        .filter((citizen) =>
          citizen.age >= 18 &&
          citizen.employmentStatus !== "inactive" &&
          !commuteEligibleCitizenIds.has(citizen.id) &&
          [9, 18].some((hour) =>
            getCitizenActivity(citizen.employmentStatus, citizen.age, hour) === "leisure"
          )
        )
        .filter((citizen) => homeAccessibleCitizenIds.has(citizen.id))
        .map((citizen) => citizen.id)
    );
    leisureEligibleIdsByLine.set(line.id, leisureEligibleCitizenIds);
    lineAccessibility[line.id] = {
      lineId: line.id,
      homeAccessible: homeAccessibleCitizenIds.size,
      commuteEligible: commuteEligibleCitizenIds.size,
      leisureEligible: leisureEligibleCitizenIds.size,
      homeAccessibleCitizenIds,
      commuteEligibleCitizenIds,
      estimatedCommuteCitizenIds: new Set<string>(),
      estimatedLeisureCitizenIds: new Set<string>(),
    };
  }

  // Assign each eligible citizen to at most one line, in stable line order.
  const assignedCitizenIds = new Set<string>();
  for (const line of lines) {
    const access = lineAccessibility[line.id];
    if (!access) continue;
    for (const citizenId of access.commuteEligibleCitizenIds) {
      if (assignedCitizenIds.has(citizenId)) continue;
      access.estimatedCommuteCitizenIds.add(citizenId);
      assignedCitizenIds.add(citizenId);
    }
  }
  for (const line of lines) {
    const access = lineAccessibility[line.id];
    if (!access) continue;
    for (const citizenId of leisureEligibleIdsByLine.get(line.id) ?? []) {
      if (assignedCitizenIds.has(citizenId)) continue;
      access.estimatedLeisureCitizenIds.add(citizenId);
      assignedCitizenIds.add(citizenId);
    }
  }

  return {
    effectiveStopIds,
    accessibleBuildingIds,
    accessibleHouseholds: accessibleHouseholdIds.size,
    accessibleCitizens,
    commutingCitizensWithAccess,
    employedWithAccess,
    totalHouseholds: households.length,
    totalCitizens: citizens.length,
    accessibilityPercent:
      citizens.length > 0 ? (accessibleCitizens / citizens.length) * 100 : 0,
    activeLineIds,
    lineAccessibility,
  };
};

export const getAccessibility = (): AccessibilitySnapshot => {
  if (!cache) cache = computeSnapshot();
  return cache;
};
