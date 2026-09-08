interface ParkProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
  roadAccess?: boolean;
}

export default function Park({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
  roadAccess,
}: ParkProps) {
  const opacity = ghost ? 0.45 : 1;
  const groundColor = ghost ? (valid ? "#4ADE80" : "#EF4444") : "#6EE7B7";
  const trunkColor = ghost ? (valid ? "#86EFAC" : "#FCA5A5") : "#78350F";
  const leafColor = ghost ? (valid ? "#22C55E" : "#DC2626") : "#15803D";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Road Access Indicator */}
      {roadAccess !== undefined && !ghost && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.02, 8, 24]} />
          <meshBasicMaterial
            color={roadAccess ? "#4ADE80" : "#FACC15"}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.02, 1.0]} />
        <meshStandardMaterial
          color={groundColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.6, 6]} />
        <meshStandardMaterial
          color={trunkColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 0.6, 6]} />
        <meshStandardMaterial
          color={leafColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0.3, 0.9, 0.2]} castShadow receiveShadow>
        <coneGeometry args={[0.35, 0.5, 6]} />
        <meshStandardMaterial
          color={leafColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[-0.25, 0.8, -0.2]} castShadow receiveShadow>
        <coneGeometry args={[0.3, 0.45, 6]} />
        <meshStandardMaterial
          color={leafColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
