import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

import GameScene from "./scenes/GameScene";
import BuildMenu from "./ui/BuildMenu";
import HUD from "./ui/HUD";
import InspectionPanel from "./ui/InspectionPanel";
import CityStats from "./ui/CityStats";
import EventPanel from "./ui/EventPanel";
import useBuildingStore from "./store/BuildingStore";
import usePopulationStore from "./store/PopulationStore";
import type { BuildTool } from "./types/BuildTool";
import CityMenu from "./ui/CityMenu";

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
    </>
  );
}