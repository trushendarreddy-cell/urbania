interface HouseProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
  roadAccess?: boolean;
  level?: number;
  windowIntensity?: number;
}

export default function House({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
  roadAccess,
  level = 1,
  windowIntensity = 0,
}: HouseProps) {
  const opacity = ghost ? 0.45 : 1;
  const foundationColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#9CA3AF";
  const wallsColor = ghost ? (valid ? "#86EFAC" : "#FCA5A5") : "#FDE68A";
  const roofColor = ghost ? (valid ? "#4ADE80" : "#EF4444") : "#B91C1C";
  const doorColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#78350F";
  const windowColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#93C5FD";
  const chimneyColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#6B7280";
  const windowEmissiveColor = "#FFD700";
  const windowEmissiveIntensity = windowIntensity * 0.8;

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

      {/* Foundation */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.1, 1.1]} />
        <meshStandardMaterial
          color={foundationColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9 * (1 + (level-1)*0.15), 0.9]} />
        <meshStandardMaterial
          color={wallsColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Roof */}
      <mesh
        position={[0, 1.15 + (level-1)*0.12, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
      >
        <coneGeometry args={[0.82 + (level-1)*0.05, 0.6 + (level-1)*0.08, 4]} />
        <meshStandardMaterial
          color={roofColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.28, 0.46]}>
        <boxGeometry args={[0.22, 0.42, 0.05]} />
        <meshStandardMaterial
          color={doorColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Left Window */}
      <mesh position={[-0.22, 0.62, 0.46]}>
        <boxGeometry args={[0.18, 0.18, 0.05]} />
        <meshStandardMaterial
          color={windowColor}
          emissive={windowEmissiveColor}
          emissiveIntensity={windowEmissiveIntensity}
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>

      {/* Right Window */}
      <mesh position={[0.22, 0.62, 0.46]}>
        <boxGeometry args={[0.18, 0.18, 0.05]} />
        <meshStandardMaterial
          color={windowColor}
          emissive={windowEmissiveColor}
          emissiveIntensity={windowEmissiveIntensity}
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.24, 1.45, -0.2]} castShadow>
        <boxGeometry args={[0.15, 0.35, 0.15]} />
        <meshStandardMaterial
          color={chimneyColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}