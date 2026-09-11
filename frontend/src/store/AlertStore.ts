import { create } from "zustand";
import { useSimulationStore } from "../stores/useSimulationStore";

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 'service' | 'economy' | 'population' | 'traffic' | 'utility';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  timestamp: number; // day
  resolved: boolean;
  dismissable: boolean;
}

interface AlertStore {
  alerts: Alert[];
  addAlert: (severity: AlertSeverity, category: AlertCategory, message: string, dismissable?: boolean) => void;
  resolveAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  clearResolved: () => void;
  clear: () => void;
  getActiveAlerts: () => Alert[];
  getAlertsByCategory: (category: AlertCategory) => Alert[];
}

const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],

  addAlert: (severity, category, message, dismissable = true) => {
    const { day } = useSimulationStore.getState();
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    // Avoid duplicates: check if same message already active
    const existing = get().alerts.find(a => a.message === message && !a.resolved);
    if (existing) return;
    set((state) => ({
      alerts: [...state.alerts, { id, severity, category, message, timestamp: day, resolved: false, dismissable }]
    }));
  },

  resolveAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, resolved: true } : a)
    }));
  },

  dismissAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter(a => a.id !== id)
    }));
  },

  clearResolved: () => {
    set((state) => ({
      alerts: state.alerts.filter(a => !a.resolved)
    }));
  },

  clear: () => {
    set({ alerts: [] });
  },

  getActiveAlerts: () => {
    return get().alerts.filter(a => !a.resolved);
  },

  getAlertsByCategory: (category) => {
    return get().alerts.filter(a => a.category === category);
  },
}));

export default useAlertStore;