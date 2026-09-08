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
- HoverTile preview (yellow)
- Click listeners for placement

## Phase 3 — Building Prototype
- Low-poly House: foundation, walls, roof, door, windows, chimney
- Zustand store (BuildingStore) for placed buildings
- Ghost/preview building with opacity

## Phase 4 — State Management
- BuildingStore with addBuilding, removeBuilding, selectedObjectId
- Reactive rendering from store

## Phase 5 — UI Toolbar
- Fixed-position toolbar with tools (House, Tree, Rock)
- Glass-morphism styling
- Tool selection drives placement

## Phase 6 — Architecture & Tooling
- Organized into world, scene, systems, store, ui, hooks, types
- TypeScript strict settings, Vite, Oxlint
- Design docs (GDD, features, roadmap, art style)

## Phase 7 — Building Tools Expansion
- Added Tree and Rock placement
- Building rotation with R key (90° increments)
- Bulldozer tool for removal
- Placement validation (green/red ghost)

## Phase 8 — Road System
- Road placement with drag-to-build
- Auto-connection based on neighbors
- Horizontal/vertical segments, corners, T-junctions, four-way
- Atomic placement (all or nothing)
- Deletion with Bulldozer
- Preview during drag

## Phase 9 — Zoning and Additional Buildings
- Added Shop (commercial), Factory (industrial), Park (public)
- ZoneType enum (residential, commercial, industrial, park)
- House → residential, Shop → commercial, Factory → industrial, Park → park

## Phase 10 — Road Access
- `hasRoadAccess` checks cardinal neighbors (north, south, east, west)
- Visual indicator on buildings (torus ring) and ghost preview

## Phase 11 — Inspection Panel
- Select mode (key 0) to inspect objects
- Panel shows type, zone, road access, position
- For roads: north/south/east/west connections
- Escape to close

## Phase 12 — Simulation Clock
- `useSimulationStore` with day, timeOfDay, pause, speed
- Speeds: 0, 1x, 2x, 4x
- `advanceTime` updates time with day rollover
- UI overlay with time, day, pause/resume, speed cycle

## Phase 13 — Stabilization and Cleanup
- Removed dead code (MouseSystem.tsx, useBuildMode.ts, game.ts)
- Fixed camera drag accidentally placing objects (drag threshold)
- Updated all documentation to reflect current implementation
- Created DEVELOPMENT_STATUS.md, ROADMAP.md, ARCHITECTURE.md, CONTROLS.md, KNOWN_ISSUES.md

## Phase 14 — Population & Households
- Created PopulationStore to manage households and population
- Each residential house (House) creates a household of 4 people
- Active population depends on road access (cardinal neighbors)
- CityStats UI shows total population, households, active population
- Inspection panel shows household size and active/inactive status
- Households are added on house placement, removed on bulldoze
- Existing houses get households on app mount (safe initialization)
- Reuses RoadAccessSystem for active population calculation
- No visible citizens, jobs, economy, or migration yet

## Current State
- Fully functional 3D city-building prototype with population tracking
- All milestone features (world foundation, grid building, build mode, building visuals, roads, zoning, road access, inspection, simulation clock, population & households) are complete
- Advanced simulation (citizens, jobs, economy, traffic) are future milestones
- Stable, with known minor issues documented
