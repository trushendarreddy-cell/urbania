import { create } from "zustand";
import type { BuildTool } from "../types/BuildTool";
import type { ZoneType } from "../types/ZoneType";

export interface Building {
  id: number;
  type?: BuildTool;
  zoneType?: ZoneType;
  position: [number, number, number];
  rotation?: number;
}

interface BuildingStore {
  buildings: Building[];
  addBuilding: (
    position: [number, number, number],
    type?: BuildTool,
    rotation?: number,
    zoneType?: ZoneType
  ) => void;
  addBuildings: (
    newBuildings: Array<{
      position: [number, number, number];
      type?: BuildTool;
      rotation?: number;
      zoneType?: ZoneType;
    }>
  ) => void;
  removeBuilding: (id: number) => void;
}

const useBuildingStore = create<BuildingStore>((set) => ({
  buildings: [],

  addBuilding: (position, type = "house", rotation = 0, zoneType) =>
    set((state) => ({
      buildings: [
        ...state.buildings,
        {
          id: Date.now(),
          type,
          zoneType,
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
        zoneType: b.zoneType,
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