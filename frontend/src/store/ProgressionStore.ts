import { create } from "zustand";
import useCityStatsStore from "./CityStatsStore";
import type { BuildTool } from "../types/BuildTool";

// Stage definitions
export interface Stage {
  id: string;
  name: string;
  description: string;
  // Requirements: functions returning boolean
  requirements: (stats: any) => boolean;
  // Required for unlock
  unlocks: BuildTool[]; // buildings unlocked at this stage
}

// Milestone definition
export interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: (stats: any) => boolean;
  reward?: string; // description
}



// Stages
const STAGES: Stage[] = [
  {
    id: 'village',
    name: 'Village',
    description: 'A small settlement',
    requirements: (stats) => stats.population >= 0,
    unlocks: ['house', 'tree', 'rock', 'road'] as BuildTool[],
  },
  {
    id: 'town',
    name: 'Town',
    description: 'A growing community',
    requirements: (stats) =>
      stats.population >= 50 &&
      stats.averageHappiness >= 40 &&
      stats.recreationCoverage >= 20 &&
      stats.economicHealth >= 20,
    unlocks: ['shop', 'factory', 'park'] as BuildTool[],
  },
  {
    id: 'city',
    name: 'City',
    description: 'A thriving urban center',
    requirements: (stats) =>
      stats.population >= 200 &&
      stats.averageHappiness >= 50 &&
      stats.healthcareCoverage >= 40 &&
      stats.educationCoverage >= 40 &&
      stats.safetyCoverage >= 40 &&
      stats.economicHealth >= 40 &&
      stats.households >= 5,
    unlocks: ['hospital', 'school', 'police_station', 'fire_station'] as BuildTool[],
  },
  {
    id: 'large_city',
    name: 'Large City',
    description: 'A major metropolis',
    requirements: (stats) =>
      stats.population >= 500 &&
      stats.averageHappiness >= 60 &&
      stats.healthcareCoverage >= 60 &&
      stats.educationCoverage >= 60 &&
      stats.safetyCoverage >= 60 &&
      stats.recreationCoverage >= 60 &&
      stats.economicHealth >= 60 &&
      stats.households >= 15,
    unlocks: ['power_plant', 'water_plant'] as BuildTool[],
  },
  {
    id: 'metropolis',
    name: 'Metropolis',
    description: 'A world-class city',
    requirements: (stats) =>
      stats.population >= 1000 &&
      stats.averageHappiness >= 70 &&
      stats.healthcareCoverage >= 80 &&
      stats.educationCoverage >= 80 &&
      stats.safetyCoverage >= 80 &&
      stats.recreationCoverage >= 80 &&
      stats.economicHealth >= 80 &&
      stats.households >= 30,
    unlocks: [] as BuildTool[],
  },
];

// Milestones
const MILESTONES: Milestone[] = [
  {
    id: 'first_house',
    name: 'First Home',
    description: 'Build your first residential house',
    requirement: (stats) => stats.households >= 1,
  },
  {
    id: 'population_50',
    name: 'Growing Settlement',
    description: 'Reach 50 population',
    requirement: (stats) => stats.population >= 50,
  },
  {
    id: 'population_200',
    name: 'Thriving Town',
    description: 'Reach 200 population',
    requirement: (stats) => stats.population >= 200,
  },
  {
    id: 'population_500',
    name: 'City Status',
    description: 'Reach 500 population',
    requirement: (stats) => stats.population >= 500,
  },
  {
    id: 'population_1000',
    name: 'Metropolis',
    description: 'Reach 1000 population',
    requirement: (stats) => stats.population >= 1000,
  },
  {
    id: 'services_basic',
    name: 'Basic Services',
    description: 'Provide recreation, healthcare, and education coverage above 40%',
    requirement: (stats) =>
      stats.recreationCoverage >= 40 &&
      stats.healthcareCoverage >= 40 &&
      stats.educationCoverage >= 40,
  },
  {
    id: 'services_full',
    name: 'Full Services',
    description: 'All five services (recreation, healthcare, education, safety, emergency) above 60%',
    requirement: (stats) =>
      stats.recreationCoverage >= 60 &&
      stats.healthcareCoverage >= 60 &&
      stats.educationCoverage >= 60 &&
      stats.safetyCoverage >= 60 &&
      stats.emergencyCoverage >= 60,
  },
  {
    id: 'economy_healthy',
    name: 'Healthy Economy',
    description: 'Reach economic health above 50',
    requirement: (stats) => stats.economicHealth >= 50,
  },
  {
    id: 'economy_strong',
    name: 'Strong Economy',
    description: 'Reach economic health above 80',
    requirement: (stats) => stats.economicHealth >= 80,
  },
  {
    id: 'happiness_high',
    name: 'Happy Citizens',
    description: 'Average happiness above 60',
    requirement: (stats) => stats.averageHappiness >= 60,
  },
];

interface ProgressionState {
  currentStage: string;
  completedMilestones: string[]; // ids of completed milestones
  unlockedBuildings: BuildTool[];
  // derived
  getStageIndex: () => number;
  getNextStage: () => Stage | null;
  getProgressToNext: () => number; // 0-100
  getStageRequirements: () => { label: string; met: boolean }[];
  getMilestones: () => (Milestone & { completed: boolean })[];
  recompute: () => void;
  reset: () => void;
}

const useProgressionStore = create<ProgressionState>((set, get) => {
  const recompute = () => {
    const stats = useCityStatsStore.getState();
    // Determine current stage (highest stage whose requirements are met)
    let currentStageId = STAGES[0].id;
    for (const stage of STAGES) {
      if (stage.requirements(stats)) {
        currentStageId = stage.id;
      } else {
        break; // stages are ordered, so stop at first unmet
      }
    }

    // Evaluate milestones
    const completed = MILESTONES.filter(m => m.requirement(stats)).map(m => m.id);

    // Compute unlocked buildings: union of unlocks from all stages up to current
    const stageIndex = STAGES.findIndex(s => s.id === currentStageId);
    const unlocked: BuildTool[] = [];
    for (let i = 0; i <= stageIndex; i++) {
      unlocked.push(...STAGES[i].unlocks);
    }
    // Also include always-available tools: tree, rock, road, zoning, bulldozer, select
    const always = [
      'tree',
      'rock',
      'road',
      'zone_residential',
      'zone_commercial',
      'zone_industrial',
      'district',
      'bus_stop',
      'bulldozer',
      'select',
      'none',
    ] as BuildTool[];
    unlocked.push(...always);
    // Remove duplicates
    const uniqueUnlocked = Array.from(new Set(unlocked));

    set({
      currentStage: currentStageId,
      completedMilestones: completed,
      unlockedBuildings: uniqueUnlocked,
    });
  };

  return {
    currentStage: STAGES[0].id,
    completedMilestones: [],
    unlockedBuildings: [
      'tree',
      'rock',
      'road',
      'zone_residential',
      'zone_commercial',
      'zone_industrial',
      'district',
      'bus_stop',
      'bulldozer',
      'select',
      'none',
    ] as BuildTool[],

    getStageIndex: () => {
      const stage = get().currentStage;
      return STAGES.findIndex(s => s.id === stage);
    },

    getNextStage: () => {
      const idx = get().getStageIndex();
      if (idx < STAGES.length - 1) return STAGES[idx + 1];
      return null;
    },

    getProgressToNext: () => {
      const next = get().getNextStage();
      if (!next) return 100;
      const stats = useCityStatsStore.getState();
      // Map stage to population threshold
      const thresholdMap: Record<string, number> = {
        village: 0,
        town: 50,
        city: 200,
        large_city: 500,
        metropolis: 1000,
      };
      const threshold = thresholdMap[next.id] || 0;
      if (threshold === 0) return 0;
      const progress = Math.min(100, (stats.population / threshold) * 100);
      return progress;
    },

    getStageRequirements: () => {
      const stats = useCityStatsStore.getState();
      const stage = STAGES.find(s => s.id === get().currentStage);
      if (!stage) return [];
      // We'll generate a list of requirement labels based on the stage id.
      if (stage.id === 'village') return [{ label: 'Start a settlement', met: true }];
      if (stage.id === 'town') return [
        { label: 'Population ≥ 50', met: stats.population >= 50 },
        { label: 'Happiness ≥ 40', met: stats.averageHappiness >= 40 },
        { label: 'Recreation coverage ≥ 20%', met: stats.recreationCoverage >= 20 },
        { label: 'Economic health ≥ 20', met: stats.economicHealth >= 20 },
      ];
      if (stage.id === 'city') return [
        { label: 'Population ≥ 200', met: stats.population >= 200 },
        { label: 'Happiness ≥ 50', met: stats.averageHappiness >= 50 },
        { label: 'Healthcare coverage ≥ 40%', met: stats.healthcareCoverage >= 40 },
        { label: 'Education coverage ≥ 40%', met: stats.educationCoverage >= 40 },
        { label: 'Safety coverage ≥ 40%', met: stats.safetyCoverage >= 40 },
        { label: 'Economic health ≥ 40', met: stats.economicHealth >= 40 },
        { label: 'Households ≥ 5', met: stats.households >= 5 },
      ];
      if (stage.id === 'large_city') return [
        { label: 'Population ≥ 500', met: stats.population >= 500 },
        { label: 'Happiness ≥ 60', met: stats.averageHappiness >= 60 },
        { label: 'Healthcare coverage ≥ 60%', met: stats.healthcareCoverage >= 60 },
        { label: 'Education coverage ≥ 60%', met: stats.educationCoverage >= 60 },
        { label: 'Safety coverage ≥ 60%', met: stats.safetyCoverage >= 60 },
        { label: 'Recreation coverage ≥ 60%', met: stats.recreationCoverage >= 60 },
        { label: 'Economic health ≥ 60', met: stats.economicHealth >= 60 },
        { label: 'Households ≥ 15', met: stats.households >= 15 },
      ];
      if (stage.id === 'metropolis') return [
        { label: 'Population ≥ 1000', met: stats.population >= 1000 },
        { label: 'Happiness ≥ 70', met: stats.averageHappiness >= 70 },
        { label: 'Healthcare coverage ≥ 80%', met: stats.healthcareCoverage >= 80 },
        { label: 'Education coverage ≥ 80%', met: stats.educationCoverage >= 80 },
        { label: 'Safety coverage ≥ 80%', met: stats.safetyCoverage >= 80 },
        { label: 'Recreation coverage ≥ 80%', met: stats.recreationCoverage >= 80 },
        { label: 'Economic health ≥ 80', met: stats.economicHealth >= 80 },
        { label: 'Households ≥ 30', met: stats.households >= 30 },
      ];
      return [];
    },

    getMilestones: () => {
      const completed = get().completedMilestones;
      return MILESTONES.map(m => ({
        ...m,
        completed: completed.includes(m.id),
      }));
    },

    recompute,
    reset: () => {
      set({
        currentStage: STAGES[0].id,
        completedMilestones: [],
        unlockedBuildings: [
          'tree',
          'rock',
          'road',
          'zone_residential',
          'zone_commercial',
          'zone_industrial',
          'district',
          'bus_stop',
          'bulldozer',
          'select',
          'none',
        ] as BuildTool[],
      });
    },
  };
});

// Subscribe to city stats changes to recompute
useCityStatsStore.subscribe(() => {
  useProgressionStore.getState().recompute();
});

export default useProgressionStore;