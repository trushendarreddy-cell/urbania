import type { RoadConnections } from "../systems/RoadSystem";
import useRoadUsageStore, { getCongestionLevel, getCongestionColor } from "../store/RoadUsageStore";

interface RoadProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
  connections?: RoadConnections;
}

export default function Road({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
  connections = { north: false, south: false, east: false, west: false },
}: RoadProps) {
  const opacity = ghost ? 0.45 : 1;
  let baseAsphalt = "#1F2937";
  if (!ghost) {
    const key = `${Math.round(position[0])},${Math.round(position[2])}`;
    const usage = useRoadUsageStore.getState().getUsage(key);
    const level = getCongestionLevel(usage);
    const color = getCongestionColor(level);
    baseAsphalt = color;
  }
  const asphaltColor = ghost ? (valid ? "#4ADE80" : "#EF4444") : baseAsphalt;
  const markingColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#FBBF24";
  const curbColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#374151";

  const hasAnyConnection =
    connections.north ||
    connections.south ||
    connections.east ||
    connections.west;

  const isStraightH =
    !hasAnyConnection && (rotation % Math.PI === 0);
  const isStraightV =
    !hasAnyConnection && (rotation % Math.PI !== 0);

  const showNorth = connections.north || isStraightV;
  const showSouth = connections.south || isStraightV;
  const showEast = connections.east || isStraightH;
  const showWest = connections.west || isStraightH;

  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[1, 0.03, 1]} />
        <meshStandardMaterial
          color={asphaltColor}
          transparent={ghost}
          opacity={opacity}
          roughness={0.9}
        />
      </mesh>

      {/* Curbs */}
      <mesh position={[0, 0.02, -0.47]}>
        <boxGeometry args={[1, 0.02, 0.06]} />
        <meshStandardMaterial
          color={curbColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0.02, 0.47]}>
        <boxGeometry args={[1, 0.02, 0.06]} />
        <meshStandardMaterial
          color={curbColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[-0.47, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.02, 1]} />
        <meshStandardMaterial
          color={curbColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.47, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.02, 1]} />
        <meshStandardMaterial
          color={curbColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Center connector */}
      <mesh position={[0, 0.032, 0]}>
        <boxGeometry args={[0.08, 0.005, 0.08]} />
        <meshStandardMaterial
          color={markingColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Direction markings */}
      {showNorth && (
        <mesh position={[0, 0.032, -0.25]}>
          <boxGeometry args={[0.08, 0.005, 0.42]} />
          <meshStandardMaterial
            color={markingColor}
            transparent={ghost}
            opacity={opacity}
          />
        </mesh>
      )}

      {showSouth && (
        <mesh position={[0, 0.032, 0.25]}>
          <boxGeometry args={[0.08, 0.005, 0.42]} />
          <meshStandardMaterial
            color={markingColor}
            transparent={ghost}
            opacity={opacity}
          />
        </mesh>
      )}

      {showEast && (
        <mesh position={[0.25, 0.032, 0]}>
          <boxGeometry args={[0.42, 0.005, 0.08]} />
          <meshStandardMaterial
            color={markingColor}
            transparent={ghost}
            opacity={opacity}
          />
        </mesh>
      )}

      {showWest && (
        <mesh position={[-0.25, 0.032, 0]}>
          <boxGeometry args={[0.42, 0.005, 0.08]} />
          <meshStandardMaterial
            color={markingColor}
            transparent={ghost}
            opacity={opacity}
          />
        </mesh>
      )}
    </group>
  );
}
