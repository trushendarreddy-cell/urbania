# Roadmap

## Completed

### Foundation (0.x)
- React + TypeScript + Vite project initialization
- Three.js + React Three Fiber + Drei integration
- Zustand state management
- 3D scene with sky, lighting, shadows, camera
- Ground plane and infinite grid
- Orbit controls
- Mouse raycasting to ground plane
- Grid-snapped hover tile preview
- Low-poly House model
- Click-to-place building system
- Building store with unique IDs
- Ghost/preview building
- UI toolbar with tool selection
- Modular folder architecture
- Tree and Rock placement
- Building rotation with R key
- Bulldozer tool
- Placement validation (green/red ghost)
- Keyboard shortcuts
- Road placement with drag-to-build
- Road auto-connection (straight, corner, T-junction, four-way)
- Zoning (residential, commercial, industrial, park)
- Shop, Factory, Park buildings
- Road access (cardinal neighbor detection)
- Inspection panel
- Simulation clock (day/night, pause, speed 0/1/2/4)

### Population & Citizens (1.x – 2.x)
- Population & Households (households of 4, active population via road access)
- Jobs & Employment (Shop: 2 jobs, Factory: 5 jobs)
- Citizen Simulation Foundation (ages, employment, active/inactive)
- Citizen Visualization Foundation (low-poly citizens, visual states)
- Citizen Daily Routines & Schedules (home/working/leisure)
- Citizen Walking Foundation (home↔work movement)
- Road-Aware Pedestrian Pathfinding (BFS on road graph)

### Simulation Systems (2.20 – 2.32)
- Traffic & Pedestrian Congestion Foundation (RoadUsageStore)
- Economy Foundation (household money, income, spending, business revenue)
- Citizen Needs & Happiness Foundation
- City Services & Infrastructure Foundation
- Electricity & Water Infrastructure Foundation
- Healthcare & Education Service Foundation
- Safety & Emergency Services Foundation
- City Events & Emergency Incidents Foundation
- Emergency Dispatch & Response System
- Physical Emergency Vehicles
- City Economy & Production Foundation

### Polish & UI (2.33 – 2.37)
- Consumer Demand & Business Demand
- Visual & UI Overhaul
- Immersive 3D UI & Presentation
- Premium City-Builder Experience
- World Visual Fidelity Pass

### Persistence & Progression (2.38 – 2.45)
- Persistence & City Management (Save/Load/New City)
- Dynamic City Simulation (demand, needs, happiness, stats)
- Traffic & Transportation Simulation
- Services, Coverage & Citizen Wellbeing
- Land Value, Development Pressure & Building Progression
- City Progression, Milestones & Unlock System
- City Life, Ambient Activity & Living World
- City Policies, Taxes & Municipal Budget
- Dynamic Zoning & Organic City Development (vacant zones, organic development, zoning tools, zone inspection)
- Districts & Neighborhoods (district creation/painting, statistics, specialization, persistence)
- Neighborhood Identity & Local Development (character, trend, quality score, service analysis, notifications)

### City Events & Public Transport (2.49 – 2.54)
- Dynamic City Events & Incidents (condition-driven, severity, cooldowns, CityEventPanel)
- Public Transportation (2.50): transit stops, bus lines with validated road-connected routes, lightweight bus fleet, aggregate ridership, transit district metrics, municipal costs, transit city events
- Transit Line Validation (2.52): road-connectivity checks at creation and per draft pick, named lines, selection-only route visuals, save sanitization; fixed startup crash and render-loop regressions
- Bus Simulation (2.53): dwell at every stop, reversal at endpoints, sim-clock-driven movement (pause/1x/2x/4x), safe line deletion/disable lifecycle, deterministic post-load reconstruction
- Transit Accessibility & Ridership (2.54): cached effective-access snapshot, derived per-line ridership estimates with utilization bands, happiness mobility bonus, district accessibility, Transit Accessibility overlay

## In Progress
- Road intersection visual refinement (minor)
- Building variant randomization (planned)
- Terrain variation (water, elevation) (planned)

## Future
- Individual citizen transit trips (boarding, riding, alighting) and transit fares/policies
- Advanced citizen AI and migration
- Aging, births, deaths
- Education progression, healthcare simulation, crime AI
- Traffic lights, lane simulation, inter-bus spacing
- Banking, loans, debt, inflation, supply chains
- Natural disasters, building damage
- Save/load multiple slots, export/import
- Sound design and background music
- Multiplayer / shared city viewing
- Mobile touch controls