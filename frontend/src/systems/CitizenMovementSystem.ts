import type { Citizen } from "../store/PopulationStore";
import type { Building } from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import { getRoadGraph, findNearestRoadCell, findPath } from "./PathfindingSystem";

// Cache for computed paths to avoid BFS on every frame
const pathCache = new Map<string, { path: string[]; startKey: string; endKey: string }>();

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

      if (timeOfDay >= 8 && timeOfDay < 8 + WALK_DURATION) {
        // Walking to work
        if (homeRoad && workRoad) {
          const cacheKey = `${citizen.id}-toWork`;
          let pathData = pathCache.get(cacheKey);
          const graph = getRoadGraph(buildings);
          const startKey = `${homeRoad[0]},${homeRoad[1]}`;
          const endKey = `${workRoad[0]},${workRoad[1]}`;
          if (!pathData || pathData.startKey !== startKey || pathData.endKey !== endKey) {
            const path = findPath(startKey, endKey, graph);
            if (path) {
              pathData = { path, startKey, endKey };
              pathCache.set(cacheKey, pathData);
            } else {
              pathCache.delete(cacheKey);
              // No route, stay home
              return homePos;
            }
          }
          const progress = (timeOfDay - 8) / WALK_DURATION;
          return interpolateAlongPath(pathData.path, homePos, workPos, progress);
        } else {
          // No road access, stay home
          return homePos;
        }
      } else if (timeOfDay >= 17 && timeOfDay < 17 + WALK_DURATION) {
        // Walking home
        if (homeRoad && workRoad) {
          const cacheKey = `${citizen.id}-toHome`;
          let pathData = pathCache.get(cacheKey);
          const graph = getRoadGraph(buildings);
          const startKey = `${workRoad[0]},${workRoad[1]}`;
          const endKey = `${homeRoad[0]},${homeRoad[1]}`;
          if (!pathData || pathData.startKey !== startKey || pathData.endKey !== endKey) {
            const path = findPath(startKey, endKey, graph);
            if (path) {
              pathData = { path, startKey, endKey };
              pathCache.set(cacheKey, pathData);
            } else {
              pathCache.delete(cacheKey);
              // No route, stay at work
              return workPos;
            }
          }
          const progress = (timeOfDay - 17) / WALK_DURATION;
          return interpolateAlongPath(pathData.path, workPos, homePos, progress);
        } else {
          return workPos;
        }
      } else if (timeOfDay >= 8 + WALK_DURATION && timeOfDay < 17) {
        // At work
        return workPos;
      } else {
        // At home (including leisure and night)
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
  progress: number
): [number, number, number] {
  if (progress <= 0) return startPos;
  if (progress >= 1) return endPos;

  const totalSegments = pathKeys.length - 1;
  const totalProgress = progress * totalSegments;
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