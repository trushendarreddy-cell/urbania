import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import useServiceStore from "./ServiceStore";
import { useSimulationStore } from "../stores/useSimulationStore";

export type EventType = "fire" | "medical" | "crime";
export type EventStatus = "active" | "responding" | "resolved";

export interface CityEvent {
  id: string;
  type: EventType;
  position: [number, number, number];
  targetBuildingId?: number;
  severity: 1 | 2 | 3; // 1=minor, 2=moderate, 3=severe
  status: EventStatus;
  providerId?: number; // building id of responding provider
  createdAt: number; // simulation day
  responseStartTime?: number; // simulation time when response started
  resolutionTime?: number; // simulation time when resolved
}

interface EventStore {
  events: CityEvent[];
  createEvent: (type: EventType, position: [number, number, number], severity: 1 | 2 | 3, targetBuildingId?: number) => void;
  resolveEvent: (id: string) => void;
  updateEvents: () => void;
  getActiveEvents: () => CityEvent[];
  clearResolved: () => void;
}

const useEventStore = create<EventStore>((set, get) => {
  const updateEvents = () => {
      const { timeOfDay } = useSimulationStore.getState();
    const buildings = useBuildingStore.getState().buildings;
    const serviceStore = useServiceStore.getState();
    const events = get().events;

    let updated = false;
    const updatedEvents: CityEvent[] = events.map((e) => {
      if (e.status === "resolved") return e;

      // If no provider assigned, try to find one
      if (!e.providerId) {
        let serviceType: "fire" | "healthcare" | "safety" | null = null;
        if (e.type === "fire") serviceType = "fire";
        else if (e.type === "medical") serviceType = "healthcare";
        else if (e.type === "crime") serviceType = "safety";

        if (serviceType) {
          // Map service type to actual ServiceStore service type
          let serviceKey: "recreation" | "healthcare" | "education" | "safety" | "emergency" | null = null;
          if (serviceType === "fire") serviceKey = "emergency"; // fire stations are emergency providers
          else if (serviceType === "healthcare") serviceKey = "healthcare";
          else if (serviceType === "safety") serviceKey = "safety";

          if (serviceKey) {
            const coverage = serviceStore.getCoverage(e.position, serviceKey);
            if (coverage.covered && coverage.providerId !== null) {
              // Check if provider building exists
              const providerBuilding = buildings.find(b => b.id === coverage.providerId);
              if (providerBuilding) {
                // Check capacity? For now, assume available.
                updated = true;
                const newEvent: CityEvent = {
                  ...e,
                  providerId: coverage.providerId,
                  status: "responding",
                  responseStartTime: timeOfDay,
                };
                return newEvent;
              }
            }
          }
        }
      }

      // If responding, check if it should be resolved
      if (e.status === "responding" && e.responseStartTime !== undefined) {
        const elapsed = timeOfDay - e.responseStartTime;
        // Simulate response time: base 1 hour + severity * 0.5 hours
        const baseResponseTime = 1 + (e.severity - 1) * 0.5;
        if (elapsed >= baseResponseTime) {
          updated = true;
          const resolvedEvent: CityEvent = {
            ...e,
            status: "resolved",
            resolutionTime: timeOfDay,
          };
          return resolvedEvent;
        }
      }

      return e;
    });

    if (updated) {
      set({ events: updatedEvents });
    }
  };

  // Subscribe to simulation clock changes to update events (commented out, handled in App)

  return {
    events: [],
    createEvent: (type, position, severity, targetBuildingId) => {
      const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const { day: currentDay } = useSimulationStore.getState();
      const newEvent: CityEvent = {
        id,
        type,
        position,
        targetBuildingId,
        severity,
        status: "active",
        createdAt: currentDay,
      };
      set((state) => ({
        events: [...state.events, newEvent],
      }));
    },
    resolveEvent: (id) => {
      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, status: "resolved", resolutionTime: useSimulationStore.getState().timeOfDay } : e
        ),
      }));
    },
    updateEvents,
    getActiveEvents: () => {
      return get().events.filter((e) => e.status !== "resolved");
    },
    clearResolved: () => {
      set((state) => ({
        events: state.events.filter((e) => e.status !== "resolved"),
      }));
    },
  };
});

export default useEventStore;