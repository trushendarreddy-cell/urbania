interface HouseProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
}

export default function House({
  position,
  rotation = 0,
  ghost = false,
}: HouseProps) {
  const opacity = ghost ? 0.45 : 1;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Foundation */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.1, 1.1]} />
        <meshStandardMaterial
          color="#808080"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          color="#E9D8A6"
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
          color="#B5423C"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.28, 0.46]}>
        <boxGeometry args={[0.22, 0.42, 0.05]} />
        <meshStandardMaterial
          color="#5D4037"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      {/* Left Window */}
      <mesh position={[-0.22, 0.62, 0.46]}>
        <boxGeometry args={[0.18, 0.18, 0.05]} />
        <meshStandardMaterial
          color="#87CEFA"
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>

      {/* Right Window */}
      <mesh position={[0.22, 0.62, 0.46]}>
        <boxGeometry args={[0.18, 0.18, 0.05]} />
        <meshStandardMaterial
          color="#87CEFA"
          transparent={ghost}
          opacity={ghost ? 0.35 : 0.9}
        />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.24, 1.45, -0.2]} castShadow>
        <boxGeometry args={[0.15, 0.35, 0.15]} />
        <meshStandardMaterial
          color="#666666"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}