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
  const doorColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#6B7280';
  const flagColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#EF4444';

  const baseGeom = useMemo(() => new BoxGeometry(0.9, 0.3, 0.9), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.7, 0.15, 0.7), []);
  const windowGeom = useMemo(() => new BoxGeometry(0.1, 0.1, 0.02), []);
  const doorGeom = useMemo(() => new BoxGeometry(0.15, 0.25, 0.02), []);
  const flagPole = useMemo(() => new BoxGeometry(0.02, 0.4, 0.02), []);
  const flagGeom = useMemo(() => new BoxGeometry(0.12, 0.08, 0.01), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <primitive object={baseGeom} />
        <meshStandardMaterial color={mainColor} transparent={ghost} opacity={opacity} roughness={0.7} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <primitive object={roofGeom} />
        <meshStandardMaterial color={roofColor} transparent={ghost} opacity={opacity} roughness={0.6} />
      </mesh>
      {/* Windows front */}
      <mesh position={[-0.25, 0.3, 0.46]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0.25, 0.3, 0.46]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.1, 0.46]} castShadow>
        <primitive object={doorGeom} />
        <meshStandardMaterial color={doorColor} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Flag pole */}
      <mesh position={[0.35, 0.6, -0.2]} castShadow>
        <primitive object={flagPole} />
        <meshStandardMaterial color="#9CA3AF" transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0.35, 0.72, -0.2]} castShadow>
        <primitive object={flagGeom} />
        <meshStandardMaterial color={flagColor} transparent={ghost} opacity={opacity} />
      </mesh>
    </group>
  );
}