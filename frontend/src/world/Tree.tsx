interface TreeProps {
  position: [number, number, number];
  rotation?: number;
  ghost?: boolean;
}

export default function Tree({
  position,
  rotation = 0,
  ghost = false,
}: TreeProps) {
  const opacity = ghost ? 0.45 : 1;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.7, 6]} />
        <meshStandardMaterial
          color="#5D4037"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.75, 0.7, 6]} />
        <meshStandardMaterial
          color="#2E7D32"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.58, 0.6, 6]} />
        <meshStandardMaterial
          color="#388E3C"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>

      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.4, 0.5, 6]} />
        <meshStandardMaterial
          color="#4CAF50"
          transparent={ghost}
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}
