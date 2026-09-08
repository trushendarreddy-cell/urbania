import type { Building } from "../store/BuildingStore";

export function getRoadGraph(buildings: Building[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  const roadBuildings = buildings.filter(b => b.type === "road");
  const roadSet = new Set(roadBuildings.map(b => `${Math.round(b.position[0])},${Math.round(b.position[2])}`));
  for (const road of roadBuildings) {
    const x = Math.round(road.position[0]);
    const z = Math.round(road.position[2]);
    const key = `${x},${z}`;
    const neighbors: string[] = [];
    const offsets = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dz] of offsets) {
      const nx = x + dx;
      const nz = z + dz;
      const nkey = `${nx},${nz}`;
      if (roadSet.has(nkey)) {
        neighbors.push(nkey);
      }
    }
    graph.set(key, neighbors);
  }
  return graph;
}

export function findNearestRoadCell(
  pos: [number, number, number],
  buildings: Building[]
): [number, number] | null {
  const x = Math.round(pos[0]);
  const z = Math.round(pos[2]);
  const offsets = [[1,0],[-1,0],[0,1],[0,-1]];
  for (const [dx, dz] of offsets) {
    const nx = x + dx;
    const nz = z + dz;
    const road = buildings.find(b => b.type === "road" && Math.round(b.position[0]) === nx && Math.round(b.position[2]) === nz);
    if (road) {
      return [nx, nz];
    }
  }
  return null;
}

export function findPath(
  startKey: string,
  endKey: string,
  graph: Map<string, string[]>
): string[] | null {
  if (startKey === endKey) return [startKey];
  const queue: string[] = [startKey];
  const visited = new Set<string>([startKey]);
  const parent = new Map<string, string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        if (neighbor === endKey) {
          // Reconstruct path
          const path: string[] = [];
          let node: string | undefined = endKey;
          while (node) {
            path.unshift(node);
            node = parent.get(node);
          }
          return path;
        }
        queue.push(neighbor);
      }
    }
  }
  return null;
}