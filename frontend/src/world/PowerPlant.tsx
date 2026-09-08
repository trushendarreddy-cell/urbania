import { useMemo } from 'react';
import { BoxGeometry, CylinderGeometry } from 'three';

interface PowerPlantProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function PowerPlant({ position, rotation = 0, ghost = false, valid = true }: PowerPlantProps) {
  const opacity = ghost ? 0.45 : 1;
  const mainColor = ghost ? (valid ? '#4ADE80' : '#EF4444') : '#D97706';
  const roofColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#92400E';
  const chimneyColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#6B7280';

  const baseGeom = useMemo(() => new BoxGeometry(0.9, 0.3, 0.9), []);
  const towerGeom = useMemo(() => new CylinderGeometry(0.15, 0.25, 0.6, 8), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.7, 0.15, 0.7), []);
  const chimneyGeom = useMemo(() => new BoxGeometry(0.1, 0.4, 0.1), []);
  const pipeGeom = useMemo(() => new CylinderGeometry(0.04, 0.04, 0.2, 6), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <primitive object={baseGeom} />
        <meshStandardMaterial color={mainColor} transparent={ghost} opacity={opacity} roughness={0.7} />
      </mesh>
      {/* Tower */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <primitive object={towerGeom} />
        <meshStandardMaterial color="#B45309" transparent={ghost} opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <primitive object={roofGeom} />
        <meshStandardMaterial color={roofColor} transparent={ghost} opacity={opacity} roughness={0.6} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.2, 0.95, 0]} castShadow>
        <primitive object={chimneyGeom} />
        <meshStandardMaterial color={chimneyColor} transparent={ghost} opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Pipe */}
      <mesh position={[-0.2, 0.35, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <primitive object={pipeGeom} />
        <meshStandardMaterial color="#9CA3AF" transparent={ghost} opacity={opacity} roughness={0.8} />
      </mesh>
    </group>
  );
}