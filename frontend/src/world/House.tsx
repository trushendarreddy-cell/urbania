interface HouseProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function House({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
}: HouseProps) {
  const opacity = ghost ? 0.45 : 1;
  const foundationColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#808080";
  const wallsColor = ghost ? (valid ? "#86EFAC" : "#FCA5A5") : "#E9D8A6";
  const roofColor = ghost ? (valid ? "#4ADE80" : "#EF4444") : "#B5423C";
  const doorColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#5D4037";
  const windowColor = ghost ? (valid ? "#A7F3D0" : "#FECACA") : "#87CEFA";
  const chimneyColor = ghost ? (valid ? "#6EE7B7" : "#F87171") : "#666666";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
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
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          color={wallsColor}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Roof */}
      <mesh
        position={[0, 1.15, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
      >
        <coneGeometry args={[0.82, 0.6, 4]} />
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
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>

      {/* Right Window */}
      <mesh position={[0.22, 0.62, 0.46]}>
        <boxGeometry args={[0.18, 0.18, 0.05]} />
        <meshStandardMaterial
          color={windowColor}
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