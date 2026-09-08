import { useMemo } from 'react';
import { BoxGeometry } from 'three';

interface FireStationProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function FireStation({ position, rotation = 0, ghost = false, valid = true }: FireStationProps) {
  const opacity = ghost ? 0.45 : 1;
  const mainColor = ghost ? (valid ? '#4ADE80' : '#EF4444') : '#EF4444';
  const roofColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#F97316';
  const logoColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#FFFFFF';
  const doorColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#374151';
  const windowColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#93C5FD';

  const baseGeom = useMemo(() => new BoxGeometry(0.9, 0.3, 0.9), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.7, 0.15, 0.7), []);
  const logoGeom = useMemo(() => new BoxGeometry(0.12, 0.12, 0.02), []);
  const stripeGeom = useMemo(() => new BoxGeometry(0.02, 0.02, 0.8), []);
  const doorGeom = useMemo(() => new BoxGeometry(0.2, 0.3, 0.02), []);
  const windowGeom = useMemo(() => new BoxGeometry(0.1, 0.1, 0.02), []);

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
      {/* Logo */}
      <mesh position={[0, 0.35, 0.46]} castShadow>
        <primitive object={logoGeom} />
        <meshStandardMaterial color={logoColor} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Stripes */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <primitive object={stripeGeom} />
        <meshStandardMaterial color="#FBBF24" transparent={ghost} opacity={opacity * 0.7} />
      </mesh>
      {/* Large doors */}
      <mesh position={[-0.2, 0.1, 0.46]} castShadow>
        <primitive object={doorGeom} />
        <meshStandardMaterial color={doorColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0.2, 0.1, 0.46]} castShadow>
        <primitive object={doorGeom} />
        <meshStandardMaterial color={doorColor} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.3, 0.3, 0.46]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0.3, 0.3, 0.46]} castShadow>
        <primitive object={windowGeom} />
        <meshStandardMaterial color={windowColor} transparent={ghost} opacity={opacity} />
      </mesh>
    </group>
  );
}