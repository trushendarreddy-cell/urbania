import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

import GameScene from "./scenes/GameScene";
import BuildMenu from "./ui/BuildMenu";
import HUD from "./ui/HUD";
import InspectionPanel from "./ui/InspectionPanel";
import CityStats from "./ui/CityStats";
import EventPanel from "./ui/EventPanel";
import TrafficPanel from "./ui/TrafficPanel";
import AlertPanel from "./ui/AlertPanel";
import ServiceOverview from "./ui/ServiceOverview";
import { evaluateAlerts } from "./systems/AlertSystem";
import { useSimulationStore } from "./stores/useSimulationStore";
import useBuildingStore from "./store/BuildingStore";
import usePopulationStore from "./store/PopulationStore";
import useNeedsStore from "./store/NeedsStore";
import useVehicleStore from "./store/VehicleStore";
import useDevelopmentStore from "./store/DevelopmentStore";
import { updateTrafficSystem, resetTrafficSystem } from "./systems/TrafficSystem";
import { cleanRoadUsage } from "./systems/RoadUsageCleanup";
import type { BuildTool } from "./types/BuildTool";
import CityMenu from "./ui/CityMenu";

export default function App() {
  const [selectedTool, setSelectedTool] =
    useState<BuildTool>("house");

  // Initialize population for existing houses on mount
  useEffect(() => {
    usePopulationStore.getState().initialize();
  }, []);

  // Traffic update loop synchronized with simulation clock
  useEffect(() => {
    const simulationStore = useSimulationStore;
    let prevTime = simulationStore.getState().timeOfDay;
    let prevDay = simulationStore.getState().day;

    // Reset traffic system on mount (and when simulation resets)
    resetTrafficSystem();
    // Clean up any orphaned road usage periodically
    const cleanupInterval = setInterval(() => {
      cleanRoadUsage();
    }, 10000); // every 10 seconds

    const unsubscribe = simulationStore.subscribe((state) => {
      const { timeOfDay, day, isPaused, speed } = state;
      if (isPaused || speed === 0) {
        prevTime = timeOfDay;
        prevDay = day;
        return;
      }

      // Compute delta hours, handling day rollover
      let deltaHours = timeOfDay - prevTime;
      if (day > prevDay) {
        deltaHours += 24; // wrapped around
      }
      // Avoid negative deltas (e.g., when time decreases due to store reset)
      if (deltaHours < 0) deltaHours = 0;

      if (deltaHours > 0) {
        // Update vehicles
        useVehicleStore.getState().updateVehicles(deltaHours);
        // Spawn civilian traffic
        updateTrafficSystem(deltaHours, timeOfDay);
        // Evaluate alerts on day change (when day > prevDay)
        if (day > prevDay) {
          evaluateAlerts();
          // Also recompute needs (they might have changed due to day change)
          useNeedsStore.getState().recomputeAll();
          // Process development (building upgrades)
          useDevelopmentStore.getState().processDevelopment();
        }
      }

      prevTime = timeOfDay;
      prevDay = day;
    });

    // Also evaluate alerts on building changes (debounced)
    const buildingUnsubscribe = useBuildingStore.subscribe(() => {
      // Debounce to avoid excessive calls
      clearTimeout(window._alertDebounce);
      window._alertDebounce = setTimeout(() => {
        evaluateAlerts();
      }, 500);
    });

    // Also on population changes
    const popUnsubscribe = usePopulationStore.subscribe(() => {
      clearTimeout(window._alertDebounce2);
      window._alertDebounce2 = setTimeout(() => {
        evaluateAlerts();
      }, 500);
    });

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
      buildingUnsubscribe();
      popUnsubscribe();
    };
  }, []);

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

      if (event.key === "0") {
        setSelectedTool("select");
      } else if (event.key === "1") {
        setSelectedTool("house");
      } else if (event.key === "2") {
        setSelectedTool("tree");
      } else if (event.key === "3") {
        setSelectedTool("rock");
      } else if (event.key === "4") {
        setSelectedTool("bulldozer");
      } else if (event.key === "5") {
        setSelectedTool("road");
      } else if (event.key === "6") {
        setSelectedTool("shop");
      } else if (event.key === "7") {
        setSelectedTool("factory");
      } else if (event.key === "8") {
        setSelectedTool("park");
      } else if (event.key === "Escape") {
        if (
          useBuildingStore.getState().selectedObjectId !== null
        ) {
          useBuildingStore
            .getState()
            .setSelectedObjectId(null);
        } else {
          setSelectedTool("none");
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Removed in favor of HUD indicator

  return (
    <>
      <Canvas
        style={{
          width: "100vw",
          height: "100vh",
        }}
        shadows
        camera={{
          position: [12, 10, 12],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
      >
        <GameScene selectedTool={selectedTool} />
      </Canvas>

      <HUD />
      <CityMenu />
      <BuildMenu selected={selectedTool} onSelect={setSelectedTool} />
      <InspectionPanel />
      <CityStats />
      <EventPanel />
      <TrafficPanel />
      <AlertPanel />
      <ServiceOverview />
    </>
  );
}