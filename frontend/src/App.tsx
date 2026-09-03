import { Canvas } from "@react-three/fiber";
import { useState } from "react";

import GameScene from "./scenes/GameScene";
import Toolbar from "./ui/Toolbar";

export default function App() {
  const [selectedTool, setSelectedTool] =
    useState("house");

  return (
    <>
      <Canvas
        style={{
          width: "100vw",
          height: "100vh",
        }}
        shadows
        camera={{
          position: [10, 10, 10],
          fov: 50,
        }}
      >
        <GameScene />
      </Canvas>

      <Toolbar
        selected={selectedTool}
        onSelect={setSelectedTool}
      />
    </>
  );
}