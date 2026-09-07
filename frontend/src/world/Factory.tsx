interface FactoryProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
  roadAccess?: boolean;
}

export default function Factory({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
  roadAccess,
}: FactoryProps) {
  const opacity = ghost ? 0.45 : 1;
  const baseColor = ghost ? (valid ? "#4ADE80" : "#EF4444") : "#4B5563";
  const roofColor = ghost ? (valid ? "#86EFAC" : "#F87171") : "#374151";
  const chimneyColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#6B7280";
  const windowColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#87CEFA";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Road Access Indicator */}
      {roadAccess !== undefined && !ghost && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.02, 8, 24]} />
          <meshBasicMaterial
            color={roadAccess ? "#4ADE80" : "#FACC15"}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.1, 1.2]} />
        <meshStandardMaterial
          color={baseColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.3, 1.0]} />
        <meshStandardMaterial
          color={baseColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[1.0, 0.5, 0.8]} />
        <meshStandardMaterial
          color={roofColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0.3, 2.2, -0.3]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial
          color={chimneyColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[-0.3, 2.2, 0.3]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial
          color={chimneyColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[-0.3, 0.6, 0.51]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial
          color={windowColor}
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>

      <mesh position={[0.3, 0.6, 0.51]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial
          color={windowColor}
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>
    </group>
  );
}
