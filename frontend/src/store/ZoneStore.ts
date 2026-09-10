import { create } from "zustand";
import type { ZoneType } from "../types/ZoneType";

export type ZoneState = "zoned" | "developing" | "occupied";

export interface Zone {
  id: string;
  position: [number, number, number];
  zoneType: ZoneType;
  state: ZoneState;
  progress: number;
  createdAtDay: number;
}

interface ZoneStore {
  zones: Zone[];
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  addZone: (position: [number, number, number], zoneType: ZoneType) => void;
  removeZoneAt: (position: [number, number, number]) => void;
  removeZoneById: (id: string) => void;
  hasZoneAt: (position: [number, number, number]) => boolean;
  getZoneAt: (position: [number, number, number]) => Zone | undefined;
  setProgress: (id: string, progress: number) => void;
  setState: (id: string, state: ZoneState) => void;
  clear: () => void;
}

const samePos = (
  a: [number, number, number],
  b: [number, number, number]
) => Math.abs(a[0] - b[0]) < 0.1 && Math.abs(a[2] - b[2]) < 0.1;

const useZoneStore = create<ZoneStore>((set, get) => ({
  zones: [],
  selectedZoneId: null,
  setSelectedZoneId: (id) => set({ selectedZoneId: id }),

  addZone: (position, zoneType) => {
    if (get().hasZoneAt(position)) return;
    const id = `zone-${Math.round(position[0])}-${Math.round(position[2])}`;
    set((state) => ({
      zones: [
        ...state.zones,
        {
          id,
          position: [position[0], 0, position[2]],
          zoneType,
          state: "zoned",
          progress: 0,
          createdAtDay: 0,
        },
      ],
    }));
  },

  removeZoneAt: (position) =>
    set((state) => ({
      zones: state.zones.filter((z) => !samePos(z.position, position)),
    })),

  removeZoneById: (id) =>
    set((state) => ({
      zones: state.zones.filter((z) => z.id !== id),
    })),

  hasZoneAt: (position) =>
    get().zones.some((z) => samePos(z.position, position)),

  getZoneAt: (position) =>
    get().zones.find((z) => samePos(z.position, position)),

  setProgress: (id, progress) =>
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === id ? { ...z, progress } : z
      ),
    })),

  setState: (id, zoneState) =>
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === id ? { ...z, state: zoneState } : z
      ),
    })),

  clear: () => set({ zones: [], selectedZoneId: null }),
}));

export default useZoneStore;