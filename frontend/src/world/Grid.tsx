import { Grid } from "@react-three/drei";

export default function WorldGrid() {
  return (
    <Grid
      args={[50, 50]}
      cellSize={1}
      cellThickness={0.3}
      cellColor="#5A8A5A"
      sectionSize={5}
      sectionThickness={0.8}
      sectionColor="#3A6A3A"
      fadeDistance={30}
      fadeStrength={0.8}
      infiniteGrid
    />
  );
}