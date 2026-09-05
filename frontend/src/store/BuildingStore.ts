import { create } from "zustand";
import type { BuildMode } from "../types/game";

export interface Building {
  id: number;
  type?: BuildMode;
  position: [number, number, number];
  rotation?: number;
}

interface BuildingStore {
  buildings: Building[];
  addBuilding: (
    position: [number, number, number],
    type?: BuildMode,
    rotation?: number
  ) => void;
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
}));

export default useBuildingStore;