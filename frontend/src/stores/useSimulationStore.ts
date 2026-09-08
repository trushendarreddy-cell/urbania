import { create } from "zustand";

export const GAME_DAY_SECONDS = 120;

export const SIMULATION_SPEEDS = [0, 1, 2, 4] as const;

interface SimulationStore {
  day: number;
  timeOfDay: number;
  isPaused: boolean;
  speed: (typeof SIMULATION_SPEEDS)[number];
  setPaused: (value: boolean) => void;
  togglePaused: () => void;
  setSpeed: (speed: (typeof SIMULATION_SPEEDS)[number]) => void;
  cycleSpeed: () => void;
  advanceTime: (deltaSeconds: number) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  day: 1,
  timeOfDay: 8,
  isPaused: false,
  speed: 1,

  setPaused: (value) => set({ isPaused: value }),

  togglePaused: () =>
    set((state) => ({ isPaused: !state.isPaused })),

  setSpeed: (speed) => set({ speed }),

  cycleSpeed: () =>
    set((state) => {
      const idx = SIMULATION_SPEEDS.indexOf(state.speed);
      const next = SIMULATION_SPEEDS[(idx + 1) % SIMULATION_SPEEDS.length];
      return { speed: next };
    }),

  advanceTime: (deltaSeconds) =>
    set((state) => {
      if (state.isPaused || state.speed === 0) return state;
      const hoursPerSecond = 24 / GAME_DAY_SECONDS;
      const deltaHours = deltaSeconds * hoursPerSecond * state.speed;
      let newTime = state.timeOfDay + deltaHours;
      let newDay = state.day;
      while (newTime >= 24) {
        newTime -= 24;
        newDay += 1;
      }
      return { timeOfDay: newTime, day: newDay };
    }),

  reset: () => set({ day: 1, timeOfDay: 8, isPaused: false, speed: 1 }),
}));