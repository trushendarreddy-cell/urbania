import type { Building } from "../store/BuildingStore";

const CARDINAL_OFFSETS: Array<[number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

export function hasRoadAccess(
  position: [number, number, number],
  worldObjects: Building[]
): boolean {
  const x = position[0];
  const z = position[2];

  return CARDINAL_OFFSETS.some(([dx, dz]) => {
    const nx = x + dx;
    const nz = z + dz;
    return worldObjects.some((obj) => {
      if (obj.type !== "road") return false;
      return (
        Math.abs(obj.position[0] - nx) < 0.5 &&
        Math.abs(obj.position[2] - nz) < 0.5
      );
    });
  });
}
