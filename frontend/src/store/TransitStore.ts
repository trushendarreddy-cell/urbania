import { create } from "zustand";

export interface TransitStop {
  id: string;
  name: string;
  cellKey: string;
  position: [number, number, number];
  roadKey: string;
}

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  stopIds: string[];
  enabled: boolean;
  disrupted: boolean;
  disruptedReason: string | null;
}

export interface BusState {
  id: string;
  lineId: string;
  segmentIndex: number;
  progress: number;
  direction: 1 | -1;
  status: "traveling" | "boarding" | "idle";
  dwell: number;
}

export const MAX_STOPS = 60;
export const MAX_LINES = 12;

export const LINE_COLORS = [
  "#F97316",
  "#38BDF8",
  "#4ADE80",
  "#F472B6",
  "#A78BFA",
  "#FBBF24",
];

interface TransitStore {
  stops: TransitStop[];
  lines: TransitLine[];
  buses: BusState[];
  selectedStopId: string | null;
  selectedLineId: string | null;
  panelOpen: boolean;
  lineDraft: string[] | null;
  setSelectedStopId: (id: string | null) => void;
  setSelectedLineId: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  addStop: (
    position: [number, number, number],
    roadKey: string
  ) => string | null;
  removeStop: (id: string) => void;
  getStopAt: (cellKey: string) => TransitStop | undefined;
  startLineDraft: () => void;
  addStopToDraft: (stopId: string) => void;
  cancelLineDraft: () => void;
  commitLineDraft: () => string | null;
  renameLine: (id: string, name: string) => void;
  toggleLine: (id: string) => void;
  deleteLine: (id: string) => void;
  setDisrupted: (id: string, disrupted: boolean, reason: string | null) => void;
  setBuses: (buses: BusState[]) => void;
  clear: () => void;
}

const useTransitStore = create<TransitStore>((set, get) => ({
  stops: [],
  lines: [],
  buses: [],
  selectedStopId: null,
  selectedLineId: null,
  panelOpen: false,
  lineDraft: null,

  setSelectedStopId: (id) =>
    set({ selectedStopId: id, selectedLineId: null }),
  setSelectedLineId: (id) =>
    set({ selectedLineId: id, selectedStopId: null }),
  setPanelOpen: (open) => set({ panelOpen: open }),

  addStop: (position, roadKey) => {
    const state = get();
    if (state.stops.length >= MAX_STOPS) return null;
    const cellKey = `${Math.round(position[0])},${Math.round(position[2])}`;
    if (state.stops.some((s) => s.cellKey === cellKey)) return null;
    const id = `stop-${cellKey}`;
    const stop: TransitStop = {
      id,
      name: `Stop ${state.stops.length + 1}`,
      cellKey,
      position: [position[0], 0, position[2]],
      roadKey,
    };
    set({ stops: [...state.stops, stop] });
    return id;
  },

  removeStop: (id) =>
    set((state) => ({
      stops: state.stops.filter((s) => s.id !== id),
      lines: state.lines.map((l) => ({
        ...l,
        stopIds: l.stopIds.filter((sid) => sid !== id),
      })),
      selectedStopId: state.selectedStopId === id ? null : state.selectedStopId,
      lineDraft: state.lineDraft
        ? state.lineDraft.filter((sid) => sid !== id)
        : null,
    })),

  getStopAt: (cellKey) => get().stops.find((s) => s.cellKey === cellKey),

  startLineDraft: () => set({ lineDraft: [] }),

  addStopToDraft: (stopId) =>
    set((state) => {
      if (!state.lineDraft) return {};
      if (state.lineDraft.includes(stopId)) return {};
      return { lineDraft: [...state.lineDraft, stopId] };
    }),

  cancelLineDraft: () => set({ lineDraft: null }),

  commitLineDraft: () => {
    const draft = get().lineDraft;
    if (!draft || draft.length < 2) return null;
    const state = get();
    if (state.lines.length >= MAX_LINES) return null;
    const index = state.lines.length + 1;
    const id = `line-${Date.now()}-${index}`;
    const line: TransitLine = {
      id,
      name: `Bus Line ${index}`,
      color: LINE_COLORS[state.lines.length % LINE_COLORS.length],
      stopIds: draft,
      enabled: true,
      disrupted: false,
      disruptedReason: null,
    };
    set({
      lines: [...state.lines, line],
      lineDraft: null,
      selectedLineId: id,
      selectedStopId: null,
    });
    return id;
  },

  renameLine: (id, name) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, name: name || l.name } : l
      ),
    })),

  toggleLine: (id) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, enabled: !l.enabled } : l
      ),
    })),

  deleteLine: (id) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== id),
      selectedLineId: state.selectedLineId === id ? null : state.selectedLineId,
    })),

  setDisrupted: (id, disrupted, reason) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, disrupted, disruptedReason: reason } : l
      ),
    })),

  setBuses: (buses) => set({ buses }),

  clear: () =>
    set({
      stops: [],
      lines: [],
      buses: [],
      selectedStopId: null,
      selectedLineId: null,
      panelOpen: false,
      lineDraft: null,
    }),
}));

export default useTransitStore;