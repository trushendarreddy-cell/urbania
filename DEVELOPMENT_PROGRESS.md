# Development Progress

## Phase 0 — Project Initialization
- Created React + TypeScript project with Vite
- Installed core dependencies (Three.js, R3F, Drei, Zustand)
- Established folder structure

## Phase 1 — 3D Scene Foundation
- R3F Canvas with camera, shadows, sky color
- Ambient and directional lighting
- Large green ground plane (50x50)
- Infinite grid overlay
- OrbitControls

## Phase 2 — Mouse Interaction System
- Raycasting to ground plane
- Grid-snapped tile positions
- HoverTile preview
- Click listeners for placement

## Phase 3 — Building Prototype
- Low-poly House: foundation, walls, roof, door, windows, chimney
- Zustand store (BuildingStore) for placed buildings
- Ghost/preview building with opacity

## Phase 4 — State Management
- BuildingStore with addBuilding, removeBuilding, selectedObjectId

## Phase 5 — UI Toolbar
- Fixed-position toolbar with tools
- Glass-morphism styling

## Phase 6 — Architecture & Tooling
- Organized into world, scene, systems, store, ui, hooks, types
- TypeScript strict settings, Vite, Oxlint

## Phase 7 — Building Tools Expansion
- Added Tree and Rock placement
- Building rotation with R key
- Bulldozer tool
- Placement validation (green/red ghost)

## Phase 8 — Road System
- Road placement with drag-to-build
- Auto-connection based on neighbors
- Horizontal/vertical segments, corners, T-junctions, four-way
- Atomic placement

## Phase 9 — Zoning and Additional Buildings
- Added Shop (commercial), Factory (industrial), Park (public)
- ZoneType enum

## Phase 10 — Road Access
- `hasRoadAccess` checks cardinal neighbors
- Visual indicator on buildings and ghost preview

## Phase 11 — Inspection Panel
- Select mode (key 0) to inspect objects
- Panel shows type, zone, road access, position, road connections

## Phase 12 — Simulation Clock
- `useSimulationStore` with day, timeOfDay, pause, speed
- Speeds: 0, 1x, 2x, 4x

## Phase 13 — Stabilization and Cleanup
- Removed dead code
- Fixed camera drag accidentally placing objects (drag threshold)
- Created DEVELOPMENT_STATUS.md, ARCHITECTURE.md, CONTROLS.md, KNOWN_ISSUES.md

## Phase 14 — Population, Households, Jobs, and Citizens
- PopulationStore manages households, citizens, jobs, population
- Each House creates a household of 4 people
- Active population depends on road access
- Jobs: Shop 2, Factory 5
- Citizens: 4 per household with ages (32, 30, 8, 5)
- CityStats UI shows population/jobs/employment

## Phase 15 — Citizen Visualization
- Low-poly citizens rendered near households
- Color-coded by active/inactive and employment

## Phase 16 — Citizen Daily Routines
- Deterministic home/working/leisure from SimulationClock

## Phase 17 — Citizen Walking & Pathfinding
- Home↔work movement with simulation-clock timing
- BFS road-aware pathfinding with path caching

## Phase 18 — Traffic & Congestion
- RoadUsageStore with capacity and congestion levels
- Congestion affects movement speed

## Phase 19 — Economy Foundation
- Household money, income, spending, business revenue
- Costs, profit, business status

## Phase 20 — Citizen Needs & Happiness
- Needs (housing, food, safety, recreation, healthcare, education)
- Happiness derived from needs

## Phase 21 — Services & Utilities
- ServiceStore (recreation, healthcare, education, safety, emergency)
- UtilityStore (electricity, water) with demand/coverage
- Hospital, School, Police, Fire, Power Plant, Water Plant buildings

## Phase 22 — Events & Emergency Response
- EventStore (fire, medical, crime)
- Emergency dispatch with pathfinding and ETA
- Physical emergency vehicles (Fire Truck, Ambulance, Police Car)

## Phase 23 — Consumer Demand & Production
- Household/shop/factory demand
- Business profit, status, factory production

## Phase 24 — Visual & UI Overhaul
- BuildMenu, HUD, panel styling
- Day/night lighting, camera damping
- World visual fidelity (ground texture, road markings, variations)

## Phase 25 — Persistence
- PersistenceService with versioned save/load
- CityMenu (Save/Load/New City)

## Phase 26 — Dynamic City Simulation
- CityDemandStore (residential/commercial/industrial)
- CityStatsStore (aggregated statistics)

## Phase 27 — Traffic & Transportation
- Traffic-aware pathfinding
- Civilian vehicle spawning, TrafficPanel

## Phase 28 — Services & Citizen Wellbeing
- AlertStore/AlertSystem
- ServiceOverview UI

## Phase 29 — Land Value & Building Progression
- LandValueStore, DevelopmentStore
- Building levels 1–3 with visual scaling and overlays

## Phase 30 — City Progression & Unlocks
- ProgressionStore (5 stages, 10 milestones, unlock system)
- ProgressionPanel, BuildMenu lock indicators

## Phase 31 — City Activity & Living World
- ActivityStore (activity levels, time labels)
- Window illumination system
- HUD activity indicator

## Phase 32 — Municipal Policies & Budget
- MunicipalStore (treasury, revenue, expenses, net)
- Tax rate, city policies, service funding
- MunicipalPanel UI

## Phase 33 — Dynamic Zoning & Organic City Development
- ZoneStore: vacant zoned tiles with state/progress
- Zoning tools (Residential/Commercial/Industrial) with keyboard shortcuts Z/X/V
- ZoneTile visual overlay
- OrganicDevelopmentSystem: eligibility + progress + building creation
- Demand/road/land-value/pressure/progression gating
- Initial level from land value
- ZoneInspectionPanel + persistence

## Phase 34 — Districts & Neighborhoods
- DistrictStore: district data model (id, name, color, cells, specialization)
- District tools and "Districts" BuildMenu category (key D)
- DistrictOverlay visual boundaries and labels
- DistrictPanel management UI and derived statistics
- District specialization modifier for organic development pressure
- Persistence + New City reset

## Phase 35 — Neighborhood Identity & Local Development
- Neighborhood character derived from actual building mix
- Development trend and activity indicators
- Neighborhood Quality score (0–100) with breakdown
- Local service analysis, priority recommendation, and traffic condition
- Identity overlay labels and throttled district notifications
- Specialization (intent) kept separate from character (reality)

## Current State
- Fully functional 3D city-building simulation (v2.48)
- Core building, simulation, economy, services, emergency, progression,
  and persistence systems complete
- Stable, TypeScript clean, production build passing