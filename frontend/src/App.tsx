import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

import GameScene from "./scenes/GameScene";
import Toolbar from "./ui/Toolbar";
import InspectionPanel from "./ui/InspectionPanel";
import CityStats from "./ui/CityStats";
import EventPanel from "./ui/EventPanel";
import useBuildingStore from "./store/BuildingStore";
import usePopulationStore from "./store/PopulationStore";
import type { BuildTool } from "./types/BuildTool";

export default function App() {
  const [selectedTool, setSelectedTool] =
    useState<BuildTool>("house");

  // Initialize population for existing houses on mount
  useEffect(() => {
    usePopulationStore.getState().initialize();
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

  const getIndicatorText = () => {
    switch (selectedTool) {
      case "select":
        return "SELECT MODE";
      case "house":
        return "BUILDING: HOUSE";
      case "shop":
        return "BUILDING: SHOP";
      case "factory":
        return "BUILDING: FACTORY";
      case "park":
        return "BUILDING: PARK";
      case "tree":
        return "BUILDING: TREE";
      case "rock":
        return "BUILDING: ROCK";
      case "road":
        return "BUILDING: ROAD";
      case "bulldozer":
        return "BULLDOZER MODE";
      case "none":
      default:
        return "BUILD MODE OFF";
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "8px 16px",
          background: "rgba(20, 20, 20, 0.85)",
          color: selectedTool === "none" ? "#9CA3AF" : "#F3F4F6",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: "600",
          letterSpacing: "0.05em",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        {getIndicatorText()}
      </div>

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
        <GameScene selectedTool={selectedTool} />
      </Canvas>

      <Toolbar
        selected={selectedTool}
        onSelect={setSelectedTool}
      />
      <InspectionPanel />
      <CityStats />
      <EventPanel />
    </>
  );
}