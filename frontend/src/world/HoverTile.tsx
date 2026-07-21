interface HoverTileProps {
  position: [number, number, number];
}

export default function HoverTile({ position }: HoverTileProps) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="yellow"
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}