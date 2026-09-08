import { OrbitControls, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Raycaster, Plane, Vector2, Vector3 } from "three";
import { useEffect, useState } from "react";

import Ground from "../world/Ground";
import WorldGrid from "../world/Grid";
import House from "../world/House";
import Shop from "../world/Shop";
import Factory from "../world/Factory";
import Park from "../world/Park";
import Tree from "../world/Tree";
import Rock from "../world/Rock";
import Road from "../world/Road";
import useBuildingStore from "../store/BuildingStore";
import type { BuildTool } from "../types/BuildTool";
import { canPlaceObject } from "../systems/PlacementSystem";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import {
  getRoadNeighbors,
  generateRoadLine,
} from "../systems/RoadSystem";

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
  const addBuildings = useBuildingStore(
    (state) => state.addBuildings
  );
  const removeBuilding = useBuildingStore(
    (state) => state.removeBuilding
  );
  const selectedObjectId = useBuildingStore(
    (state) => state.selectedObjectId
  );
  const setSelectedObjectId = useBuildingStore(
    (state) => state.setSelectedObjectId
  );
  const [hoverPos, setHoverPos] = useState<
    [number, number, number]
  >([0, 0.02, 0]);
  const [rotation, setRotation] = useState(0);
  const [roadDragStart, setRoadDragStart] = useState<
    [number, number, number] | null
  >(null);

  useEffect(() => {
    if (selectedTool !== "road") {
      setRoadDragStart(null);
    }
  }, [selectedTool]);

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

     function getZoneType(
       tool: BuildTool
     ): "residential" | "commercial" | "industrial" | "park" | undefined {
       switch (tool) {
         case "house":
           return "residential";
         case "shop":
           return "commercial";
         case "factory":
           return "industrial";
         case "park":
           return "park";
         default:
           return undefined;
       }
     }

     function onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      dragStart = { x: event.clientX, y: event.clientY };
      if (selectedTool === "road") {
        setRoadDragStart([hoverPos[0], 0, hoverPos[2]]);
      }
    }

    function onPointerUp(event: PointerEvent) {
      if (event.button !== 0) return;

      if (selectedTool === "road" && roadDragStart) {
        const roadLine = generateRoadLine(roadDragStart, hoverPos);
        const allValid = roadLine.every((p) =>
          canPlaceObject("road", p, 0, buildings)
        );
        if (allValid) {
          addBuildings(
            roadLine.map((p) => ({
              position: p,
              type: "road",
              rotation,
            }))
          );
        }
        setRoadDragStart(null);
        dragStart = null;
        return;
      }

      if (!dragStart) return;

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
        } else if (
          selectedTool === "select" ||
          selectedTool === "none"
        ) {
          const target = buildings.find(
            (b) =>
              Math.abs(b.position[0] - hoverPos[0]) < 0.1 &&
              Math.abs(b.position[2] - hoverPos[2]) < 0.1
          );
          setSelectedObjectId(target ? target.id : null);
        } else if (selectedTool !== "road") {
          const canPlace = canPlaceObject(
            selectedTool,
            hoverPos,
            rotation,
            buildings
          );
          if (canPlace) {
            const zoneType = getZoneType(selectedTool);
            addBuilding(
              [hoverPos[0], 0, hoverPos[2]],
              selectedTool,
              rotation,
              zoneType
            );
          }
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
    addBuildings,
    removeBuilding,
    setSelectedObjectId,
    buildings,
    selectedTool,
    rotation,
    roadDragStart,
  ]);

  const canPlace = canPlaceObject(
    selectedTool,
    hoverPos,
    rotation,
    buildings
  );

  const hoveredBuilding =
    selectedTool === "bulldozer"
      ? buildings.find(
          (b) =>
            Math.abs(b.position[0] - hoverPos[0]) < 0.1 &&
            Math.abs(b.position[2] - hoverPos[2]) < 0.1
        )
      : null;

  const selectedBuilding =
    selectedObjectId !== null
      ? buildings.find((b) => b.id === selectedObjectId)
      : null;

  const roadPreviewLine =
    selectedTool === "road" && roadDragStart
      ? generateRoadLine(roadDragStart, hoverPos)
      : [];

  const allRoadsForPreview = [
    ...buildings,
    ...roadPreviewLine.map((p) => ({
      position: p,
      type: "road" as const,
    })),
  ];

  function BuildingComponent({
    type,
    position,
    rotation,
  }: {
    type: BuildTool;
    position: [number, number, number];
    rotation: number;
  }) {
    const access = hasRoadAccess(position, buildings);
    switch (type) {
      case "shop":
        return (
          <Shop
            position={position}
            rotation={rotation}
            roadAccess={access}
          />
        );
      case "factory":
        return (
          <Factory
            position={position}
            rotation={rotation}
            roadAccess={access}
          />
        );
      case "park":
        return (
          <Park
            position={position}
            rotation={rotation}
            roadAccess={access}
          />
        );
      case "house":
      default:
        return (
          <House
            position={position}
            rotation={rotation}
            roadAccess={access}
          />
        );
    }
  }

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

      {/* Buildings */}
      {buildings.map((building) => {
        if (building.type === "road") {
          const connections = getRoadNeighbors(
            building.position,
            buildings
          );
          return (
            <Road
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
              connections={connections}
            />
          );
        }
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
        if (
          building.type === "house" ||
          building.type === "shop" ||
          building.type === "factory" ||
          building.type === "park" ||
          !building.type
        ) {
          return (
            <BuildingComponent
              key={building.id}
              type={building.type ?? "house"}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        return null;
      })}

      {/* Selection Highlight */}
      {selectedBuilding && (
        <mesh
          position={[
            selectedBuilding.position[0],
            0.04,
            selectedBuilding.position[2],
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.68, 0.025, 8, 32]} />
          <meshBasicMaterial
            color="#22D3EE"
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Ghost Previews */}
      {selectedTool === "house" && (
        <House
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "shop" && (
        <Shop
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "factory" && (
        <Factory
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "park" && (
        <Park
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "tree" && (
        <Tree
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "rock" && (
        <Rock
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "road" && !roadDragStart && (
        <Road
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
          connections={getRoadNeighbors(
            [hoverPos[0], 0, hoverPos[2]],
            buildings
          )}
        />
      )}

      {selectedTool === "road" &&
        roadDragStart &&
        roadPreviewLine.map((pos, idx) => {
          const connections = getRoadNeighbors(
            pos,
            allRoadsForPreview
          );
          const tileValid = canPlaceObject("road", pos, 0, buildings);
          return (
            <Road
              key={`ghost-road-${idx}-${pos[0]}-${pos[2]}`}
              position={pos}
              ghost
              valid={tileValid}
              connections={connections}
            />
          );
        })}

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

      {/* Build Mode Road Access Feedback */}
      {selectedTool !== "none" &&
        selectedTool !== "road" &&
        selectedTool !== "bulldozer" &&
        selectedTool !== "select" && (
          <Html position={[hoverPos[0], 1.2, hoverPos[2]]} center>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                padding: "2px 6px",
                borderRadius: "3px",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: hasRoadAccess(hoverPos, buildings)
                  ? "#4ADE80"
                  : "#FACC15",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {hasRoadAccess(hoverPos, buildings)
                ? "ROAD ACCESS ✓"
                : "NO ROAD ACCESS"}
            </div>
          </Html>
        )}

      {/* Camera Controls */}
      <OrbitControls />
    </>
  );
}
