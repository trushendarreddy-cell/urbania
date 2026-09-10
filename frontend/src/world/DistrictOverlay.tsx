import { Html } from "@react-three/drei";
import type { District, DistrictStats } from "../store/DistrictStore";

interface DistrictOverlayProps {
  district: District;
  selected: boolean;
  showLabel?: boolean;
  stat?: DistrictStats;
}

const parseCell = (key: string): [number, number] => {
  const [x, z] = key.split(",").map(Number);
  return [x, z];
};

export default function DistrictOverlay({
  district,
  selected,
  showLabel = false,
  stat,
}: DistrictOverlayProps) {
  if (district.cells.length === 0) return null;

  let sumX = 0;
  let sumZ = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const c of district.cells) {
    const [x, z] = parseCell(c);
    sumX += x;
    sumZ += z;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const centroidX = sumX / district.cells.length;
  const centroidZ = sumZ / district.cells.length;
  const spanX = maxX - minX + 1;
  const spanZ = maxZ - minZ + 1;

  const baseOpacity = selected ? 0.42 : 0.16;
  const y = selected ? 0.026 : 0.022;

  const labelHeight = Math.max(1.2, Math.min(spanX, spanZ) * 0.35 + 1);

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
        <Html position={[centroidX, labelHeight, centroidZ]} center pointerEvents="none">
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#F9FAFB",
              background: "rgba(12,12,16,0.85)",
              border: `1px solid ${district.color}`,
              borderRadius: "8px",
              padding: selected ? "4px 10px" : "3px 8px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: selected ? "13px" : "12px", fontWeight: 700 }}>
              {district.name.toUpperCase()}
            </div>
            {stat && (
              <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "1px" }}>
                {stat.character} • {stat.trend} • Q{stat.quality}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}