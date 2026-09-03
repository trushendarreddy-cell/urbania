import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Raycaster, Plane, Vector2, Vector3 } from "three";
import { useEffect, useState } from "react";

import Ground from "../world/Ground";
import WorldGrid from "../world/Grid";
import HoverTile from "../world/HoverTile";
import House from "../world/House";
import useBuildingStore from "../store/BuildingStore";



export default function GameScene() {
  const { camera, gl } = useThree();
const buildings = useBuildingStore(
  (state) => state.buildings
);
const addBuilding = useBuildingStore(
  (state) => state.addBuilding
);
  const [hoverPos, setHoverPos] = useState<
    [number, number, number]
  >([0, 0.02, 0]);

  useEffect(() => {
    const raycaster = new Raycaster();

    const plane = new Plane(
      new Vector3(0, 1, 0),
      0
    );

    const mouse = new Vector2();

    function onMouseMove(event: MouseEvent) {
      mouse.x =
        (event.clientX / window.innerWidth) * 2 - 1;

      mouse.y =
        -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const point = new Vector3();

      raycaster.ray.intersectPlane(
        plane,
        point
      );

      const x = Math.floor(point.x) + 0.5;
      const z = Math.floor(point.z) + 0.5;

      setHoverPos([x, 0.02, z]);
    }

    function onMouseClick() {
      addBuilding([
        hoverPos[0],
        0.5,
        hoverPos[2],
      ]);
    }

    gl.domElement.addEventListener(
      "mousemove",
      onMouseMove
    );
    gl.domElement.addEventListener(
      "click",
      onMouseClick
    );

    return () => {
      gl.domElement.removeEventListener(
        "mousemove",
        onMouseMove
      );

      gl.domElement.removeEventListener(
        "click",
        onMouseClick
      );
    };
  }, [camera, gl, hoverPos, addBuilding]);

  return (
    <>
      {/* Sky */}
      <color attach="background" args={["#87CEEB"]} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[10, 15, 8]}
        intensity={2}
        castShadow
      />

      {/* World */}
      <Ground />
      <WorldGrid />

      {/* Test House */}
      {buildings.map((building) => (
  <House
    key={building.id}
    position={building.position}
  />
))}
<House
  position={[hoverPos[0], 0, hoverPos[2]]}
  ghost
/>
      {/* Hover Tile */}
      <HoverTile position={hoverPos} />
<House
  position={[hoverPos[0], 0, hoverPos[2]]}
  ghost
/>
      {/* Camera Controls */}
      <OrbitControls />
    </>
  );
}
