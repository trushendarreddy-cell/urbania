import type { Building } from "../store/BuildingStore";

export interface RoadConnections {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export function getRoadNeighbors(
  position: [number, number, number],
  allBuildings: Building[] | Array<{ position: [number, number, number]; type?: string }>
): RoadConnections {
  const x = position[0];
  const z = position[2];

  const hasRoadAt = (tx: number, tz: number) => {
    return allBuildings.some(
      (b) =>
        b.type === "road" &&
        Math.abs(b.position[0] - tx) < 0.2 &&
        Math.abs(b.position[2] - tz) < 0.2
    );
  };

  return {
    north: hasRoadAt(x, z - 1),
    south: hasRoadAt(x, z + 1),
    east: hasRoadAt(x + 1, z),
    west: hasRoadAt(x - 1, z),
  };
}

export function generateRoadLine(
  startPos: [number, number, number],
  endPos: [number, number, number]
): Array<[number, number, number]> {
  const startX = startPos[0];
  const startZ = startPos[2];
  const endX = endPos[0];
  const endZ = endPos[2];

  const dx = endX - startX;
  const dz = endZ - startZ;

  const points: Array<[number, number, number]> = [];

  if (Math.abs(dx) >= Math.abs(dz)) {
    const step = dx >= 0 ? 1 : -1;
    const count = Math.round(Math.abs(dx));
    for (let i = 0; i <= count; i++) {
      points.push([startX + i * step, 0, startZ]);
    }
  } else {
    const step = dz >= 0 ? 1 : -1;
    const count = Math.round(Math.abs(dz));
    for (let i = 0; i <= count; i++) {
      points.push([startX, 0, startZ + i * step]);
    }
  }

  return points;
}
