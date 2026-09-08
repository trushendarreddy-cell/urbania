import { useMemo } from 'react';
import { BoxGeometry, CylinderGeometry } from 'three';

interface WaterPlantProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function WaterPlant({ position, rotation = 0, ghost = false, valid = true }: WaterPlantProps) {
  const opacity = ghost ? 0.45 : 1;
  const mainColor = ghost ? (valid ? '#4ADE80' : '#EF4444') : '#3B82F6';
  const roofColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#1E3A8A';

  const baseGeom = useMemo(() => new BoxGeometry(0.8, 0.3, 0.8), []);
  const tankGeom = useMemo(() => new CylinderGeometry(0.3, 0.3, 0.5, 8), []);
  const pipeGeom = useMemo(() => new BoxGeometry(0.6, 0.08, 0.08), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <primitive object={baseGeom} />
        <meshStandardMaterial color={mainColor} transparent={ghost} opacity={opacity} roughness={0.7} />
      </mesh>
      {/* Tank */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <primitive object={tankGeom} />
        <meshStandardMaterial color="#60A5FA" transparent={ghost} opacity={opacity} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Pipe */}
      <mesh position={[0.3, 0.35, 0]} castShadow>
        <primitive object={pipeGeom} />
        <meshStandardMaterial color="#9CA3AF" transparent={ghost} opacity={opacity} roughness={0.8} />
      </mesh>
      <mesh position={[-0.3, 0.35, 0]} castShadow>
        <primitive object={pipeGeom} />
        <meshStandardMaterial color="#9CA3AF" transparent={ghost} opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color={roofColor} transparent={ghost} opacity={opacity} roughness={0.6} />
      </mesh>
    </group>
  );
}