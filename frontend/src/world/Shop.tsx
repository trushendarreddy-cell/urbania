interface ShopProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
  roadAccess?: boolean;
}

export default function Shop({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
  roadAccess,
}: ShopProps) {
  const opacity = ghost ? 0.45 : 1;
  const baseColor = ghost ? (valid ? "#4ADE80" : "#EF4444") : "#D4A574";
  const roofColor = ghost ? (valid ? "#86EFAC" : "#F87171") : "#8B5A2B";
  const signColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#FBBF24";
  const windowColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#93C5FD";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Road Access Indicator */}
      {roadAccess !== undefined && !ghost && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.02, 8, 24]} />
          <meshBasicMaterial
            color={roadAccess ? "#4ADE80" : "#FACC15"}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.1, 1.0]} />
        <meshStandardMaterial
          color={baseColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.0, 0.8]} />
        <meshStandardMaterial
          color={baseColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh
        position={[0, 1.15, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
      >
        <coneGeometry args={[0.75, 0.5, 4]} />
        <meshStandardMaterial
          color={roofColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.3, 0.41]}>
        <boxGeometry args={[0.3, 0.25, 0.05]} />
        <meshStandardMaterial
          color={signColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[-0.25, 0.55, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial
          color={windowColor}
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>

      <mesh position={[0.25, 0.55, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial
          color={windowColor}
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>
    </group>
  );
}
