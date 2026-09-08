# Architecture

## Overview
Urbania uses a clean separation of concerns: 3D world rendering (React Three Fiber), state management (Zustand), interaction handling, and UI overlays.

## Directory Structure

```
frontend/src/
├── scenes/           # GameScene composition & interaction logic
├── world/            # 3D object components (Ground, Grid, House, Shop, Factory, Park, Road, Tree, Rock)
├── ui/               # Overlay UI (Toolbar, InspectionPanel, SimulationClock)
├── store/            # BuildingStore (Zustand)
├── stores/           # SimulationStore (Zustand)
├── systems/          # PlacementSystem, RoadSystem, RoadAccessSystem
├── types/            # BuildTool, ZoneType
├── hooks/            # Custom hooks (currently unused)
├── App.tsx           # Root component with Canvas and UI
└── main.tsx          # Entry point
```

## State Architecture
- **BuildingStore** (`store/BuildingStore.ts`): Manages all placed objects. Contains `buildings` array, `selectedObjectId`, and actions: `addBuilding` (returns id), `addBuildings`, `removeBuilding`, `setSelectedObjectId`.
- **PopulationStore** (`store/PopulationStore.ts`): Manages households and population. Tracks `households`, `totalPopulation`, `totalHouseholds`, `activePopulation`. Actions: `addHousehold`, `removeHousehold`, `initialize`, `recompute`. Subscribes to BuildingStore changes to update active population.
- **SimulationStore** (`stores/useSimulationStore.ts`): Manages simulation clock: `day`, `timeOfDay`, `isPaused`, `speed`, with actions `advanceTime`, `togglePaused`, `cycleSpeed`, etc.
- **Local component state**: `selectedTool` in App, `hoverPos` and `rotation` in GameScene.

## Interaction Architecture
- Single pointer pipeline in `GameScene`:
  - `mousemove` on canvas updates `hoverPos` via raycasting.
  - `pointerdown` records drag start and road start.
  - `pointerup` on window checks drag distance (threshold 6px) to distinguish click vs drag.
  - Click actions: bulldoze, select/inspect, place building (if valid).
- Keyboard shortcuts handled in `App` (0-8, Escape) and `GameScene` (R for rotation).
- OrbitControls from `@react-three/drei` handles camera movement; drag threshold prevents accidental placement during orbit.

## Rendering Architecture
- React Three Fiber declarative scene.
- `GameScene` renders:
  - World (Ground, Grid)
  - All buildings from `BuildingStore.buildings` (with appropriate component per type)
  - Selection highlight (torus) for selected object
  - Ghost previews (semi-transparent) for hovered tile
  - Road access feedback (HTML label via `<Html>`)
- Components receive `ghost`, `valid`, `roadAccess` props for visual feedback.

## Road Architecture
- `RoadSystem.ts`: `getRoadNeighbors` returns cardinal connections; `generateRoadLine` produces straight segments between two points.
- `RoadAccessSystem.ts`: `hasRoadAccess` checks cardinal neighbors for any road.
- `Road.tsx`: visual component with asphalt, curbs, and directional markings based on connections.

## Building Types and Zoning
- `BuildTool` type defines all tools.
- `ZoneType` enum defines zone categories.
- `getZoneType` in GameScene maps tool to zone.
- Building components (House, Shop, Factory, Park) accept `zoneType` prop (stored in BuildingStore) and `roadAccess` prop for visual indicator.

## Population, Households, Jobs, and Citizens
- Only residential buildings (House) create households.
- Each house adds one household of 4 people on successful placement.
- Households are stored in PopulationStore, keyed by building ID.
- Active population is the sum of population of households whose building has road access (cardinal neighbors).
- **Jobs:** Shop provides 2 jobs, Factory provides 5 jobs; `totalJobs` computed from buildings.
- **Employment:** `employed = min(activePopulation, totalJobs)`, `unemployed = activePopulation - employed`.
- **Citizens:** Each household generates 4 citizens with deterministic ages (32, 30, 8, 5) and stable IDs. Adult citizens (age ≥ 18) are assigned employment status (employed/unemployed) based on job availability; inactive if household lacks road access.
- PopulationStore subscribes to BuildingStore changes to recompute active population, jobs, and employment.
- Bulldozer removes the associated household and its citizens.
- Existing houses are initialized on app mount (no duplicate households).
- CityStats UI displays population, households, citizens, active population, jobs, employed, unemployed.
- InspectionPanel shows household size, citizen count, and job count for shops/factories.

## Simulation Clock
- `useSimulationStore` advances time based on delta seconds, speed, and pause state.
- SimulationClock UI shows time, day, pause/resume, speed cycle.

## Future Considerations
- Add population simulation using BuildingStore data and road access.
- Introduce economy and resource tracking.
- Save/load state to localStorage.
