import { create } from "zustand";
import { invalidateAccessibility } from "../systems/TransitAccessibilitySystem";

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
  draftError: string | null;
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
  commitLineDraft: (name: string) => string | null;
  setDraftError: (message: string | null) => void;
  renameLine: (id: string, name: string) => void;
  toggleLine: (id: string) => void;
  deleteLine: (id: string) => void;
  setDisrupted: (id: string, disrupted: boolean, reason: string | null) => void;
  setBuses: (buses: BusState[]) => void;
  clear: () => void;
}

// Accessibility is derived from stops/lines; any transit mutation drops the cache.
// setBuses is excluded: bus movement does not change accessibility.
const withAccessibilityReset = <T,>(result: T): T => {
  invalidateAccessibility();
  return result;
};
const useTransitStore = create<TransitStore>((set, get) => ({
  stops: [],
  lines: [],
  buses: [],
  selectedStopId: null,
  selectedLineId: null,
  panelOpen: false,
  lineDraft: null,
  draftError: null,

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
    return withAccessibilityReset(id);
  },

  removeStop: (id) => {
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
    }));
    withAccessibilityReset(null);
  },

  getStopAt: (cellKey) => get().stops.find((s) => s.cellKey === cellKey),

  startLineDraft: () => set({ lineDraft: [], draftError: null }),

  addStopToDraft: (stopId) =>
    set((state) => {
      if (!state.lineDraft) return {};
      if (!state.stops.some((s) => s.id === stopId))
        return { draftError: "Stop does not exist." };
      if (state.lineDraft.includes(stopId))
        return { draftError: "Stop already selected." };
      return { lineDraft: [...state.lineDraft, stopId], draftError: null };
    }),

  cancelLineDraft: () => set({ lineDraft: null, draftError: null }),

  setDraftError: (message) => set({ draftError: message }),

  commitLineDraft: (name) => {
    const draft = get().lineDraft;
    if (!draft || draft.length < 2) {
      set({ draftError: "Select at least 2 stops." });
      return null;
    }
    const state = get();
    if (state.lines.length >= MAX_LINES) {
      set({ draftError: "Maximum number of lines reached." });
      return null;
    }
    const index = state.lines.length + 1;
    const id = `line-${Date.now()}-${index}`;
    const line: TransitLine = {
      id,
      name: name.trim() || `Bus Line ${index}`,
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
    return withAccessibilityReset(id);
  },

  renameLine: (id, name) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, name: name || l.name } : l
      ),
    })),

  toggleLine: (id) => {
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, enabled: !l.enabled } : l
      ),
      // vehicles of a disabled line are withdrawn; they respawn
      // deterministically when the line is re-enabled
      buses:
        state.lines.find((l) => l.id === id && l.enabled) != null
          ? state.buses.filter((b) => b.lineId !== id)
          : state.buses,
    }));
    withAccessibilityReset(null);
  },

  deleteLine: (id) => {
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== id),
      // vehicles must never reference a deleted line
      buses: state.buses.filter((b) => b.lineId !== id),
      selectedLineId: state.selectedLineId === id ? null : state.selectedLineId,
    }));
    withAccessibilityReset(null);
  },

  setDisrupted: (id, disrupted, reason) => {
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, disrupted, disruptedReason: reason } : l
      ),
    }));
    if (disrupted) withAccessibilityReset(null);
  },

  setBuses: (buses) => set({ buses }),

  clear: () => {
    set({
      stops: [],
      lines: [],
      buses: [],
      selectedStopId: null,
      selectedLineId: null,
      panelOpen: false,
      lineDraft: null,
      draftError: null,
    });
    withAccessibilityReset(null);
  },
}));

export default useTransitStore;