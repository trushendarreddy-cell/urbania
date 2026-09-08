# Urbania

**Urbania** is an interactive 3D city-building prototype built with React, TypeScript, and Three.js. It evolved into a voxel-style world where you can place residential, commercial, industrial, and park buildings, trees, rocks, and roads on a grid-based terrain using mouse clicks and keyboard shortcuts.

---

## What is Urbania?

Urbania is a browser-based city builder running entirely in the browser using **React Three Fiber**. It renders a low-poly 3D world with:

- A large green terrain plane
- A translucent grid for placement guidance
- Mouse-driven raycasting to detect tile positions
- A ghost/preview building system that follows the cursor
- Click-to-place mechanics for buildings, trees, rocks, and roads
- A floating UI toolbar for selecting building tools
- Orbit controls for camera navigation
- Road placement with drag-to-build and auto-connection
- Building rotation with keyboard shortcuts
- Bulldozer tool for removing placed objects
- Placement validation with green/red ghost feedback
- **Zoning** – residential (House), commercial (Shop), industrial (Factory), and park (Park)
- **Road access** detection for buildings (cardinal neighbors only)
- **Inspection panel** showing object details and road connections
- **Simulation clock** with day/night cycle, pause, and speed control
- **Jobs & Employment** – Shop provides 2 jobs, Factory provides 5 jobs; employment/unemployment tracked
- **Citizens** – each household has 4 citizens with ages and employment status

The project is a **prototype** — a proving ground for 3D rendering, state management, and interactive building mechanics that will eventually expand into a full city simulation.

---

## Why am I building this?

I wanted to explore how modern web technologies can be used to build immersive 3D experiences without requiring heavy game engines like Unity or Unreal.

This project is my way of learning and demonstrating:
1. **Real-time 3D rendering** in the browser using Three.js and React Three Fiber
2. **Declarative 3D scene composition** using React components
3. **State management** for game entities using Zustand
4. **Mouse interaction in 3D space** using raycasting
5. **Scalable architecture** separating world, scene, systems, store, and UI
6. **Low-poly aesthetics** as a performance-friendly art style

---

## How I built this

### Phase 1 – Project Setup
- Created with **Vite + React + TypeScript**
- Installed Three.js, React Three Fiber, Drei, and Zustand

### Phase 2 – 3D Scene Foundation
- R3F Canvas with shadows, camera, and sky color
- Ambient and directional lighting
- Large ground plane and infinite grid
- OrbitControls for camera movement

### Phase 3 – Mouse Interaction
- Raycaster projects mouse coordinates onto the ground plane
- Grid-aligned tile positions using `Math.floor`
- HoverTile component (yellow translucent plane)
- Click listeners for placement

### Phase 4 – Building System
- Low-poly House with foundation, walls, roof, door, windows, chimney
- Zustand store (`BuildingStore`) for placed buildings
- Ghost/preview building with reduced opacity

### Phase 5 – UI Toolbar
- Fixed-position toolbar with tool buttons
- Glass-morphism styling
- Tool selection drives placement behavior

### Phase 6 – Architecture
- Code organized into `world/`, `scenes/`, `systems/`, `store/`, `ui/`, `hooks/`, `types/`

### Phase 7 – Building Tools Expansion
- Added Tree and Rock placement
- Building rotation with R key
- Bulldozer tool for removal
- Placement validation with green/red feedback

### Phase 8 – Road System
- Road placement with drag-to-build
- Auto-connection to neighboring road tiles
- Straight, corner, T-junction, and four-way intersections
- Atomic road placement (all or nothing)

### Phase 9 – Zoning and Additional Buildings
- Added Shop (commercial), Factory (industrial), Park (public)
- Zone types centralized in `ZoneType` enum
- Each building type gets appropriate zone assignment

### Phase 10 – Road Access
- `hasRoadAccess` function checks cardinal neighbors only (north, south, east, west)
- Visual indicator on buildings and ghost preview

### Phase 11 – Inspection Panel
- Select mode (key 0) to click objects
- Panel shows type, zone, road access, position
- For roads, shows north/south/east/west connections
- Escape closes panel

### Phase 12 – Simulation Clock
- Zustand store (`useSimulationStore`) manages day, time of day, pause, speed
- Speeds: 0 (paused), 1x, 2x, 4x
- AdvanceTime updates time and day rollover
- UI overlay shows time, day, pause button, speed button

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

## Controls

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
| R | Rotate ghost by 90° |
| Escape | Cancel selection / close inspection |
| Left Click | Place / select / delete (context-dependent) |
| Mouse Drag | Orbit camera |
| Scroll | Zoom in/out |

Additional simulation controls (via UI):
- Pause/Resume (▶/⏸)
- Cycle speed (1x, 2x, 4x)
| R | Rotate ghost by 90° |
| Escape | Cancel selection / close inspection |
| Left Click | Place / select / delete (context-dependent) |
| Mouse Drag | Orbit camera |
| Scroll | Zoom in/out |

Additional simulation controls (via UI):
- Pause/Resume (▶/⏸)
- Cycle speed (1x, 2x, 4x)

---

## Project Structure

```
urbania/
├── docs/                    # Design documents, ideas, roadmap
├── frontend/               # Main Vite + React application
│   ├── src/
│   │   ├── scenes/         # GameScene composition & interaction
│   │   ├── world/          # 3D objects (Ground, Grid, House, Shop, Factory, Park, Road, Tree, Rock)
│   │   ├── ui/             # Toolbar, InspectionPanel, SimulationClock
│   │   ├── store/          # BuildingStore (Zustand)
│   │   ├── stores/         # useSimulationStore (Zustand)
│   │   ├── systems/        # PlacementSystem, RoadSystem, RoadAccessSystem
│   │   ├── types/          # BuildTool, ZoneType
│   │   └── hooks/          # Custom hooks (useBuildMode removed, now unused)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── package.json
└── README.md
```

---

## What's Next?

See [`docs/Roadmap.md`](./docs/Roadmap.md) for planned features:
- Population simulation
- Economy and resource management
- AI-assisted urban planning
- Events and Easter eggs
- Save/load
- And more

---

## Author

**T. Rushendar Reddy**

Email: trushendarreddy@gmail.com

Hyderabad, Telangana

*Built as a learning project and proof-of-concept for browser-based city simulation.*
