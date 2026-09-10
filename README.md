# Urbania

**Urbania** is an interactive 3D city-building simulation built with React, TypeScript, and Three.js. It renders a low-poly 3D world where you place residential, commercial, industrial, and service buildings, roads, utilities, and decoration on a grid — then watch a living simulation unfold: citizens commute, businesses trade, services respond to emergencies, land value shifts, buildings upgrade, and city policies shape the budget.

---

## Current Development Status

**Version:** 2.46 — Dynamic Zoning & Organic City Development

Urbania has progressed well beyond the initial prototype. Core city-building foundations, an expanding simulation layer (population, economy, services, emergencies, traffic), a professional UI, and persistent save/load are all implemented. Development continues in controlled milestone batches.

- **TypeScript:** clean
- **Production build:** passing (chunk-size warning only)
- **Save/Load/New City:** functional

---

## What is Urbania?

Urbania is a browser-based city builder running entirely in the browser using **React Three Fiber**. It renders a low-poly 3D world with:

- A large terrain plane with procedural ground texture
- A translucent grid for placement guidance
- Mouse-driven raycasting to detect tile positions
- A ghost/preview building system that follows the cursor
- Click-to-place mechanics for buildings, trees, rocks, and roads
- A floating categorized build menu
- Orbit controls for camera navigation (with damping)
- Road placement with drag-to-build and auto-connection
- Building rotation with keyboard shortcuts
- Bulldozer tool for removing placed objects
- Placement validation with green/red ghost feedback
- A day/night lighting cycle driven by the simulation clock

The project is an evolving **city-building simulation** — a proving ground for 3D rendering, state management, and interactive simulation mechanics in the browser.

---

## Features

### World
- R3F scene with ground, grid, sky, and dynamic lighting
- Day/night cycle (dawn/day/dusk/night) from the simulation clock
- Procedural ground texture with subtle variation

### City Building
- Grid snapping, placement validation, ghost previews
- Buildings: House, Shop, Factory, Park, Tree, Rock, Road
- Services: Hospital, School, Police Station, Fire Station
- Utilities: Power Plant, Water Plant
- Bulldozer, selection, and inspection
- Categorized BuildMenu with keyboard shortcuts

### Zoning & Organic Development
- Place vacant Residential/Commercial/Industrial zones (tools in the "Zoning" category; keys Z/X/V)
- Zones develop organically when road access, demand, land value, development pressure, and progression unlocks allow
- Development progress accumulates per simulation day; a notification fires on completion
- Initial building level is derived from land value
- Zones persist in save/load and are cleared on New City
- Selecting a zone shows why it is or isn't developing (ZoneInspectionPanel)

### Roads & Transportation
- Drag-to-build roads with auto-connections (straight, corner, T-junction, intersection)
- Road access detection (cardinal neighbors)
- Road usage and congestion (capacity per road cell)
- Traffic-aware pathfinding (BFS with congestion penalty)
- Civilian vehicle traffic and emergency vehicles (Fire Truck, Ambulance, Police Car)

### Population & Citizens
- Households of 4; active population based on road access
- Jobs & employment (Shop: 2 jobs, Factory: 5 jobs)
- Citizens with ages, employment, activity, and stable IDs
- Daily routines (home / working / leisure) from the simulation clock
- Road-aware walking between home and work with congestion-aware speed
- Low-poly citizen visualization with state-based color and scale variation

### Economy
- Household money, income, spending
- Business revenue, costs, profit, and status (HEALTHY/WEAK/STRUGGLING)
- Factory production (workers × utility factor × demand)
- Consumer demand (household/shop/factory) and unmet demand
- Economic health and household financial state
- Municipal budget: treasury, revenue, expenses, net balance
- Tax rate (low/normal/high) with happiness and demand trade-offs
- City policies (growth / balanced / austerity) and service funding

### Services & Utilities
- Service providers with coverage: Recreation (Park), Healthcare (Hospital), Education (School), Safety (Police), Emergency (Fire)
- Utilities: Electricity (Power Plant) and Water (Water Plant) with demand, capacity, and coverage
- Citizen needs (housing, food, safety, recreation, healthcare, education) and derived happiness
- Service shortage alerts and a compact service overview panel

### Events & Emergencies
- City events: fire, medical, crime with a full lifecycle (active → responding → resolved)
- Emergency dispatch: road-aware provider selection, pathfinding, traffic-aware ETA
- Emergency vehicles physically follow routes and return to their stations

### City Systems
- Simulation clock (day, time, pause, speed 0/1/2/4)
- Land Value derived from access, services, utilities, happiness, congestion, demand
- Development Pressure driving building upgrades
- Building progression (levels 1–3) with visual scaling and cooldowns
- City progression stages: Village → Town → City → Large City → Metropolis
- Milestones and an unlock system (buildings unlock by stage)
- City Activity level (QUIET/NORMAL/BUSY/PEAK) and day/night labels
- Window illumination (emissive, varying by type, level, time, activity)

### Persistence & UI
- Save / Load / New City (versioned localStorage persistence with metadata)
- HUD (day, time, population, households, money, traffic, activity, stage, municipal treasury)
- Panels: ProgressionPanel, MunicipalPanel, CityStats, TrafficPanel, AlertPanel, ServiceOverview, ZoneInspectionPanel
- Toggleable Land Value and Development Pressure overlays

---

## Controls

### Keyboard

| Key | Action |
|-----|--------|
| 0 | Select mode (inspect) |
| 1 | House (residential) |
| 2 | Tree |
| 3 | Rock |
| 4 | Bulldozer (delete) |
| 5 | Road |
| 6 | Shop (commercial) |
| 7 | Factory (industrial) |
| 8 | Park (public) |
| 9 | Power Plant |
| 0 | Water Plant |
| h | Hospital |
| s | School |
| p | Police Station |
| f | Fire Station |
| R | Rotate ghost by 90° |
| Z | Zone: Residential |
| X | Zone: Commercial |
| V | Zone: Industrial |
| Escape | Cancel selection / close inspection |

### Mouse

| Action | Effect |
|--------|--------|
| Left Click (no drag) | Place / select / delete (tool-dependent) |
| Left Click + Drag | Orbit camera (drag > 6px threshold) |
| Scroll | Zoom in/out |

### Simulation (UI)
- Pause/Resume (⏸/▶)
- Speed cycle (0x, 1x, 2x, 4x)

### City Menu (UI)
- Save, Load, New (with confirmation)
- Land Value overlay toggle, Development Pressure overlay toggle

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js |
| Frontend Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| 3D Engine | Three.js |
| React 3D Renderer | React Three Fiber |
| 3D Utilities | React Three Drei |
| State Management | Zustand |
| Linting | Oxlint |
| Package Manager | npm |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

---

## Architecture

State is managed with Zustand stores, rendered declaratively with React Three Fiber, and driven by systems under `frontend/src/systems/`.

```
frontend/src/
├── scenes/       # GameScene composition & interaction
├── world/        # 3D objects (Ground, Grid, buildings, Road, Citizen, vehicles)
├── ui/           # HUD, BuildMenu, panels, overlays
├── store/        # Zustand stores (buildings, population, economy, services, etc.)
├── stores/       # useSimulationStore (clock)
├── systems/      # Placement, Road, RoadAccess, Pathfinding, CitizenMovement, Traffic, Alert
├── services/     # PersistenceService
├── types/        # BuildTool, ZoneType
├── App.tsx       # Root component
└── main.tsx      # Entry point
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for full detail.

---

## Development

### How it was built

**Phase 1 – Project Setup** — Vite + React + TypeScript; installed Three.js, R3F, Drei, Zustand.

**Phase 2 – 3D Scene Foundation** — R3F Canvas with shadows, camera, sky, lighting, ground, grid, OrbitControls.

**Phase 3 – Mouse Interaction** — Raycasting to ground, grid-aligned tiles, hover preview, click placement.

**Phase 4 – Building System** — Low-poly House, BuildingStore, ghost preview.

**Phase 5 – UI Toolbar** — Tool selection driving placement.

**Phase 6 – Architecture** — Organized into world/scenes/systems/store/ui/hooks/types.

**Phase 7 – Building Tools** — Tree, Rock, rotation, bulldozer, placement validation.

**Phase 8 – Road System** — Drag-to-build, auto-connection, intersections.

**Phase 9 – Zoning** — Shop, Factory, Park with zone types.

**Phase 10 – Road Access** — Cardinal neighbor detection with visual indicators.

**Phase 11 – Inspection** — Select mode, object info, road connections.

**Phase 12 – Simulation Clock** — Day/time, pause, speed control.

**Phase 13 – Stabilization** — Dead code removal, camera drag threshold fix.

**Phase 14+ – Simulation Expansion** — Population, jobs, citizens, visualization, routines, walking, pathfinding, traffic, economy, needs, services, utilities, healthcare, education, safety, events, emergency dispatch, emergency vehicles, demand, production, persistence, dynamic simulation, land value, development, progression, unlocks, activity, and municipal policies. (See [`docs/Changelog.md`](./docs/Changelog.md) for the full history.)

---

## Validation

- TypeScript: `npm run build` (tsc -b) — passes
- Production build: `npm run build` (vite build) — passes
- Known limitations are tracked in [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md)

---

## Known Limitations

- Service coverage uses Euclidean distance, not road-network distance.
- Building upgrades are visual/status only; capacity scaling is not yet wired.
- Civilian vehicles reuse the emergency vehicle model.
- No traffic lights, lane simulation, or collision avoidance.
- No mobile touch support, sound, or multiplayer.

---

## Roadmap

See [`docs/Roadmap.md`](./docs/Roadmap.md). Future work includes advanced citizen AI (migration, aging), deeper service simulation, public transport, banking/economy depth, disasters, and multiple save slots.

---

## Project Structure

```
urbania/
├── docs/                    # Design documents, roadmap, changelog
├── frontend/               # Main Vite + React application
│   ├── src/                # (see Architecture above)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── package.json
├── README.md
├── ARCHITECTURE.md
├── CONTROLS.md
├── DEVELOPMENT_STATUS.md
├── DEVELOPMENT_PROGRESS.md
├── KNOWN_ISSUES.md
└── FIX_REPORT.md
```

---

## Author

**T. Rushendar Reddy**

Email: trushendarreddy@gmail.com

Hyderabad, Telangana

*Built as a learning project and evolving proof-of-concept for browser-based city simulation.*