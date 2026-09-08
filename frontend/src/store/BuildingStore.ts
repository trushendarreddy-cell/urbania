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
  selectedObjectId: number | null;
  setSelectedObjectId: (id: number | null) => void;
  addBuilding: (
    position: [number, number, number],
    type?: BuildTool,
    rotation?: number,
    zoneType?: ZoneType
  ) => number;
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
  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  addBuilding: (position, type = "house", rotation = 0, zoneType) => {
    const id = Date.now();
    set((state) => ({
      buildings: [
        ...state.buildings,
        {
          id,
          type,
          zoneType,
          position,
          rotation,
        },
      ],
    }));
    return id;
  },

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
      selectedObjectId:
        state.selectedObjectId === id ? null : state.selectedObjectId,
    })),
}));

export default useBuildingStore;