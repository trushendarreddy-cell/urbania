import type { Citizen } from "../store/PopulationStore";
import type { Building } from "../store/BuildingStore";

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
      // Work position (use same offset but maybe a different one? We'll use same offset for consistency)
      const workPos: [number, number, number] = [
        jobBuilding.position[0] + offset[0],
        0.02,
        jobBuilding.position[2] + offset[2],
      ];

      // Determine movement based on time
      const WALK_DURATION = 1; // hour
      if (timeOfDay >= 8 && timeOfDay < 8 + WALK_DURATION) {
        // Walking to work
        const progress = (timeOfDay - 8) / WALK_DURATION;
        return lerp(homePos, workPos, progress);
      } else if (timeOfDay >= 17 && timeOfDay < 17 + WALK_DURATION) {
        // Walking home
        const progress = (timeOfDay - 17) / WALK_DURATION;
        return lerp(workPos, homePos, progress);
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

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
// Need to import usePopulationStore to access households
import usePopulationStore from "../store/PopulationStore";