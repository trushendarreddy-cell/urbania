interface HouseProps {
  position: [number, number, number];
  ghost?: boolean;
}

export default function House({
  position,
  ghost = false,
}: HouseProps) {
  return (
    <group position={position}>
      {/* House Base */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#d6b37a"
          transparent={ghost}
          opacity={ghost ? 0.5 : 1}
        />
      </mesh>

      {/* Roof */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <coneGeometry args={[0.8, 0.7, 4]} />
        <meshStandardMaterial
          color="#b44a3c"
          transparent={ghost}
          opacity={ghost ? 0.5 : 1}
        />
      </mesh>
    </group>
  );
}