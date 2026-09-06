import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Raycaster, Plane, Vector2, Vector3 } from "three";
import { useEffect, useState } from "react";

import Ground from "../world/Ground";
import WorldGrid from "../world/Grid";
import House from "../world/House";
import Tree from "../world/Tree";
import Rock from "../world/Rock";
import useBuildingStore from "../store/BuildingStore";
import type { BuildTool } from "../types/BuildTool";

interface GameSceneProps {
  selectedTool: BuildTool;
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
  const removeBuilding = useBuildingStore(
    (state) => state.removeBuilding
  );
  const [hoverPos, setHoverPos] = useState<
    [number, number, number]
  >([0, 0.02, 0]);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "r" || event.key === "R") {
        setRotation((prev) => (prev + Math.PI / 2) % (Math.PI * 2));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

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
        if (selectedTool === "bulldozer") {
          const target = buildings.find(
            (b) =>
              Math.abs(b.position[0] - hoverPos[0]) < 0.1 &&
              Math.abs(b.position[2] - hoverPos[2]) < 0.1
          );
          if (target) {
            removeBuilding(target.id);
          }
        } else if (selectedTool) {
          addBuilding(
            [hoverPos[0], 0, hoverPos[2]],
            selectedTool,
            rotation
          );
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
  }, [
    camera,
    gl,
    hoverPos,
    addBuilding,
    removeBuilding,
    buildings,
    selectedTool,
    rotation,
  ]);

  const hoveredBuilding =
    selectedTool === "bulldozer"
      ? buildings.find(
          (b) =>
            Math.abs(b.position[0] - hoverPos[0]) < 0.1 &&
            Math.abs(b.position[2] - hoverPos[2]) < 0.1
        )
      : null;

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
              rotation={building.rotation ?? 0}
            />
          );
        }
        if (building.type === "tree") {
          return (
            <Tree
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        if (building.type === "house" || !building.type) {
          return (
            <House
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        return null;
      })}

      {selectedTool === "house" && (
        <House
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
        />
      )}

      {selectedTool === "tree" && (
        <Tree
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
        />
      )}

      {selectedTool === "rock" && (
        <Rock
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
        />
      )}

      {selectedTool === "bulldozer" && (
        <mesh position={hoverPos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={hoveredBuilding ? "#EF4444" : "#F97316"}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Camera Controls */}
      <OrbitControls />
    </>
  );
}
