import { create } from "zustand";

export type DistrictSpecialization =
  | "general"
  | "residential"
  | "commercial"
  | "industrial"
  | "mixed";

export interface District {
  id: string;
  name: string;
  color: string;
  cells: string[];
  specialization: DistrictSpecialization;
  createdAtDay: number;
}

export interface DistrictStats {
  population: number;
  households: number;
  jobs: number;
  buildingCount: number;
  developedCells: number;
  zonedCells: number;
  byType: Record<string, number>;
  levelCounts: Record<number, number>;
  avgLandValue: number;
  avgHappiness: number;
  avgDevPressure: number;
  traffic: number;
  serviceCoverage: number;
  health: "Thriving" | "Good" | "Fair" | "Needs Attention";
  strengths: string[];
  problems: string[];
}

export const MAX_DISTRICTS = 20;

export const DISTRICT_COLORS = [
  "#38BDF8",
  "#4ADE80",
  "#FBBF24",
  "#F472B6",
  "#A78BFA",
  "#FB923C",
  "#2DD4BF",
  "#F87171",
];

export const SPECIALIZATION_LABELS: Record<DistrictSpecialization, string> = {
  general: "General",
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  mixed: "Mixed",
};

export const specializationForZoneType = (
  zoneType: string
): DistrictSpecialization | null => {
  switch (zoneType) {
    case "residential":
      return "residential";
    case "commercial":
      return "commercial";
    case "industrial":
      return "industrial";
    default:
      return null;
  }
};

interface DistrictStore {
  districts: District[];
  stats: Record<string, DistrictStats>;
  selectedDistrictId: string | null;
  activeDistrictId: string | null;
  districtMode: boolean;
  setSelectedDistrictId: (id: string | null) => void;
  setActiveDistrictId: (id: string | null) => void;
  setDistrictMode: (on: boolean) => void;
  createDistrict: (name?: string) => string | null;
  renameDistrict: (id: string, name: string) => void;
  setSpecialization: (id: string, spec: DistrictSpecialization) => void;
  setColor: (id: string, color: string) => void;
  toggleCell: (id: string, cellKey: string) => void;
  removeCell: (cellKey: string) => void;
  deleteDistrict: (id: string) => void;
  getDistrictAt: (cellKey: string) => District | undefined;
  setStats: (stats: Record<string, DistrictStats>) => void;
  clear: () => void;
}

const useDistrictStore = create<DistrictStore>((set, get) => ({
  districts: [],
  stats: {},
  selectedDistrictId: null,
  activeDistrictId: null,
  districtMode: false,

  setSelectedDistrictId: (id) => set({ selectedDistrictId: id }),
  setActiveDistrictId: (id) => set({ activeDistrictId: id }),
  setDistrictMode: (on) =>
    set({ districtMode: on, activeDistrictId: on ? get().activeDistrictId : null }),

  createDistrict: (name) => {
    const state = get();
    if (state.districts.length >= MAX_DISTRICTS) return null;
    const index = state.districts.length + 1;
    const id = `district-${Date.now()}-${index}`;
    const color = DISTRICT_COLORS[state.districts.length % DISTRICT_COLORS.length];
    const newDistrict: District = {
      id,
      name: name || `District ${index}`,
      color,
      cells: [],
      specialization: "general",
      createdAtDay: 0,
    };
    set({
      districts: [...state.districts, newDistrict],
      activeDistrictId: id,
      selectedDistrictId: id,
    });
    return id;
  },

  renameDistrict: (id, name) =>
    set((state) => ({
      districts: state.districts.map((d) =>
        d.id === id ? { ...d, name: name || d.name } : d
      ),
    })),

  setSpecialization: (id, spec) =>
    set((state) => ({
      districts: state.districts.map((d) =>
        d.id === id ? { ...d, specialization: spec } : d
      ),
    })),

  setColor: (id, color) =>
    set((state) => ({
      districts: state.districts.map((d) =>
        d.id === id ? { ...d, color } : d
      ),
    })),

  toggleCell: (id, cellKey) =>
    set((state) => ({
      districts: state.districts.map((d) => {
        if (d.id === id) {
          const has = d.cells.includes(cellKey);
          return {
            ...d,
            cells: has
              ? d.cells.filter((c) => c !== cellKey)
              : [...d.cells, cellKey],
          };
        }
        if (d.cells.includes(cellKey)) {
          return { ...d, cells: d.cells.filter((c) => c !== cellKey) };
        }
        return d;
      }),
    })),

  removeCell: (cellKey) =>
    set((state) => ({
      districts: state.districts.map((d) =>
        d.cells.includes(cellKey)
          ? { ...d, cells: d.cells.filter((c) => c !== cellKey) }
          : d
      ),
    })),

  deleteDistrict: (id) =>
    set((state) => ({
      districts: state.districts.filter((d) => d.id !== id),
      selectedDistrictId:
        state.selectedDistrictId === id ? null : state.selectedDistrictId,
      activeDistrictId:
        state.activeDistrictId === id ? null : state.activeDistrictId,
    })),

  getDistrictAt: (cellKey) =>
    get().districts.find((d) => d.cells.includes(cellKey)),

  setStats: (stats) => set({ stats }),

  clear: () =>
    set({
      districts: [],
      stats: {},
      selectedDistrictId: null,
      activeDistrictId: null,
      districtMode: false,
    }),
}));

export default useDistrictStore;