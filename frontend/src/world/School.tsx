import { useMemo } from 'react';
import { BoxGeometry } from 'three';

interface SchoolProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function School({ position, rotation = 0, ghost = false, valid = true }: SchoolProps) {
  const opacity = ghost ? 0.45 : 1;
  const mainColor = ghost ? (valid ? '#4ADE80' : '#EF4444') : '#FBBF24';
  const roofColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#92400E';
  const windowColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#60A5FA';

  const baseGeom = useMemo(() => new BoxGeometry(0.8, 0.3, 0.8), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.6, 0.15, 0.6), []);
  const windowGeom = useMemo(() => new BoxGeometry(0.08, 0.08, 0.02), []);

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
      {/* Windows */}
      <mesh position={[-0.2, 0.2, 0.4]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0.2, 0.2, 0.4]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[-0.2, 0.2, -0.4]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0.2, 0.2, -0.4]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
    </group>
  );
}