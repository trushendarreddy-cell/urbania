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
- Converted continuous world coordinates to discrete grid tile positions using Math.floor
- Built HoverTile component for cursor-following preview
- Added mousemove and click event listeners on the canvas
- Established coordinate normalization for device pixel ratio compatibility

## 0.3.0 - Building Prototype
- Designed low-poly house model with multiple mesh parts
- Added foundation slab, walls, roof cone, door, windows, and chimney
- Created BuildingStore using Zustand for global building state
- Implemented addBuilding action with timestamp-based unique IDs
- Rendered placed buildings by mapping over store state in the scene

## 0.4.0 - Ghost Preview System
- Added ghost prop to House component for preview mode
- Reduced opacity and adjusted window transparency for ghost state
- Rendered ghost house at hover position alongside placed buildings
- Improved visual feedback loop for placement prediction

## 0.5.0 - UI Toolbar
- Created fixed-position Toolbar component with glass-morphism styling
- Added tool buttons for House, Tree, and Rock with emoji icons
- Connected selected tool state to placement behavior
- Styled toolbar with dark background, rounded corners, and active state highlighting

## 0.6.0 - Architecture and Documentation
- Refined folder structure for scalability
- Added DEVELOPMENT_PROGRESS.md for phase tracking
- Created comprehensive README with project overview, tech stack, and setup instructions
- Added .gitignore to exclude node_modules, dist, and build artifacts
- Removed node_modules from git tracking to reduce repository size

## 0.7.0 - Building Tools
- Added Tree and Rock placement with distinct low-poly models
- Implemented building rotation with R key (90-degree increments)
- Added Bulldozer tool for removing placed buildings
- Created placement validation system with green/red ghost feedback
- Extended BuildTool type to support all building types
- Added keyboard shortcuts for tool selection (1-4)
- Added Escape key to cancel tool selection

## 0.8.0 - Road System
- Added road placement tool with drag-to-build interaction
- Implemented road auto-connection based on neighboring road tiles
- Support for horizontal and vertical road segments
- Road connection types: isolated, straight, corner, T-junction, four-way intersection
- Atomic road placement (entire segment or nothing)
- Road deletion with Bulldozer tool
- Road preview during drag with validity feedback
- Added Road component with lane markings and curb details
- Added RoadSystem for neighbor detection and line generation

## 0.9.0 - Zoning, Road Access, Inspection, Simulation Clock
- Added Shop (commercial), Factory (industrial), and Park (public) buildings with zone types
- ZoneType enum centralizes zoning (residential, commercial, industrial, park)
- Road access detection: `hasRoadAccess` checks cardinal neighbors only
- Inspection panel: Select mode (key 0) to inspect objects; shows type, zone, road access, position, and road connections
- Simulation clock: `useSimulationStore` with day, timeOfDay, pause, speed (0, 1x, 2x, 4x)
- UI overlay for simulation controls (time, day, pause/resume, speed cycle)
- Keyboard shortcuts: 0 for Select, 6-8 for Shop/Factory/Park
- Road access feedback on ghost preview ("ROAD ACCESS ✓" / "NO ROAD ACCESS")

## 1.0.0 - Stabilization and Cleanup
- Removed dead code: MouseSystem.tsx, useBuildMode.ts, game.ts
- Fixed camera drag accidentally placing objects (drag threshold of 6 pixels)
- Updated all documentation to reflect current implementation
- Created DEVELOPMENT_STATUS.md, ROADMAP.md, ARCHITECTURE.md, CONTROLS.md, KNOWN_ISSUES.md
- Project now stable with all core milestones complete (except population, which is future)

## 1.0.1 - Road ghost preview fix
- Fixed road ghost preview not updating validity during drag: per-tile validation now computed on each render pass.

## Current Version - 1.0.1
- Fully functional 3D city-building prototype
- Supports residential, commercial, industrial, park, nature (tree, rock), and road placement
- Road auto-connection with full intersection support
- Road access and inspection
- Simulation clock with day/night cycle and speed control
- Stable interaction with drag threshold to prevent accidental placement
- Ready for future population and economy systems
