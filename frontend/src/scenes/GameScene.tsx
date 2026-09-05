import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Raycaster, Plane, Vector2, Vector3 } from "three";
import { useEffect, useState } from "react";

import Ground from "../world/Ground";
import WorldGrid from "../world/Grid";
import HoverTile from "../world/HoverTile";
import House from "../world/House";
import Tree from "../world/Tree";
import Rock from "../world/Rock";
import useBuildingStore from "../store/BuildingStore";
import type { BuildMode } from "../types/game";

interface GameSceneProps {
  selectedTool?: BuildMode;
}

export default function GameScene({
  selectedTool = "house",
}: GameSceneProps) {
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

    const DRAG_THRESHOLD = 6;
    let dragStart: { x: number; y: number } | null = null;

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      dragStart = { x: event.clientX, y: event.clientY };
    }

    function onPointerUp(event: PointerEvent) {
      if (event.button !== 0 || !dragStart) return;

      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      const distance = Math.hypot(dx, dy);
      dragStart = null;

      if (distance <= DRAG_THRESHOLD && event.target === gl.domElement) {
        if (selectedTool && selectedTool !== "none") {
          addBuilding([hoverPos[0], 0, hoverPos[2]], selectedTool);
        }
      }
    }

    gl.domElement.addEventListener(
      "mousemove",
      onMouseMove
    );
    gl.domElement.addEventListener(
      "pointerdown",
      onPointerDown
    );
    window.addEventListener(
      "pointerup",
      onPointerUp
    );

    return () => {
      gl.domElement.removeEventListener(
        "mousemove",
        onMouseMove
      );
      gl.domElement.removeEventListener(
        "pointerdown",
        onPointerDown
      );
      window.removeEventListener(
        "pointerup",
        onPointerUp
      );
    };
  }, [camera, gl, hoverPos, addBuilding, selectedTool]);

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
      {buildings.map((building) => {
        if (building.type === "rock") {
          return (
            <Rock
              key={building.id}
              position={building.position}
            />
          );
        }
        if (building.type === "tree") {
          return (
            <Tree
              key={building.id}
              position={building.position}
            />
          );
        }
        if (building.type === "house" || !building.type) {
          return (
            <House
              key={building.id}
              position={building.position}
            />
          );
        }
        return null;
      })}

      {/* Hover Tile */}
      <HoverTile position={hoverPos} />

      {selectedTool === "house" && (
        <House
          position={[hoverPos[0], 0, hoverPos[2]]}
          ghost
        />
      )}

      {selectedTool === "tree" && (
        <Tree
          position={[hoverPos[0], 0, hoverPos[2]]}
          ghost
        />
      )}

      {selectedTool === "rock" && (
        <Rock
          position={[hoverPos[0], 0, hoverPos[2]]}
          ghost
        />
      )}

      {/* Camera Controls */}
      <OrbitControls />
    </>
  );
}
