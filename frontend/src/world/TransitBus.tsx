import { useMemo } from "react";
import { BoxGeometry } from "three";
import { Html } from "@react-three/drei";

interface TransitBusProps {
  position: [number, number, number];
  rotation: number;
  color: string;
  label?: string;
}

export default function TransitBus({ position, rotation, color, label }: TransitBusProps) {
  const bodyGeom = useMemo(() => new BoxGeometry(0.3, 0.16, 0.6), []);
  const windowGeom = useMemo(() => new BoxGeometry(0.32, 0.06, 0.4), []);
  const roofGeom = useMemo(() => new BoxGeometry(0.2, 0.03, 0.3), []);

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
      <mesh position={[0, 0.095, 0]}>
        <primitive object={roofGeom} />
        <meshStandardMaterial color="#F3F4F6" roughness={0.8} metalness={0} />
      </mesh>
      {label && (
        <Html center distanceFactor={10} position={[0, 0.35, 0]} zIndexRange={[5, 0]}>
          <div
            style={{
              background: color,
              color: "#111827",
              fontSize: "8px",
              fontWeight: 700,
              fontFamily: "Inter, system-ui, sans-serif",
              padding: "1px 4px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
              lineHeight: 1.2,
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
