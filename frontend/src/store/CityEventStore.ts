import { create } from "zustand";

export type CityEventCategory =
  | "infrastructure"
  | "services"
  | "economy"
  | "development"
  | "citizens";

export type CityEventSeverity = "info" | "warning" | "critical";
export type CityEventStatus = "active" | "resolved" | "expired";

export interface CityEvent {
  id: string;
  type: string;
  category: CityEventCategory;
  severity: CityEventSeverity;
  title: string;
  description: string;
  districtId: string | null;
  districtName: string | null;
  status: CityEventStatus;
  createdAtDay: number;
  resolvedAtDay?: number;
  navigation: "district" | "budget" | "services" | "traffic" | null;
}

export const MAX_ACTIVE_EVENTS = 12;
export const MAX_HISTORY = 20;

interface CityEventStore {
  events: CityEvent[];
  selectedEventId: string | null;
  panelOpen: boolean;
  cooldowns: Record<string, number>;
  setSelectedEventId: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  createEvent: (
    event: Omit<CityEvent, "id" | "status" | "createdAtDay">,
    day: number
  ) => void;
  resolveEvent: (id: string, day: number) => void;
  expireEvent: (id: string) => void;
  isOnCooldown: (key: string, day: number, cooldownDays: number) => boolean;
  setCooldown: (key: string, day: number) => void;
  getActiveEvents: () => CityEvent[];
  clear: () => void;
}

const useCityEventStore = create<CityEventStore>((set, get) => ({
  events: [],
  selectedEventId: null,
  panelOpen: false,
  cooldowns: {},

  setSelectedEventId: (id) => set({ selectedEventId: id }),
  setPanelOpen: (open) => set({ panelOpen: open }),

  createEvent: (event, day) => {
    const active = get().events.filter((e) => e.status === "active");
    if (active.length >= MAX_ACTIVE_EVENTS) {
      const lowest: Record<CityEventSeverity, number> = {
        info: 0,
        warning: 1,
        critical: 2,
      };
      if (event.severity === "info") return;
      if (active.some((e) => lowest[e.severity] > lowest[event.severity])) {
        return;
      }
    }
    const id = `city-event-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)}`;
    const newEvent: CityEvent = {
      ...event,
      id,
      status: "active",
      createdAtDay: day,
    };
    set((state) => ({
      events: [newEvent, ...state.events].slice(0, MAX_HISTORY),
    }));
  },

  resolveEvent: (id, day) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id
          ? { ...e, status: "resolved" as CityEventStatus, resolvedAtDay: day }
          : e
      ),
    })),

  expireEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),

  isOnCooldown: (key, day, cooldownDays) => {
    const last = get().cooldowns[key];
    if (last === undefined) return false;
    return day - last < cooldownDays;
  },

  setCooldown: (key, day) =>
    set((state) => ({ cooldowns: { ...state.cooldowns, [key]: day } })),

  getActiveEvents: () => get().events.filter((e) => e.status === "active"),

  clear: () =>
    set({
      events: [],
      selectedEventId: null,
      panelOpen: false,
      cooldowns: {},
    }),
}));

export default useCityEventStore;