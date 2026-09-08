import { useMemo } from 'react';
import { PlaneGeometry } from 'three';

export default function Ground() {
  const geom = useMemo(() => new PlaneGeometry(50, 50), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <primitive object={geom} />
      <meshStandardMaterial color="#7BC67E" roughness={0.7} metalness={0} />
    </mesh>
  );
}