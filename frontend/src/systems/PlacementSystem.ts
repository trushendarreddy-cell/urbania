import type { Building } from "../store/BuildingStore";
import type { BuildTool } from "../types/BuildTool";

export function canPlaceObject(
  type: BuildTool,
  position: [number, number, number],
  _rotation: number,
  existingObjects: Building[]
): boolean {
  if (type === "none" || type === "bulldozer") {
    return false;
  }

  const targetX = position[0];
  const targetZ = position[2];

  const isOccupied = existingObjects.some((building) => {
    const dx = Math.abs(building.position[0] - targetX);
    const dz = Math.abs(building.position[2] - targetZ);
    return dx < 0.5 && dz < 0.5;
  });

  return !isOccupied;
}
