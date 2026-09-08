import { useMemo } from 'react';
import { PlaneGeometry } from 'three';

export default function Ground() {
  const geom = useMemo(() => new PlaneGeometry(50, 50), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <primitive object={geom} />
      <meshStandardMaterial color="#8BC34A" roughness={0.6} metalness={0} />
    </mesh>
  );
}