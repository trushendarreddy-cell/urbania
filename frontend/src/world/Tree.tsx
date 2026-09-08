interface TreeProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
  scale?: number;
}

export default function Tree({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
  scale = 1,
}: TreeProps) {
  const opacity = ghost ? 0.45 : 1;
  // Use position to seed deterministic variation
  const seed = position[0] * 100 + position[2];
  const variant = Math.abs(Math.sin(seed)) * 0.2 + 0.8;
  const finalScale = scale * variant;
  const trunkColor = ghost ? (valid ? "#86EFAC" : "#FCA5A5") : "#5D4037";
  const leafBottom = ghost ? (valid ? "#16A34A" : "#DC2626") : "#2E7D32";
  const leafMiddle = ghost ? (valid ? "#22C55E" : "#EF4444") : "#388E3C";
  const leafTop = ghost ? (valid ? "#4ADE80" : "#F87171") : "#4CAF50";

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[finalScale, finalScale, finalScale]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.7, 6]} />
        <meshStandardMaterial
          color={trunkColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.75, 0.7, 6]} />
        <meshStandardMaterial
          color={leafBottom}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.58, 0.6, 6]} />
        <meshStandardMaterial
          color={leafMiddle}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.4, 0.5, 6]} />
        <meshStandardMaterial
          color={leafTop}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
