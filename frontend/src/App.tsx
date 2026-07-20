import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#6fcf5f" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas
      shadows
      camera={{
        position: [10, 10, 10],
        fov: 50,
      }}
    >
      <color attach="background" args={["#87CEEB"]} />

      <ambientLight intensity={0.6} />

      <directionalLight
        position={[10, 15, 8]}
        intensity={2}
        castShadow
      />

      <Ground />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
      />
    </Canvas>
  );
}