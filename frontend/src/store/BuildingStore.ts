import { create } from "zustand";

export interface Building {
  id: number;
  position: [number, number, number];
}

interface BuildingStore {
  buildings: Building[];
  addBuilding: (position: [number, number, number]) => void;
}

const useBuildingStore = create<BuildingStore>((set) => ({
  buildings: [],

  addBuilding: (position) =>
    set((state) => ({
      buildings: [
        ...state.buildings,
        {
          id: Date.now(),
          position,
        },
      ],
    })),
}));

export default useBuildingStore;