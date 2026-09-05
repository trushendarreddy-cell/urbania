interface RockProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
}

export default function Rock({
  position,
  rotation = 0,
  ghost = false,
}: RockProps) {
  const opacity = ghost ? 0.45 : 1;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh
        position={[0, 0.22, 0]}
        rotation={[0.2, 0.5, -0.1]}
        scale={[1.1, 0.7, 0.9]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#78716C"
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
          color="#6B7280"
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
          color="#57534E"
          roughness={0.9}
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
