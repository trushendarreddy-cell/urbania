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
  const roofColor = ghost ? (valid ? '#A7F3D0' : '#FECACA') : '#EF4444';
  const crossColor = ghost ? (valid ? '#86EFAC' : '#FCA5A5') : '#FFFFFF';

  const baseGeom = useMemo(() => new BoxGeometry(0.8, 0.3, 0.8), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.6, 0.15, 0.6), []);
  const crossGeomH = useMemo(() => new BoxGeometry(0.2, 0.04, 0.04), []);
  const crossGeomV = useMemo(() => new BoxGeometry(0.04, 0.2, 0.04), []);

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
      {/* Red Cross */}
      <mesh position={[0, 0.3, 0.4]} castShadow>
        <primitive object={crossGeomH} />
        <meshStandardMaterial color={crossColor} transparent={ghost} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.3, 0.4]} castShadow>
        <primitive object={crossGeomV} />
        <meshStandardMaterial color={crossColor} transparent={ghost} opacity={opacity} />
      </mesh>
    </group>
  );
}