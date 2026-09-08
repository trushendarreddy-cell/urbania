interface RockProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
  valid?: boolean;
}

export default function Rock({
  position,
  rotation = 0,
  ghost = false,
  valid = true,
}: RockProps) {
  const opacity = ghost ? 0.45 : 1;
  // Deterministic variation
  const seed = position[0] * 100 + position[2];
  const variation = Math.abs(Math.sin(seed)) * 0.3 + 0.7;
  const colorShift = Math.abs(Math.cos(seed * 2)) * 20;
  const rockColor1 = ghost ? (valid ? "#4ADE80" : "#EF4444") : `rgb(${120 + colorShift}, ${110 + colorShift * 0.5}, ${100})`;
  const rockColor2 = ghost ? (valid ? "#86EFAC" : "#F87171") : `rgb(${100 + colorShift}, ${95 + colorShift * 0.5}, ${90})`;
  const rockColor3 = ghost ? (valid ? "#22C55E" : "#DC2626") : `rgb(${80 + colorShift}, ${80 + colorShift * 0.5}, ${75})`;

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[variation, variation, variation]}>
      <mesh
        position={[0, 0.22, 0]}
        rotation={[0.2, 0.5, -0.1]}
        scale={[1.1, 0.7, 0.9]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color={rockColor1}
          roughness={0.9}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh
        position={[0.3, 0.14, 0.2]}
        rotation={[-0.3, 0.8, 0.4]}
        scale={[0.9, 0.6, 0.8]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial
          color={rockColor2}
          roughness={0.9}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh
        position={[-0.25, 0.09, -0.22]}
        rotation={[0.4, -0.6, 0.2]}
        scale={[0.8, 0.5, 0.9]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color={rockColor3}
          roughness={0.9}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
