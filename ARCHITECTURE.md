# Architecture

## Overview
Urbania uses a clean separation of concerns: 3D world rendering (React Three Fiber), state management (Zustand), simulation systems, interaction handling, and UI overlays.

## Directory Structure

```
frontend/src/
├── scenes/           # GameScene composition & interaction logic
├── world/            # 3D object components (Ground, Grid, buildings, Road, Citizen, vehicles, indicators)
├── ui/               # Overlay UI (HUD, BuildMenu, panels, overlays)
├── store/            # Zustand stores (buildings, population, economy, services, etc.)
├── stores/           # useSimulationStore (clock)
├── systems/          # Placement, Road, RoadAccess, Pathfinding, CitizenMovement, Traffic, Alert
├── services/         # PersistenceService
├── types/            # BuildTool, ZoneType
├── App.tsx           # Root component with Canvas and UI
└── main.tsx          # Entry point
```

## State Architecture (Zustand Stores)

### Core
- **BuildingStore** (`store/BuildingStore.ts`): `buildings` array (with `level`, `developmentProgress`, `lastUpgradeDay`), `selectedObjectId`. Actions: `addBuilding`, `addBuildings`, `removeBuilding`.
- **PopulationStore** (`store/PopulationStore.ts`): `households`, `citizens`, `totalPopulation`, `totalHouseholds`, `activePopulation`, `totalJobs`, `employed`, `unemployed`. Actions: `addHousehold`, `removeHousehold`, `initialize`, `recompute`.
- **SimulationStore** (`stores/useSimulationStore.ts`): `day`, `timeOfDay`, `isPaused`, `speed`. Actions: `advanceTime`, `togglePaused`, `cycleSpeed`, `reset`.

### Simulation
- **RoadUsageStore** (`store/RoadUsageStore.ts`): road cell usage Map, `ROAD_CAPACITY = 5`, congestion levels/colors.
- **EconomyStore** (`store/EconomyStore.ts`): household money, daily income/spending, business revenue/costs/profit/status, factory production, demand, economic health, financial state.
- **NeedsStore** (`store/NeedsStore.ts`): per-citizen needs (housing, food, safety, recreation, healthcare, education), happiness, category.
- **ServiceStore** (`store/ServiceStore.ts`): service providers (recreation, healthcare, education, safety, emergency) with coverage queries.
- **UtilityStore** (`store/UtilityStore.ts`): electricity/water providers, demand, connections, capacity.
- **EventStore** (`store/EventStore.ts`): city events (fire, medical, crime), lifecycle, dispatch, provider usage.
- **VehicleStore** (`store/VehicleStore.ts`): emergency + civilian vehicles, route following, fleet limits.
- **CityDemandStore** (`store/CityDemandStore.ts`): residential/commercial/industrial demand.
- **CityStatsStore** (`store/CityStatsStore.ts`): aggregated city statistics.
- **LandValueStore** (`store/LandValueStore.ts`): computed land value per building.
- **DevelopmentStore** (`store/DevelopmentStore.ts`): development pressure, building upgrade processing.
- **ProgressionStore** (`store/ProgressionStore.ts`): city stages, milestones, unlocked buildings.
- **ActivityStore** (`store/ActivityStore.ts`): city activity level, time labels, window intensity.
- **MunicipalStore** (`store/MunicipalStore.ts`): treasury, tax rate, city policy, service funding, budget processing.
- **AlertStore** (`store/AlertStore.ts`): city alerts (severity, category).
- **ZoneStore** (`store/ZoneStore.ts`): vacant zoned tiles (`Zone` = position, zoneType, state, progress), `addZone`, `removeZoneAt`, `getZoneAt`, `setProgress`, `setState`, `selectedZoneId`; cleared on New City and persisted in saves.
- **DistrictStore** (`store/DistrictStore.ts`): districts (`id`, `name`, `color`, `cells`, `specialization`), `createDistrict`, `renameDistrict`, `setSpecialization`, `setColor`, `toggleCell`, `deleteDistrict`, `getDistrictAt`, derived `stats`, `selectedDistrictId`/`activeDistrictId`/`districtMode`; max 20 districts; cleared on New City and persisted.
- **CityEventStore** (`store/CityEventStore.ts`): city-wide events (`type`, `category`, `severity`, `title`, `description`, `districtId`, `status`, `createdAtDay`, `navigation`), `createEvent`, `resolveEvent`, `isOnCooldown`, `setCooldown`, `panelOpen`, `selectedEventId`; max 12 active, 20 history; cleared on New City and persisted.

## Simulation Systems
- **PlacementSystem**: validation for building placement.
- **RoadSystem**: `getRoadNeighbors` (cardinal connections), `generateRoadLine` (straight segments).
- **RoadAccessSystem**: `hasRoadAccess` (cardinal road neighbor check).
- **PathfindingSystem**: `getRoadGraph`, `findNearestRoadCell`, `findPath` (BFS), `findPathWithTraffic` (congestion-aware).
- **CitizenMovementSystem**: derives citizen positions from home/work/leisure and time; congestion-aware speed; path caching.
- **CitizenActivitySystem**: `getCitizenActivity` (home/working/leisure from employment, age, time).
- **TrafficSystem**: civilian vehicle spawning on road graph.
- **RoadUsageCleanup**: periodic stale-usage cleanup.
- **AlertSystem**: evaluates service/utility/happiness shortages.
- **OrganicDevelopmentSystem**: `getZoneDevelopmentPressure`, `isZoneEligible`, `processOrganicDevelopment` (run on day change; gates on road access, demand, pressure, progression; creates buildings at land-value-derived level). Pressure includes a district specialization modifier.
## Phase 36 — Dynamic City Events & Incidents
- CityEventStore and CityEventSystem
- Condition-driven events across infrastructure, services, economy, development, citizens
- Severity, cooldowns, automatic resolution
- CityEventPanel, HUD indicator, notifications via AlertStore
- Persistence + New City reset

## Current State
- Fully functional 3D city-building simulation (v2.49)

## Interaction Architecture
- Single pointer pipeline in `GameScene`:
  - `mousemove` updates `hoverPos` via raycasting.
  - `pointerdown` records drag start and road start.
  - `pointerup` checks drag distance (threshold 6px) to distinguish click vs drag.
  - Click actions: bulldoze, select/inspect, place (if valid).
- Keyboard shortcuts handled in `App` (0-8, Escape) and `GameScene` (R rotation).
- OrbitControls handles camera; drag threshold prevents accidental placement.

## Rendering Architecture
- React Three Fiber declarative scene in `GameScene`:
  - World (Ground, Grid)
  - Buildings from `BuildingStore` (component per type, with `level`, `windowIntensity`, `roadAccess`)
  - Citizens from `PopulationStore` (position via `CitizenMovementSystem`)
  - Emergency/civilian vehicles from `VehicleStore`
  - Event indicators from `EventStore`
  - Selection highlight (rings), ghost previews, road access label (`<Html>`)
  - Day/night lighting derived from `timeOfDay`

## Simulation Flow (per day change, driven by SimulationStore)
1. `evaluateAlerts()` — service/utility/happiness checks.
2. `NeedsStore.recomputeAll()` — citizen needs/happiness.
3. `DevelopmentStore.processDevelopment()` — building level upgrades.
4. `ProgressionStore.recompute()` — stage + milestones.
5. `MunicipalStore.processDailyBudget()` — revenue, expenses, treasury.
6. `processOrganicDevelopment()` — advances vacant zones toward buildings.
7. `recomputeDistrictStats()` — aggregates per-district statistics.
8. `evaluateCityEvents()` — evaluates condition-driven city events (create/resolve) with cooldowns.

## Traffic Flow (per time tick)
- `VehicleStore.updateVehicles(deltaHours)` — move vehicles.
- `TrafficSystem.updateTrafficSystem(deltaHours)` — spawn civilian vehicles.
- Periodic `cleanRoadUsage()`.

## Persistence
- **PersistenceService** (`services/PersistenceService.ts`): `saveCity`, `loadCity`, `hasSave`, `newCity`.
- Versioned save format (`version: 1`) persisted to localStorage.
- Durable state saved: buildings (incl. level/progress), households, citizens, simulation, economy, events, vehicles, municipal.
- Derived state (needs, land value, demand, services, utilities, alerts, activity) recomputed after load.

## Future Considerations
- Advanced citizen AI, migration, aging
- Education/healthcare/crime simulation
- Public transport, traffic lights
- Multiple save slots, export/import