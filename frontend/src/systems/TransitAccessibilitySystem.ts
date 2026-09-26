import useTransitStore, { type TransitStop } from "../store/TransitStore";
import useBuildingStore from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import { getRoadGraph, findPath, findNearestRoadCell } from "./PathfindingSystem";
import { STOP_RADIUS } from "./TransitSystem";

// Road network and population changes also change accessibility.
// (TransitStore mutations invalidate from inside the store itself.)
useBuildingStore.subscribe(() => {
  cache = null;
});
usePopulationStore.subscribe(() => {
  cache = null;
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
 * invalidated only when the underlying state actually changes (transit store,
 * buildings, population). Consumers call `getAccessibility()` which returns
 * the cached snapshot, recomputing at most once per invalidation.
 */

export interface LineAccessibility {
  lineId: string;
  /** Citizens whose home is walkable to one of this line's stops. */
  homeAccessible: number;
  /** Employed citizens whose home AND workplace are walkable to this line's stops. */
  commuteEligible: number;
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
  /** Per-line ridership pool, for enabled non-disrupted lines only. */
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
  lineAccessibility: {},
};

let cache: AccessibilitySnapshot | null = null;

export const invalidateAccessibility = () => {
  cache = null;
};

const effectiveStops = (stops: TransitStop[]): Set<string> => {
  const { lines } = useTransitStore.getState();
  const effective = new Set<string>();
  for (const line of lines) {
    if (!line.enabled || line.disrupted) continue;
    for (const id of line.stopIds) {
      if (stops.some((s) => s.id === id)) effective.add(id);
    }
  }
  return effective;
};

const computeSnapshot = (): AccessibilitySnapshot => {
  const { stops, lines } = useTransitStore.getState();
  if (stops.length === 0 || lines.length === 0) return EMPTY;

  const effectiveIds = effectiveStops(stops);
  if (effectiveIds.size === 0) return EMPTY;

  const effectiveStopsList = stops.filter((s) => effectiveIds.has(s.id));
  const buildings = useBuildingStore.getState().buildings;
  const roadCells = new Set(
    buildings
      .filter((b) => b.type === "road")
      .map((b) => `${Math.round(b.position[0])},${Math.round(b.position[2])}`)
  );
  const graph = getRoadGraph(buildings);

  // Which road cells are within walking distance of an effective stop?
  const accessRoadCells = new Set<string>();
  for (const stop of effectiveStopsList) {
    if (roadCells.has(stop.roadKey)) accessRoadCells.add(stop.roadKey);
    for (const cell of roadCells) {
      const [x, z] = cell.split(",").map(Number);
      const [sx, sz] = stop.roadKey.split(",").map(Number);
      if (Math.hypot(x - sx, z - sz) <= STOP_RADIUS && findPath(stop.roadKey, cell, graph)) {
        accessRoadCells.add(cell);
      }
    }
  }
  if (accessRoadCells.size === 0) return EMPTY;

  // A building is accessible when its nearest road cell is within walking
  // distance of an effectively-served stop (same convention as citizens).
  const buildingAccess = new Map<number, boolean>();
  for (const b of buildings) {
    if (b.type === "road") continue;
    const road = findNearestRoadCell(b.position, buildings);
    buildingAccess.set(b.id, road ? accessRoadCells.has(`${road[0]},${road[1]}`) : false);
  }

  const { households, citizens } = usePopulationStore.getState();
  const accessibleBuildingIds = new Set<number>();
  for (const [id, ok] of buildingAccess) {
    if (ok) accessibleBuildingIds.add(id);
  }

  let accessibleHouseholds = 0;
  let accessibleCitizens = 0;
  let totalCitizens = 0;
  let employedWithAccess = 0;
  let commutingCitizensWithAccess = 0;

  const jobBuildingOf = new Map<string, number>();
  for (const c of citizens) {
    if (c.employmentStatus === "employed" && c.jobId) {
      jobBuildingOf.set(c.id, parseInt(c.jobId, 10));
    }
  }

  for (const h of households) {
    const homeOk = accessibleBuildingIds.has(h.buildingId);
    if (homeOk) accessibleHouseholds++;
    const householdCitizens = citizens.filter((c) => c.householdId === h.id);
    totalCitizens += householdCitizens.length;
    for (const c of householdCitizens) {
      if (homeOk) {
        accessibleCitizens++;
        if (c.employmentStatus === "employed") {
          employedWithAccess++;
          const jobBuilding = jobBuildingOf.get(c.id);
          if (jobBuilding !== undefined && accessibleBuildingIds.has(jobBuilding)) {
            commutingCitizensWithAccess++;
          }
        }
      }
    }
  }

  // Per-line ridership pools: which citizens can reach this line's stops on foot
  const lineAccessibility: Record<string, LineAccessibility> = {};
  for (const line of lines) {
    if (!line.enabled || line.disrupted) continue;
    const lineStops = effectiveStopsList.filter((s) => line.stopIds.includes(s.id));
    if (lineStops.length === 0) continue;

    const lineCells = new Set<string>();
    for (const stop of lineStops) {
      for (const cell of roadCells) {
        if (lineCells.has(cell)) continue;
        const [x, z] = cell.split(",").map(Number);
        const [sx, sz] = stop.roadKey.split(",").map(Number);
        if (
          Math.hypot(x - sx, z - sz) <= STOP_RADIUS &&
          findPath(stop.roadKey, cell, graph)
        ) {
          lineCells.add(cell);
        }
      }
    }

    const lineAccessibleBuildings = new Set<number>();
    for (const b of buildings) {
      if (b.type === "road") continue;
      const road = findNearestRoadCell(b.position, buildings);
      if (road && lineCells.has(`${road[0]},${road[1]}`)) {
        lineAccessibleBuildings.add(b.id);
      }
    }

    let homeAccessible = 0;
    let commuteEligible = 0;
    for (const c of citizens) {
      const household = households.find((h) => h.id === c.householdId);
      if (!household) continue;
      if (!lineAccessibleBuildings.has(household.buildingId)) continue;
      homeAccessible++;
      if (c.employmentStatus === "employed" && c.jobId) {
        const jobBuilding = parseInt(c.jobId, 10);
        if (lineAccessibleBuildings.has(jobBuilding)) commuteEligible++;
      }
    }

    lineAccessibility[line.id] = { lineId: line.id, homeAccessible, commuteEligible };
  }

  return {
    effectiveStopIds: effectiveIds,
    accessibleBuildingIds,
    accessibleHouseholds,
    accessibleCitizens,
    commutingCitizensWithAccess,
    employedWithAccess,
    totalHouseholds: households.length,
    totalCitizens,
    accessibilityPercent:
      totalCitizens > 0 ? (accessibleCitizens / totalCitizens) * 100 : 0,
    lineAccessibility,
  };
};

export const getAccessibility = (): AccessibilitySnapshot => {
  if (!cache) cache = computeSnapshot();
  return cache;
};
