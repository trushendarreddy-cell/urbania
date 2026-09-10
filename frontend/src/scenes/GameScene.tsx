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
import usePopulationStore from "../store/PopulationStore";
import type { BuildTool } from "../types/BuildTool";
import { canPlaceObject } from "../systems/PlacementSystem";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import {
  getRoadNeighbors,
  generateRoadLine,
} from "../systems/RoadSystem";
import { useSimulationStore } from "../stores/useSimulationStore";
import { getCitizenPosition } from "../systems/CitizenMovementSystem";
import Citizen from "../world/Citizen";
import PowerPlant from "../world/PowerPlant";
import WaterPlant from "../world/WaterPlant";
import Hospital from "../world/Hospital";
import School from "../world/School";
import PoliceStation from "../world/PoliceStation";
import FireStation from "../world/FireStation";
import EventIndicator from "../world/EventIndicator";
import useEventStore from "../store/EventStore";
import useVehicleStore from "../store/VehicleStore";
import EmergencyVehicle from "../world/EmergencyVehicle";
import useActivityStore from "../store/ActivityStore";
import ZoneTile from "../world/ZoneTile";
import useZoneStore from "../store/ZoneStore";
import DistrictOverlay from "../world/DistrictOverlay";
import useDistrictStore from "../store/DistrictStore";
import type { ZoneType } from "../types/ZoneType";
// import needed for getCitizenPosition

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
  const addHousehold = usePopulationStore(
    (state) => state.addHousehold
  );
  const removeHousehold = usePopulationStore(
    (state) => state.removeHousehold
  );
  const selectedObjectId = useBuildingStore(
    (state) => state.selectedObjectId
  );
  const setSelectedObjectId = useBuildingStore(
    (state) => state.setSelectedObjectId
  );
  const citizens = usePopulationStore((state) => state.citizens);
  const households = usePopulationStore((state) => state.households);
  const timeOfDay = useSimulationStore((state) => state.timeOfDay);
  const events = useEventStore((state) => state.events);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const getWindowIntensity = useActivityStore((state) => state.getWindowIntensity);
  const zones = useZoneStore((state) => state.zones);
  const addZone = useZoneStore((state) => state.addZone);
  const removeZoneAt = useZoneStore((state) => state.removeZoneAt);
  const setSelectedZoneId = useZoneStore((state) => state.setSelectedZoneId);
  const districts = useDistrictStore((state) => state.districts);
  const selectedDistrictId = useDistrictStore((state) => state.selectedDistrictId);
  const setSelectedDistrictId = useDistrictStore((state) => state.setSelectedDistrictId);
  const districtMode = useDistrictStore((state) => state.districtMode);
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

    function getZoningToolType(tool: BuildTool): ZoneType | null {
      switch (tool) {
        case "zone_residential":
          return "residential";
        case "zone_commercial":
          return "commercial";
        case "zone_industrial":
          return "industrial";
        default:
          return null;
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
            if (target.type === "house") {
              removeHousehold(target.id);
            }
            removeBuilding(target.id);
          } else {
            removeZoneAt([hoverPos[0], 0, hoverPos[2]]);
          }
        } else if (selectedTool === "district") {
          const activeId = useDistrictStore.getState().activeDistrictId;
          if (activeId) {
            useDistrictStore
              .getState()
              .toggleCell(
                activeId,
                `${Math.round(hoverPos[0])},${Math.round(hoverPos[2])}`
              );
          }
        } else if (getZoningToolType(selectedTool)) {
          const zoneType = getZoningToolType(selectedTool);
          if (zoneType) {
            const occupied = buildings.some(
              (b) =>
                Math.abs(b.position[0] - hoverPos[0]) < 0.1 &&
                Math.abs(b.position[2] - hoverPos[2]) < 0.1
            );
            if (!occupied) {
              addZone([hoverPos[0], 0, hoverPos[2]], zoneType);
            }
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
          if (target) {
            setSelectedZoneId(null);
            setSelectedDistrictId(null);
          } else {
            const zone = useZoneStore
              .getState()
              .getZoneAt([hoverPos[0], 0, hoverPos[2]]);
            setSelectedZoneId(zone ? zone.id : null);
            const district = useDistrictStore
              .getState()
              .getDistrictAt(`${Math.round(hoverPos[0])},${Math.round(hoverPos[2])}`);
            setSelectedDistrictId(district ? district.id : null);
          }
        } else if (selectedTool !== "road") {
          const canPlace = canPlaceObject(
            selectedTool,
            hoverPos,
            rotation,
            buildings
          );
          if (canPlace) {
            const zoneType = getZoneType(selectedTool);
            const buildingId = addBuilding(
              [hoverPos[0], 0, hoverPos[2]],
              selectedTool,
              rotation,
              zoneType
            );
            if (selectedTool === "house") {
              addHousehold(buildingId);
            }
            removeZoneAt([hoverPos[0], 0, hoverPos[2]]);
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
    addZone,
    removeZoneAt,
    setSelectedZoneId,
    setSelectedDistrictId,
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

  // function BuildingComponent removed - unused

  return (
    <>
      {/* Sky */}
      <color attach="background" args={["#90C8E0"]} />
 
      {/* Lighting - Day/Night Cycle based on timeOfDay */}
      {(() => {
        const hour = timeOfDay;
        // Normalize hour to 0-24
        const sunAngle = (hour / 24) * Math.PI * 2;
        const sunHeight = Math.sin(sunAngle);
        const isDay = sunHeight > 0.1;
        const skyColor = isDay ? "#90C8E0" : "#0A1628";
        const ambientIntensity = isDay ? 0.6 : 0.2;
        const dirIntensity = isDay ? 2.0 : 0.3;
        const fillIntensity = isDay ? 0.5 : 0.1;
        const sunX = Math.cos(sunAngle) * 15;
        const sunZ = Math.sin(sunAngle) * 15;
        const sunY = Math.max(2, sunHeight * 12 + 4);
        return (
          <>
            <color attach="background" args={[skyColor]} />
            <ambientLight intensity={ambientIntensity} />
            <directionalLight
              position={[sunX, sunY, sunZ]}
              intensity={dirIntensity}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0005}
            />
            <directionalLight
              position={[-6, 10, -4]}
              intensity={fillIntensity}
              color="#FFD9B3"
            />
            <hemisphereLight
              args={[isDay ? "#87CEEB" : "#1a2a3a", "#98D8A0", 0.4]}
            />
          </>
        );
      })()}

      {/* World */}
      <Ground />
      <WorldGrid />

      {/* Zoned Tiles */}
      {zones.map((zone) => (
        <ZoneTile
          key={zone.id}
          position={zone.position}
          zoneType={zone.zoneType}
          state={zone.state}
          progress={zone.progress}
        />
      ))}

      {/* District Overlays */}
      {districts.map((district) => (
        <DistrictOverlay
          key={district.id}
          district={district}
          selected={district.id === selectedDistrictId}
          showLabel={districtMode || district.id === selectedDistrictId}
        />
      ))}

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
          // For house/shop/factory, pass level and window intensity
          const level = (building as any).level || 1;
          const windowIntensity = (building.type === 'house' || building.type === 'shop' || building.type === 'factory')
            ? getWindowIntensity(building.type, level)
            : 0;
          const Component = (() => {
            switch (building.type) {
              case 'shop': return Shop;
              case 'factory': return Factory;
              case 'park': return Park;
              default: return House;
            }
          })();
          return (
            <Component
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
              roadAccess={hasRoadAccess(building.position, buildings)}
              level={level}
              windowIntensity={windowIntensity}
            />
          );
        }
        if (building.type === "power_plant") {
          return (
            <PowerPlant
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        if (building.type === "water_plant") {
          return (
            <WaterPlant
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        if (building.type === "hospital") {
          return (
            <Hospital
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        if (building.type === "school") {
          return (
            <School
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        if (building.type === "police_station") {
          return (
            <PoliceStation
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        if (building.type === "fire_station") {
          return (
            <FireStation
              key={building.id}
              position={building.position}
              rotation={building.rotation ?? 0}
            />
          );
        }
        return null;
      })}

      {/* Selection Highlight */}
      {selectedBuilding && (
        <>
          <mesh
            position={[
              selectedBuilding.position[0],
              0.02,
              selectedBuilding.position[2],
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.7, 0.85, 32]} />
            <meshBasicMaterial
              color="#38BDF8"
              transparent
              opacity={0.3}
            />
          </mesh>
          <mesh
            position={[
              selectedBuilding.position[0],
              0.02,
              selectedBuilding.position[2],
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.4, 0.48, 16]} />
            <meshBasicMaterial
              color="#38BDF8"
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh
            position={[
              selectedBuilding.position[0],
              0.02,
              selectedBuilding.position[2],
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.1, 0.15, 8]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.2}
            />
          </mesh>
        </>
      )}

      {/* Citizens */}
      {citizens.map((citizen) => {
        const household = households.find((h) => h.id === citizen.householdId);
        if (!household) return null;
        const building = buildings.find((b) => b.id === household.buildingId);
        if (!building) return null;
        const parts = citizen.id.split('-');
        const index = parseInt(parts[parts.length - 1], 10);
        if (isNaN(index)) return null;
        const active = hasRoadAccess(building.position, buildings);
        const pos = getCitizenPosition(citizen, buildings, timeOfDay, index);
        return (
          <Citizen
            key={citizen.id}
            position={pos}
            active={active}
            employmentStatus={citizen.employmentStatus}
            age={citizen.age}
          />
        );
      })}

      {/* Event Indicators */}
      {events.map((event) => {
        if (event.status === "resolved") return null;
        return (
          <EventIndicator
            key={event.id}
            position={event.position}
            type={event.type}
            status={event.status}
          />
        );
      })}

      {/* Emergency Vehicles */}
      {vehicles.map((vehicle) => {
        if (vehicle.status === "idle") return null;
        // Determine rotation based on movement direction
        let rotation = 0;
        const route = vehicle.route;
        if (vehicle.routeIndex < route.length - 1) {
          const keyA = route[vehicle.routeIndex];
          const keyB = route[vehicle.routeIndex + 1];
          const [ax, az] = keyA.split(',').map(Number);
          const [bx, bz] = keyB.split(',').map(Number);
          rotation = Math.atan2(bx - ax, bz - az);
        } else {
          // At destination, face forward (towards last node)
          const key = route[route.length - 1];
          const [x, z] = key.split(',').map(Number);
          // Get previous node if possible
          if (route.length > 1) {
            const prevKey = route[route.length - 2];
            const [px, pz] = prevKey.split(',').map(Number);
            rotation = Math.atan2(x - px, z - pz);
          }
        }
        return (
          <EmergencyVehicle
            key={vehicle.id}
            type={vehicle.type === "car" ? "police_car" : vehicle.type}
            position={vehicle.position}
            rotation={rotation}
          />
        );
      })}

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

      {selectedTool === "power_plant" && (
        <PowerPlant
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "water_plant" && (
        <WaterPlant
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "hospital" && (
        <Hospital
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "school" && (
        <School
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "police_station" && (
        <PoliceStation
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {selectedTool === "fire_station" && (
        <FireStation
          position={[hoverPos[0], 0, hoverPos[2]]}
          rotation={rotation}
          ghost
          valid={canPlace}
        />
      )}

      {(selectedTool === "zone_residential" ||
        selectedTool === "zone_commercial" ||
        selectedTool === "zone_industrial") && (
        <ZoneTile
          position={[hoverPos[0], 0, hoverPos[2]]}
          zoneType={
            selectedTool === "zone_residential"
              ? "residential"
              : selectedTool === "zone_commercial"
              ? "commercial"
              : "industrial"
          }
          state="zoned"
          ghost
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
        <mesh position={[hoverPos[0], 0.02, hoverPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.6, 16]} />
          <meshBasicMaterial
            color={hoveredBuilding ? "#EF4444" : "#FACC15"}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Build Mode Road Access Feedback */}
      {selectedTool !== "none" &&
        selectedTool !== "road" &&
        selectedTool !== "bulldozer" &&
        selectedTool !== "select" &&
        selectedTool !== "zone_residential" &&
        selectedTool !== "zone_commercial" &&
        selectedTool !== "zone_industrial" && (
          <Html position={[hoverPos[0], 1.5, hoverPos[2]]} center>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "Inter, system-ui, sans-serif",
                padding: "4px 10px",
                borderRadius: "8px",
                backgroundColor: "rgba(12,12,16,0.85)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: hasRoadAccess(hoverPos, buildings)
                  ? "#4ADE80"
                  : "#FACC15",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                userSelect: "none",
                fontWeight: "500",
              }}
            >
              {hasRoadAccess(hoverPos, buildings)
                ? "✓ Road Access"
                : "✗ No Road Access"}
            </div>
          </Html>
        )}

      {/* Camera Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        minDistance={3}
        maxDistance={30}
        target={[0, 0, 0]}
      />
    </>
  );
}
