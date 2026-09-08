import type { Citizen } from "../store/PopulationStore";
import type { Building } from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import { getRoadGraph, findNearestRoadCell, findPath } from "./PathfindingSystem";
import useRoadUsageStore, { ROAD_CAPACITY } from "../store/RoadUsageStore";

// Cache for computed paths to avoid BFS on every frame
// Each entry: { path, startKey, endKey, registered? }
const pathCache = new Map<string, { path: string[]; startKey: string; endKey: string; registered?: boolean }>();

export function getCitizenPosition(
  citizen: Citizen,
  buildings: Building[],
  timeOfDay: number,
  index: number // citizen index within household for offset
): [number, number, number] {
  // Find household
  const household = usePopulationStore.getState().households.find(h => h.id === citizen.householdId);
  if (!household) return [0, 0, 0];
  const homeBuilding = buildings.find(b => b.id === household.buildingId);
  if (!homeBuilding) return [0, 0, 0];

  // Offsets for multiple citizens
  const offsets: [number, number, number][] = [
    [-0.25, 0, -0.25],
    [0.25, 0, -0.25],
    [-0.25, 0, 0.25],
    [0.25, 0, 0.25],
  ];
  const offset = offsets[index % offsets.length];

  // Home position
  const homePos: [number, number, number] = [
    homeBuilding.position[0] + offset[0],
    0.02,
    homeBuilding.position[2] + offset[2],
  ];

  // Inactive, child, or unemployed? Stay home
  if (citizen.employmentStatus === 'inactive' || citizen.age < 18 || citizen.employmentStatus === 'unemployed') {
    return homePos;
  }

  // Employed adult: need work position
  if (citizen.employmentStatus === 'employed' && citizen.jobId) {
    const jobBuilding = buildings.find(b => b.id === parseInt(citizen.jobId!, 10));
    if (jobBuilding) {
      // Work position
      const workPos: [number, number, number] = [
        jobBuilding.position[0] + offset[0],
        0.02,
        jobBuilding.position[2] + offset[2],
      ];

      const WALK_DURATION = 1; // hour
      const homeRoad = findNearestRoadCell(homeBuilding.position, buildings);
      const workRoad = findNearestRoadCell(jobBuilding.position, buildings);

      // Determine if citizen is in a walking window and manage road usage registration
      const isWalkingToWork = timeOfDay >= 8 && timeOfDay < 8 + WALK_DURATION;
      const isWalkingHome = timeOfDay >= 17 && timeOfDay < 17 + WALK_DURATION;
      const isWalking = isWalkingToWork || isWalkingHome;

      // Helper to register/unregister path usage
      const registerPath = (pathKeys: string[], direction: 'toWork' | 'toHome') => {
        const cacheKey = `${citizen.id}-${direction}`;
        const entry = pathCache.get(cacheKey);
        if (entry && !entry.registered) {
          // Register usage on each road cell
          const usageStore = useRoadUsageStore.getState();
          for (const key of pathKeys) {
            usageStore.increment(key);
          }
          entry.registered = true;
          pathCache.set(cacheKey, entry);
        }
      };

      const unregisterPath = (direction: 'toWork' | 'toHome') => {
        const cacheKey = `${citizen.id}-${direction}`;
        const entry = pathCache.get(cacheKey);
        if (entry && entry.registered) {
          const usageStore = useRoadUsageStore.getState();
          for (const key of entry.path) {
            usageStore.decrement(key);
          }
          entry.registered = false;
          pathCache.set(cacheKey, entry);
        }
      };

      // If walking, ensure path is registered; if not walking, unregister
      if (isWalking) {
        // Determine direction
        const direction = isWalkingToWork ? 'toWork' : 'toHome';
        const cacheKey = `${citizen.id}-${direction}`;
        const entry = pathCache.get(cacheKey);
        if (entry && entry.path) {
          registerPath(entry.path, direction);
        }
      } else {
        // Unregister any active paths (both directions) when not walking
        unregisterPath('toWork');
        unregisterPath('toHome');
      }

      if (isWalkingToWork) {
        if (homeRoad && workRoad) {
          const cacheKey = `${citizen.id}-toWork`;
          let pathData = pathCache.get(cacheKey);
          const graph = getRoadGraph(buildings);
          const startKey = `${homeRoad[0]},${homeRoad[1]}`;
          const endKey = `${workRoad[0]},${workRoad[1]}`;
          if (!pathData || pathData.startKey !== startKey || pathData.endKey !== endKey) {
            // Invalidate old path if exists
            if (pathData && pathData.registered) {
              const usageStore = useRoadUsageStore.getState();
              for (const key of pathData.path) {
                usageStore.decrement(key);
              }
            }
            const path = findPath(startKey, endKey, graph);
            if (path) {
              pathData = { path, startKey, endKey, registered: false };
              pathCache.set(cacheKey, pathData);
              // Register immediately if we are in the walking window
              registerPath(path, 'toWork');
            } else {
              pathCache.delete(cacheKey);
              // No route, stay home
              return homePos;
            }
          } else {
            // Ensure registration is active
            if (!pathData.registered) {
              registerPath(pathData.path, 'toWork');
            }
          }
          const progress = (timeOfDay - 8) / WALK_DURATION;
          // Calculate congestion factor: average congestion along path
          let totalCongestion = 0;
          const usageStore = useRoadUsageStore.getState();
          for (const key of pathData.path) {
            const usage = usageStore.getUsage(key);
            const ratio = usage / ROAD_CAPACITY;
            totalCongestion += Math.min(ratio, 1.0); // cap at 1 for speed reduction
          }
          const avgCongestion = pathData.path.length > 0 ? totalCongestion / pathData.path.length : 0;
          const speedFactor = 1 - avgCongestion * 0.5; // congestion reduces speed up to 50%
          return interpolateAlongPath(pathData.path, homePos, workPos, progress, speedFactor);
        } else {
          // No road access, stay home
          return homePos;
        }
      } else if (isWalkingHome) {
        if (homeRoad && workRoad) {
          const cacheKey = `${citizen.id}-toHome`;
          let pathData = pathCache.get(cacheKey);
          const graph = getRoadGraph(buildings);
          const startKey = `${workRoad[0]},${workRoad[1]}`;
          const endKey = `${homeRoad[0]},${homeRoad[1]}`;
          if (!pathData || pathData.startKey !== startKey || pathData.endKey !== endKey) {
            if (pathData && pathData.registered) {
              const usageStore = useRoadUsageStore.getState();
              for (const key of pathData.path) {
                usageStore.decrement(key);
              }
            }
            const path = findPath(startKey, endKey, graph);
            if (path) {
              pathData = { path, startKey, endKey, registered: false };
              pathCache.set(cacheKey, pathData);
              registerPath(path, 'toHome');
            } else {
              pathCache.delete(cacheKey);
              // No route, stay at work
              return workPos;
            }
          } else {
            if (!pathData.registered) {
              registerPath(pathData.path, 'toHome');
            }
          }
          const progress = (timeOfDay - 17) / WALK_DURATION;
          let totalCongestion = 0;
          const usageStore = useRoadUsageStore.getState();
          for (const key of pathData.path) {
            const usage = usageStore.getUsage(key);
            const ratio = usage / ROAD_CAPACITY;
            totalCongestion += Math.min(ratio, 1.0);
          }
          const avgCongestion = pathData.path.length > 0 ? totalCongestion / pathData.path.length : 0;
          const speedFactor = 1 - avgCongestion * 0.5;
          return interpolateAlongPath(pathData.path, workPos, homePos, progress, speedFactor);
        } else {
          return workPos;
        }
      } else if (timeOfDay >= 8 + WALK_DURATION && timeOfDay < 17) {
        // At work - ensure no active path (in case we just arrived)
        unregisterPath('toWork');
        unregisterPath('toHome');
        return workPos;
      } else {
        // At home (including leisure and night)
        unregisterPath('toWork');
        unregisterPath('toHome');
        return homePos;
      }
    }
  }

  return homePos;
}

function interpolateAlongPath(
  pathKeys: string[],
  startPos: [number, number, number],
  endPos: [number, number, number],
  progress: number,
  congestionFactor: number = 1.0 // optional speed modifier
): [number, number, number] {
  if (progress <= 0) return startPos;
  if (progress >= 1) return endPos;

  // Apply congestion factor to progress (if >1, slower; if <1, faster, but we don't want negative)
  // Actually, we want to slow down movement when congestion is high.
  // So we can adjust the effective progress: effectiveProgress = progress * congestionFactor (where factor <1 slows down)
  // But we need to ensure we don't exceed 1.
  let effectiveProgress = progress;
  if (congestionFactor < 1) {
    // Slower: we spread the same real progress over a longer distance, so we effectively move less per time.
    // So we map progress to a smaller range: effectiveProgress = progress * factor
    effectiveProgress = progress * congestionFactor;
  }
  // Clamp
  if (effectiveProgress > 1) effectiveProgress = 1;
  if (effectiveProgress < 0) effectiveProgress = 0;

  const totalSegments = pathKeys.length - 1;
  const totalProgress = effectiveProgress * totalSegments;
  const segmentIndex = Math.floor(totalProgress);
  const segmentProgress = totalProgress - segmentIndex;

  if (segmentIndex >= totalSegments) {
    return endPos;
  }

  const keyA = pathKeys[segmentIndex];
  const keyB = pathKeys[segmentIndex + 1];
  const [ax, az] = keyA.split(',').map(Number);
  const [bx, bz] = keyB.split(',').map(Number);

  const posA: [number, number, number] = [ax, 0.02, az];
  const posB: [number, number, number] = [bx, 0.02, bz];

  return lerp(posA, posB, segmentProgress);
}

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}