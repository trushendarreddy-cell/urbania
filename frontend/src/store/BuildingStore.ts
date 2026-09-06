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
  addBuildings: (
    newBuildings: Array<{
      position: [number, number, number];
      type?: BuildTool;
      rotation?: number;
    }>
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

  addBuildings: (newBuildings) =>
    set((state) => {
      const baseId = Date.now();
      const created = newBuildings.map((b, i) => ({
        id: baseId + i,
        type: b.type ?? "road",
        position: b.position,
        rotation: b.rotation ?? 0,
      }));
      return {
        buildings: [...state.buildings, ...created],
      };
    }),

  removeBuilding: (id) =>
    set((state) => ({
      buildings: state.buildings.filter((building) => building.id !== id),
    })),
}));

export default useBuildingStore;