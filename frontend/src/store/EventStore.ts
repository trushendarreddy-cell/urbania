import { create } from "zustand";
import useBuildingStore from "./BuildingStore";
import useServiceStore from "./ServiceStore";
import useRoadUsageStore from "./RoadUsageStore";
import { useSimulationStore } from "../stores/useSimulationStore";
import { getRoadGraph, findNearestRoadCell, findPath } from "../systems/PathfindingSystem";

export type EventType = "fire" | "medical" | "crime";
export type EventStatus = "active" | "responding" | "resolved";

export interface CityEvent {
  id: string;
  type: EventType;
  position: [number, number, number];
  targetBuildingId?: number;
  severity: 1 | 2 | 3;
  status: EventStatus;
  providerId?: number;
  createdAt: number;
  responseStartTime?: number;
  resolutionTime?: number;
  route?: string[];
  distance?: number;
  eta?: number;
  dispatchTime?: number;
}

const PROVIDER_CAPACITY = 1;

interface EventStore {
  events: CityEvent[];
  providerUsage: Record<number, number>;
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
    const roadUsageStore = useRoadUsageStore.getState();
    const events = get().events;
    let updated = false;
    let newProviderUsage = { ...get().providerUsage };

    const updatedEvents: CityEvent[] = events.map((e) => {
      if (e.status === "resolved") return e;

      // If provider assigned but no longer exists or is not a valid provider, unassign
      if (e.providerId) {
        const providerBuilding = buildings.find(b => b.id === e.providerId);
        if (!providerBuilding) {
          // Provider deleted, unassign
          newProviderUsage[e.providerId] = (newProviderUsage[e.providerId] || 0) - 1;
          if (newProviderUsage[e.providerId] < 0) newProviderUsage[e.providerId] = 0;
          updated = true;
          return { ...e, providerId: undefined, route: undefined, distance: undefined, eta: undefined, dispatchTime: undefined, status: "active" as EventStatus };
        }
        // Check if route is still valid (all road cells still exist)
        if (e.route) {
          const roadSet = new Set(buildings.filter(b => b.type === "road").map(b => `${Math.round(b.position[0])},${Math.round(b.position[2])}`));
          const routeValid = e.route.every(key => roadSet.has(key));
          if (!routeValid) {
            // Route invalid, unassign
            newProviderUsage[e.providerId] = (newProviderUsage[e.providerId] || 0) - 1;
            if (newProviderUsage[e.providerId] < 0) newProviderUsage[e.providerId] = 0;
            updated = true;
            return { ...e, providerId: undefined, route: undefined, distance: undefined, eta: undefined, dispatchTime: undefined, status: "active" as EventStatus };
          }
        }
      }

      // If not assigned, try to find a provider
      if (!e.providerId) {
        // Determine required service type
        let serviceType: "emergency" | "healthcare" | "safety" | null = null;
        if (e.type === "fire") serviceType = "emergency";
        else if (e.type === "medical") serviceType = "healthcare";
        else if (e.type === "crime") serviceType = "safety";
        if (!serviceType) return e;

        const providers = serviceStore.getProvidersForService(serviceType);
        let bestProvider: { id: number; position: [number, number, number]; route: string[]; distance: number; eta: number } | null = null;
        let bestScore = Infinity;

        for (const p of providers) {
          // Check capacity
          const currentUsage = newProviderUsage[p.buildingId] || 0;
          if (currentUsage >= PROVIDER_CAPACITY) continue;

          // Check road connectivity: find nearest road cells
          const providerRoad = findNearestRoadCell(p.position, buildings);
          const eventRoad = findNearestRoadCell(e.position, buildings);
          if (!providerRoad || !eventRoad) continue;

          const graph = getRoadGraph(buildings);
          const startKey = `${providerRoad[0]},${providerRoad[1]}`;
          const endKey = `${eventRoad[0]},${eventRoad[1]}`;
          const path = findPath(startKey, endKey, graph);
          if (!path) continue;

          // Compute distance (number of road cells)
          const distance = path.length;
          // Compute congestion factor along path
          let avgCongestion = 0;
          for (const key of path) {
            const usage = roadUsageStore.getUsage(key);
            const ratio = usage / 5; // using ROAD_CAPACITY = 5 from RoadUsageStore
            avgCongestion += Math.min(ratio, 1);
          }
          avgCongestion /= path.length;
          // Speed factor: congestion reduces speed (1 = no congestion, 0.5 = max congestion)
          const speedFactor = 1 - avgCongestion * 0.5;
          // ETA in hours: distance * base time per cell (e.g., 0.5 hours per cell) / speedFactor
          const baseTimePerCell = 0.5; // hours per road cell
          const eta = (distance * baseTimePerCell) / Math.max(speedFactor, 0.1);

          // Score: distance + eta (we can use distance as primary for deterministic)
          const score = distance + eta * 0.1; // eta weight
          if (score < bestScore) {
            bestScore = score;
            bestProvider = { id: p.buildingId, position: p.position, route: path, distance, eta };
          }
        }

        if (bestProvider) {
          // Assign provider
          newProviderUsage[bestProvider.id] = (newProviderUsage[bestProvider.id] || 0) + 1;
          updated = true;
          return {
            ...e,
            providerId: bestProvider.id,
            route: bestProvider.route,
            distance: bestProvider.distance,
            eta: bestProvider.eta,
            dispatchTime: timeOfDay,
            status: "responding",
            responseStartTime: timeOfDay,
          };
        } else {
          // No provider available, keep active
          return e;
        }
      }

      // If responding, check if ETA elapsed
      if (e.status === "responding" && e.eta !== undefined && e.responseStartTime !== undefined) {
        const elapsed = timeOfDay - e.responseStartTime;
        if (elapsed >= e.eta) {
          updated = true;
          // Decrease usage for this provider
          if (e.providerId) {
            newProviderUsage[e.providerId] = (newProviderUsage[e.providerId] || 0) - 1;
            if (newProviderUsage[e.providerId] < 0) newProviderUsage[e.providerId] = 0;
          }
          return { ...e, status: "resolved", resolutionTime: timeOfDay };
        }
      }

      return e;
    });

    if (updated) {
      set({ events: updatedEvents, providerUsage: newProviderUsage });
    }
  };

  // Subscribe to building changes to re-evaluate dispatch
  useBuildingStore.subscribe(() => {
    // Note: we should not call updateEvents directly here if it's already called from App on time changes,
    // but we need to trigger when buildings change.
    // We'll rely on App calling updateEvents on day/time change, but for building changes we need to trigger.
    // We can call updateEvents inside the subscription, but be careful to avoid infinite loops.
    // We'll just mark that we need to update, but we'll use a flag or we can call it directly.
    // For simplicity, we'll call updateEvents directly.
    get().updateEvents();
  });

  // Also subscribe to road usage changes? Not needed for dispatch, only for ETA.

  return {
    events: [],
    providerUsage: {},
    createEvent: (type, position, severity, targetBuildingId) => {
      const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const { day } = useSimulationStore.getState();
      const newEvent: CityEvent = {
        id,
        type,
        position,
        targetBuildingId,
        severity,
        status: "active",
        createdAt: day,
      };
      set((state) => ({
        events: [...state.events, newEvent],
      }));
      // Immediately try to dispatch
      get().updateEvents();
    },
    resolveEvent: (id) => {
      // Force resolve event by updating status
      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, status: "resolved" } : e
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