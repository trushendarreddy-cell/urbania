import { Html } from "@react-three/drei";
import type { District } from "../store/DistrictStore";

interface DistrictOverlayProps {
  district: District;
  selected: boolean;
  showLabel?: boolean;
}

const parseCell = (key: string): [number, number] => {
  const [x, z] = key.split(",").map(Number);
  return [x, z];
};

export default function DistrictOverlay({
  district,
  selected,
  showLabel = false,
}: DistrictOverlayProps) {
  if (district.cells.length === 0) return null;

  let sumX = 0;
  let sumZ = 0;
  for (const c of district.cells) {
    const [x, z] = parseCell(c);
    sumX += x;
    sumZ += z;
  }
  const centroidX = sumX / district.cells.length;
  const centroidZ = sumZ / district.cells.length;

  const baseOpacity = selected ? 0.42 : 0.16;
  const y = selected ? 0.026 : 0.022;

  return (
    <group>
      {district.cells.map((cell) => {
        const [x, z] = parseCell(cell);
        return (
          <group key={cell} position={[x, y, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.98, 0.98]} />
              <meshBasicMaterial
                color={district.color}
                transparent
                opacity={baseOpacity}
                depthWrite={false}
              />
            </mesh>
            {selected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
                <planeGeometry args={[0.98, 0.98]} />
                <meshBasicMaterial
                  color={district.color}
                  transparent
                  opacity={0.85}
                  wireframe
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
        );
      })}
      {showLabel && (
        <Html
          position={[centroidX, 1.4, centroidZ]}
          center
          pointerEvents="none"
        >
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              color: "#F9FAFB",
              background: "rgba(12,12,16,0.85)",
              border: `1px solid ${district.color}`,
              borderRadius: "8px",
              padding: "3px 10px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {district.name}
          </div>
        </Html>
      )}
    </group>
  );
}