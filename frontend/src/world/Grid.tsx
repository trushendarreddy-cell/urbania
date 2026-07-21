import { Grid } from "@react-three/drei";

export default function WorldGrid() {
  return (
    <Grid
      args={[50, 50]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#4f7f4f"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#2f5f2f"
      fadeDistance={100}
      fadeStrength={1}
      infiniteGrid
    />
  );
}