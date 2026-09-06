import { create } from "zustand";
import type { BuildTool } from "../types/BuildTool";

export interface Building {
  id: number;
  type?: BuildTool;
  position: [number, number, number];
  rotation?: number;
}

interface BuildingStore {
  buildings: Building[];
  addBuilding: (
    position: [number, number, number],
    type?: BuildTool,
    rotation?: number
  ) => void;
  removeBuilding: (id: number) => void;
}

const useBuildingStore = create<BuildingStore>((set) => ({
  buildings: [],

  addBuilding: (position, type = "house", rotation = 0) =>
    set((state) => ({
      buildings: [
        ...state.buildings,
        {
          id: Date.now(),
          type,
          position,
          rotation,
        },
      ],
    })),

  removeBuilding: (id) =>
    set((state) => ({
      buildings: state.buildings.filter((building) => building.id !== id),
    })),
}));

export default useBuildingStore;