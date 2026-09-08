import { create } from "zustand";

interface RoadUsageStore {
  usage: Map<string, number>;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  getUsage: (key: string) => number;
  clear: () => void;
}

const useRoadUsageStore = create<RoadUsageStore>((set, get) => ({
  usage: new Map<string, number>(),

  increment: (key: string) => {
    set((state) => {
      const newMap = new Map(state.usage);
      const current = newMap.get(key) || 0;
      newMap.set(key, current + 1);
      return { usage: newMap };
    });
  },

  decrement: (key: string) => {
    set((state) => {
      const newMap = new Map(state.usage);
      const current = newMap.get(key) || 0;
      if (current > 1) {
        newMap.set(key, current - 1);
      } else {
        newMap.delete(key);
      }
      return { usage: newMap };
    });
  },

  getUsage: (key: string) => {
    return get().usage.get(key) || 0;
  },

  clear: () => {
    set({ usage: new Map() });
  },
}));

export default useRoadUsageStore;

export const ROAD_CAPACITY = 5; // pedestrians per road cell before congestion
export function getCongestionLevel(usage: number): 'low' | 'moderate' | 'high' | 'overloaded' {
  const ratio = usage / ROAD_CAPACITY;
  if (ratio < 0.5) return 'low';
  if (ratio < 0.8) return 'moderate';
  if (ratio < 1.0) return 'high';
  return 'overloaded';
}

export function getCongestionColor(level: 'low' | 'moderate' | 'high' | 'overloaded'): string {
  switch (level) {
    case 'low': return '#4ADE80'; // green
    case 'moderate': return '#FBBF24'; // yellow
    case 'high': return '#F97316'; // orange
    case 'overloaded': return '#EF4444'; // red
  }
}