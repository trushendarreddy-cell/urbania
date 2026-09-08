import { useMemo } from 'react';
import { BoxGeometry } from 'three';

interface PoliceStationProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function PoliceStation({ position, rotation = 0, ghost = false, valid = true }: PoliceStationProps) {
  const opacity = ghost ? 0.45 : 1;
  const mainColor = ghost ? (valid ? '#4ADE80' : '#EF4444') : '#1E3A8A';
  const roofColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#3B82F6';
  const badgeColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#FBBF24';

  const baseGeom = useMemo(() => new BoxGeometry(0.8, 0.3, 0.8), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.6, 0.15, 0.6), []);
  const badgeGeom = useMemo(() => new BoxGeometry(0.12, 0.12, 0.02), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <primitive object={baseGeom} />
        <meshStandardMaterial color={mainColor} transparent={ghost} opacity={opacity} roughness={0.7} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <primitive object={roofGeom} />
        <meshStandardMaterial color={roofColor} transparent={ghost} opacity={opacity} roughness={0.6} />
      </mesh>
      {/* Badge/Shield */}
      <mesh position={[0, 0.3, 0.4]} castShadow>
        <primitive object={badgeGeom} />
        <meshStandardMaterial color={badgeColor} transparent={ghost} opacity={opacity} />
      </mesh>
    </group>
  );
}