# Urbania

**Urbania** is an interactive 3D city-building prototype built with React, TypeScript, and Three.js. It started as a blank Vite project and evolved into a voxel-style world where you can place buildings, trees, and rocks on a grid-based terrain using mouse clicks.

---

## What is Urbania?

Urbania is a browser-based city builder running entirely in the browser using **React Three Fiber**. It renders a low-poly 3D world with:

- A large green terrain plane
- A translucent grid for placement guidance
- Mouse-driven raycasting to detect tile positions
- A ghost/preview building system that follows the cursor
- Click-to-place mechanics for houses, trees, and rocks
- A floating UI toolbar for selecting building tools
- Orbit controls for camera navigation around the city
- Road placement with drag-to-build and auto-connection
- Building rotation with keyboard shortcuts
- Bulldozer tool for removing placed objects
- Placement validation with green/red ghost feedback

The project is a **prototype** — a proving ground for 3D rendering, state management, and interactive building mechanics that will eventually expand into a full city simulation.

---

## Why am I building this?

I wanted to explore how modern web technologies can be used to build immersive 3D experiences without requiring heavy game engines like Unity or Unreal.

This project is my way of learning and demonstrating:

1. **Real-time 3D rendering** in the browser using Three.js and React Three Fiber
2. **Declarative 3D scene composition** using React components instead of imperative Three.js code
3. **State management** for game entities (placed buildings) using Zustand
4. **Mouse interaction in 3D space** using raycasting and coordinate projection
5. **Scalable architecture** separating world, scene, systems, store, and UI concerns
6. **Low-poly aesthetics** as a performance-friendly art style for web games

Ultimately, Urbania is a playground for experimenting with city-building mechanics, AI-driven urban planning, road networks, simulation systems, and gameplay events — all inside a single web app.

---

## How I built this

### Phase 1 — Project Setup
- Created the project with **Vite + React + TypeScript**
- Installed core dependencies: Three.js, React Three Fiber, Drei, and Zustand

### Phase 2 — 3D Scene Foundation
- Set up the R3F `<Canvas>` with shadows, camera, and sky
- Added ambient and directional lighting for depth
- Created a large ground plane and an infinite grid overlay
- Integrated `<OrbitControls>` for smooth camera movement

### Phase 3 — Mouse Interaction
- Implemented a raycaster that projects mouse coordinates onto the ground plane
- Converted world coordinates to grid-aligned tile positions using `Math.floor`
- Built a `<HoverTile>` component that renders a translucent yellow square under the cursor
- Added click listeners to capture building placement events

### Phase 4 — Building System
- Designed a `<House>` component using low-poly geometry (foundation, walls, roof, door, windows, chimney)
- Created a Zustand store (`BuildingStore`) to track placed buildings with unique IDs
- Rendered placed buildings by mapping over the store state inside the scene
- Implemented a **ghost/preview building** that shows a semi-transparent version of the building at the hover position before placement

### Phase 5 — UI Toolbar
- Built a fixed-position toolbar with tool buttons (House, Tree, Rock)
- Connected toolbar selection to scene state so the active tool drives placement behavior
- Styled with glass-morphism inspired dark backgrounds and rounded buttons

### Phase 6 — Architecture
- Organized code into dedicated directories:
  - `world/` — 3D objects (Ground, Grid, House, HoverTile, Tree, Rock, Road)
  - `scenes/` — Main scene composition and raycasting logic
  - `store/` — Zustand state management
  - `ui/` — Overlay interfaces
  - `systems/` — Input and game systems (PlacementSystem, RoadSystem)
  - `hooks/` — Reusable React hooks
  - `types/` — TypeScript definitions

### Phase 7 — Building Tools
- Added Tree and Rock placement with distinct low-poly models
- Implemented building rotation with R key (90-degree increments)
- Added Bulldozer tool for removing placed buildings
- Created placement validation system with green/red ghost feedback

### Phase 8 — Road System
- Added road placement tool with drag-to-build interaction
- Implemented road auto-connection based on neighboring road tiles
- Support for horizontal and vertical road segments
- Road connection types: isolated, straight, corner, T-junction, four-way intersection
- Atomic road placement (entire segment or nothing)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Frontend Framework** | React 19 |
| **Language** | TypeScript |
| **Build Tool** | Vite |
| **3D Engine** | Three.js |
| **React 3D Renderer** | React Three Fiber |
| **3D Utilities** | React Three Drei |
| **State Management** | Zustand |
| **Linting** | Oxlint |
| **Package Manager** | npm |

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
| 1 | Select House tool |
| 2 | Select Tree tool |
| 3 | Select Rock tool |
| 4 | Select Bulldozer tool |
| 5 | Select Road tool |
| R | Rotate selected ghost by 90 degrees |
| Escape | Cancel current tool selection |
| Left Click | Place selected building or delete with Bulldozer |
| Mouse Drag | Orbit camera (with OrbitControls) |
| Scroll | Zoom in/out |

---

## Project Structure

```
urbania/
├── docs/                    # Design documents, ideas, roadmap
├── frontend/               # Main Vite + React application
│   ├── src/
│   │   ├── scenes/         # Game scene composition & raycasting
│   │   ├── world/          # 3D objects (Ground, Grid, House, Tree, Rock, Road)
│   │   ├── ui/             # Toolbar and overlay components
│   │   ├── store/          # Zustand state management
│   │   ├── systems/        # PlacementSystem, RoadSystem, MouseSystem
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── assets/         # Images and static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── node_modules/           # Root-level dependencies
├── package.json            # Root package manifest
└── README.md
```

---

## What's Next?

See [`docs/Roadmap.md`](./docs/Roadmap.md) for planned features including:

- Roads and zoning
- Nature systems (trees, water, parks)
- Population simulation
- Economy and resource management
- AI urban planning assistance
- Events and Easter eggs

---

## Author

**T. Rushendar Reddy**

Email: trushendarreddy@gmail.com

Hyderabad, Telangana

*Built as a learning project and proof-of-concept for browser-based city simulation.*
