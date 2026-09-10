import { useMemo } from "react";
import { BoxGeometry } from "three";

interface TransitBusProps {
  position: [number, number, number];
  rotation: number;
  color: string;
}

export default function TransitBus({ position, rotation, color }: TransitBusProps) {
  const bodyGeom = useMemo(() => new BoxGeometry(0.3, 0.16, 0.6), []);
  const windowGeom = useMemo(() => new BoxGeometry(0.32, 0.06, 0.4), []);

  return (
    <group position={[position[0], position[1] + 0.08, position[2]]} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow>
        <primitive object={bodyGeom} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.04, 0.05]}>
        <primitive object={windowGeom} />
        <meshStandardMaterial color="#93C5FD" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}