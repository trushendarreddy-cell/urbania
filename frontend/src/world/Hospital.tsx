import { useMemo } from 'react';
import { BoxGeometry } from 'three';

interface HospitalProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function Hospital({ position, rotation = 0, ghost = false, valid = true }: HospitalProps) {
  const opacity = ghost ? 0.45 : 1;
  const mainColor = ghost ? (valid ? '#4ADE80' : '#EF4444') : '#F3F4F6';
  const roofColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#DC2626';
  const crossColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#FFFFFF';
  const windowColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#93C5FD';
  const doorColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#6B7280';

  const baseGeom = useMemo(() => new BoxGeometry(0.9, 0.3, 0.9), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.7, 0.15, 0.7), []);
  const crossGeomH = useMemo(() => new BoxGeometry(0.25, 0.04, 0.04), []);
  const crossGeomV = useMemo(() => new BoxGeometry(0.04, 0.25, 0.04), []);
  const windowGeom = useMemo(() => new BoxGeometry(0.1, 0.1, 0.02), []);
  const doorGeom = useMemo(() => new BoxGeometry(0.15, 0.25, 0.02), []);

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
      {/* Red Cross on front */}
      <mesh position={[0, 0.35, 0.46]} castShadow>
        <primitive object={crossGeomH} />
        <meshStandardMaterial color={crossColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.35, 0.46]} castShadow>
        <primitive object={crossGeomV} />
        <meshStandardMaterial color={crossColor} transparent={ghost} opacity={opacity} />
      </mesh>
      {/* Windows */}
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
    </group>
  );
}