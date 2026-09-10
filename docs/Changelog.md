# Changelog

## 0.0.0 - Initial Project Structure
- Created React + TypeScript project with Vite
- Configured TypeScript, Vite, and base folder layout
- Set up Git repository with initial commit

## 0.0.1 - Engine Initialization
- Integrated Three.js, React Three Fiber, and React Three Drei
- Created base 3D scene with sky, ambient light, and directional light
- Added shadow-casting directional light and shadow configuration
- Set up OrbitControls for camera movement
- Defined initial camera position and field of view
- Organized world, scene, system, store, ui, hooks, and types directories

## 0.1.0 - World Foundation
- Added large green ground plane for terrain
- Implemented infinite grid overlay using Drei Grid component
- Configured grid colors, cell sizes, and fade distance
- Established render pipeline with shadows enabled on Canvas

## 0.2.0 - Mouse Interaction
- Implemented raycasting from mouse coordinates to ground plane
- Converted continuous world coordinates to discrete grid tile positions
- Built HoverTile component for cursor-following preview
- Added mousemove and click event listeners on the canvas

## 0.3.0 - Building Prototype
- Designed low-poly house model with multiple mesh parts
- Created BuildingStore using Zustand for global building state
- Implemented addBuilding action with timestamp-based unique IDs
- Rendered placed buildings by mapping over store state

## 0.4.0 - Ghost Preview System
- Added ghost prop to House component for preview mode
- Reduced opacity and adjusted window transparency for ghost state

## 0.5.0 - UI Toolbar
- Created fixed-position Toolbar component with glass-morphism styling
- Added tool buttons for House, Tree, and Rock

## 0.6.0 - Architecture and Documentation
- Refined folder structure for scalability
- Added DEVELOPMENT_PROGRESS.md for phase tracking
- Created comprehensive README

## 0.7.0 - Building Tools
- Added Tree and Rock placement
- Implemented building rotation with R key
- Added Bulldozer tool
- Created placement validation system with green/red ghost feedback
- Added keyboard shortcuts for tool selection

## 0.8.0 - Road System
- Added road placement tool with drag-to-build interaction
- Implemented road auto-connection based on neighboring road tiles
- Road connection types: isolated, straight, corner, T-junction, four-way intersection
- Atomic road placement
- Added Road component with lane markings and curb details

## 0.9.0 - Zoning, Road Access, Inspection, Simulation Clock
- Added Shop (commercial), Factory (industrial), and Park (public) buildings
- Road access detection: `hasRoadAccess` checks cardinal neighbors
- Inspection panel: Select mode to inspect objects
- Simulation clock: `useSimulationStore` with day, timeOfDay, pause, speed

## 1.0.0 - Stabilization and Cleanup
- Removed dead code: MouseSystem.tsx, useBuildMode.ts, game.ts
- Fixed camera drag accidentally placing objects (drag threshold of 6 pixels)
- Created DEVELOPMENT_STATUS.md, ROADMAP.md, ARCHITECTURE.md, CONTROLS.md, KNOWN_ISSUES.md

## 1.0.1 - Road ghost preview fix
- Fixed road ghost preview not updating validity during drag

## 1.1.0 - Population & Households
- Added PopulationStore to manage households and population
- Houses create a household of 4 people on placement
- Active population calculated from road access
- CityStats UI shows population stats
- Inspection panel shows household info

## 1.2.0 - Jobs & Employment
- Added job capacity: Shop provides 2 jobs, Factory provides 5 jobs
- Employment/unemployment tracked
- Citizen model: each household generates 4 citizens with ages
- Employment status assigned to adult citizens

## 1.3.0 - Citizen Visualization Foundation
- Citizens render as low-poly characters near their household
- Color coding: active (green), inactive (gray), employed (blue), unemployed (orange)

## 2.18 - Citizen Visualization Foundation
- (Milestone) Citizens visually represented with state-based coloring

## 2.19 - Citizen Daily Routines & Schedules
- Deterministic daily activity (home/working/leisure) derived from SimulationClock
- No movement; visual state changes only

## 2.20 - Citizen Walking Foundation
- Employed active citizens move between home and workplace via lerp
- Simulation-clock-driven movement windows

## 2.21 - Road-Aware Pedestrian Pathfinding
- BFS on road graph; citizens follow road cells instead of straight lines
- Path caching per citizen/direction

## 2.22 - Traffic & Pedestrian Congestion Foundation
- RoadUsageStore (usage, capacity 5, congestion levels)
- Citizen movement speed reduced by congestion
- Road color reflects congestion

## 2.23 - Economy Foundation
- EconomyStore: household money, daily income/spending, business revenue
- Salaries (Shop 50/day, Factory 70/day)
- Business costs, profit, status

## 2.24 - Citizen Needs & Happiness Foundation
- NeedsStore: housing, food, safety, recreation (+ later healthcare, education)
- Happiness derived from average needs

## 2.25 - City Services & Infrastructure Foundation
- ServiceStore with providers and coverage
- Recreation service (Park)

## 2.26 - Electricity & Water Infrastructure Foundation
- UtilityStore: providers, demand, connections, capacity
- Power Plant, Water Plant buildings

## 2.27 - Healthcare & Education Service Foundation
- Hospital (healthcare), School (education) providers
- Healthcare/education needs integrated

## 2.28 - Safety & Emergency Services Foundation
- Police Station (safety), Fire Station (emergency)
- Safety need integrated

## 2.29 - City Events & Emergency Incidents Foundation
- EventStore: fire, medical, crime with lifecycle
- Event indicators and EventPanel

## 2.30 - Emergency Dispatch & Response System
- Road-aware provider selection, pathfinding, traffic-aware ETA
- Dispatch lifecycle

## 2.31 - Physical Emergency Vehicles
- VehicleStore: Fire Truck, Ambulance, Police Car
- Route following, fleet limits, return to station

## 2.32 - City Economy & Production Foundation
- Business costs, profit, status
- Factory production (workers × utility factor)
- Economic health, household financial state

## 2.33 - Consumer Demand & Business Demand
- Household demand from needs/income/size
- Shop demand allocation (distance, capacity, road access)
- Factory demand from aggregate consumer demand
- Unmet demand tracking

## 2.34 - Visual & UI Overhaul
- BuildMenu (categorized), HUD, panel styling
- Improved world visuals (sky, lighting, ground, grid, materials)

## 2.35 - Immersive 3D UI & Presentation
- Consistent design system, refined panels
- Day/night lighting cycle, camera damping

## 2.36 - Premium City-Builder Experience
- Refined HUD, build dock, selection rings, world labels

## 2.37 - World Visual Fidelity Pass
- Procedural ground texture, enhanced building details
- Road markings, tree/rock/citizen variation, detailed vehicles

## 2.38 - Persistence & City Management
- Centralized PersistenceService
- Save/Load/New City with versioned save format
- CityMenu UI

## 2.39 - Dynamic City Simulation
- CityDemandStore (residential/commercial/industrial demand)
- CityStatsStore (aggregated statistics)
- Demand UI

## 2.40 - Traffic & Transportation Simulation
- Traffic-aware pathfinding (`findPathWithTraffic`)
- Civilian vehicle spawning
- TrafficPanel, TrafficIndicator, road inspection

## 2.41 - Services, Coverage & Citizen Wellbeing
- AlertStore + AlertSystem (service/utility/happiness shortages)
- ServiceOverview UI
- Citizen wellbeing enhancements

## 2.42 - Land Value, Development Pressure & Building Progression
- LandValueStore, DevelopmentStore
- Building levels 1–3 with visual scaling
- Land value / development overlays

## 2.43 - City Progression, Milestones & Unlock System
- ProgressionStore: 5 stages (Village → Metropolis)
- 10 milestones
- BuildMenu lock indicators, ProgressionPanel

## 2.44 - City Life, Ambient Activity & Living World
- ActivityStore (QUIET/NORMAL/BUSY/PEAK, time labels)
- Window illumination (emissive by type, level, time, activity)
- HUD activity indicator, inspection activity state

## 2.45 - City Policies, Taxes & Municipal Budget
- MunicipalStore: treasury, revenue, expenses, net balance
- Tax rate (low/normal/high) with happiness/demand effects
- City policies (growth/balanced/austerity)
- Service funding controls
- MunicipalPanel UI

## Current Version — 2.45
- Fully functional 3D city-building simulation with population, citizens, economy,
  services, utilities, events, emergency response, land value, building progression,
  city progression, municipal budget, and persistent save/load