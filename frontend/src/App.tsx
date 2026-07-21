import { Canvas } from "@react-three/fiber";
import GameScene from "./scenes/GameScene";

export default function App() {
  return (
    <Canvas
      style={{ width: "100vw", height: "100vh" }}
      shadows
      camera={{
        position: [10, 10, 10],
        fov: 50,
      }}
    >
      <GameScene />
    </Canvas>
  );
}