import { useMemo } from "react";
import { BoxGeometry } from "three";

interface BusStopProps {
  position: [number, number, number];
  selected?: boolean;
  ghost?: boolean;
  valid?: boolean;
}

export default function BusStop({
  position,
  selected = false,
  ghost = false,
  valid = true,
}: BusStopProps) {
  const opacity = ghost ? 0.45 : 1;
  const poleColor = ghost ? (valid ? "#4ADE80" : "#EF4444") : "#9CA3AF";
  const roofColor = ghost ? (valid ? "#86EFAC" : "#F87171") : "#1E3A8A";
  const signColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#FBBF24";
  const benchColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#78350F";

  const poleGeom = useMemo(() => new BoxGeometry(0.05, 0.5, 0.05), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.5, 0.05, 0.3), []);
  const signGeom = useMemo(() => new BoxGeometry(0.22, 0.16, 0.02), []);
  const benchGeom = useMemo(() => new BoxGeometry(0.4, 0.04, 0.14), []);

  return (
    <group position={[position[0], 0, position[2]]}>
      {selected && !ghost && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 24]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
        </mesh>
      )}
      <mesh position={[0, 0.25, -0.15]} castShadow>
        <primitive object={poleGeom} />
        <meshStandardMaterial color={poleColor} transparent={ghost} opacity={opacity} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.52, -0.15]} castShadow>
        <primitive object={roofGeom} />
        <meshStandardMaterial color={roofColor} transparent={ghost} opacity={opacity} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, -0.15]} castShadow>
        <primitive object={signGeom} />
        <meshStandardMaterial color={signColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.12, 0.05]} castShadow>
        <primitive object={benchGeom} />
        <meshStandardMaterial color={benchColor} transparent={ghost} opacity={opacity} roughness={0.8} />
      </mesh>
    </group>
  );
}