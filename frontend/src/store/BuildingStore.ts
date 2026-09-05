import { create } from "zustand";
import type { BuildMode } from "../types/game";

export interface Building {
  id: number;
  type?: BuildMode;
  position: [number, number, number];
}

interface BuildingStore {
  buildings: Building[];
  addBuilding: (
    position: [number, number, number],
    type?: BuildMode
  ) => void;
}

const useBuildingStore = create<BuildingStore>((set) => ({
  buildings: [],

  addBuilding: (position, type = "house") =>
    set((state) => ({
      buildings: [
        ...state.buildings,
        {
          id: Date.now(),
          type,
          position,
        },
      ],
    })),
}));

export default useBuildingStore;