import type { ZoneType } from "../types/ZoneType";

interface ZoneTileProps {
  position: [number, number, number];
  zoneType: ZoneType;
  state: "zoned" | "developing" | "occupied";
  progress?: number;
  ghost?: boolean;
}

const ZONE_COLORS: Record<ZoneType, string> = {
  residential: "#4ADE80",
  commercial: "#60A5FA",
  industrial: "#FBBF24",
  park: "#34D399",
};

export default function ZoneTile({
  position,
  zoneType,
  state,
  progress = 0,
  ghost = false,
}: ZoneTileProps) {
  const baseColor = ZONE_COLORS[zoneType];
  const opacity = ghost ? 0.35 : state === "developing" ? 0.5 : 0.28;

  return (
    <group position={[position[0], 0.011, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.96, 0.96]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[0.96, 0.96]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.15}
          wireframe
          depthWrite={false}
        />
      </mesh>
      {state === "developing" && progress > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <planeGeometry args={[0.96, 0.96 * (progress / 100)]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}