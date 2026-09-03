# Changelog

## 0.0.0 - Initial Project Structure

- Created React + TypeScript + Vite project scaffold.
- Configured TypeScript, Vite, and base folder layout.
- Set up Git repository with initial commit.

## 0.0.1 - Engine Initialization

- Integrated Three.js, React Three Fiber, and React Three Drei.
- Created base 3D scene with sky, ambient light, and directional light.
- Added shadow-casting directional light and shadow configuration.
- Set up OrbitControls for camera movement.
- Defined initial camera position and field of view.
- Organized world, scene, system, store, ui, hooks, and types directories.

## 0.1.0 - World Foundation

- Added large green ground plane for terrain.
- Implemented infinite grid overlay using Drei Grid component.
- Configured grid colors, cell sizes, and fade distance.
- Established render pipeline with shadows enabled on Canvas.

## 0.2.0 - Mouse Interaction

- Implemented raycasting from mouse coordinates to ground plane.
- Converted continuous world coordinates to discrete grid tile positions using Math.floor.
- Built HoverTile component for cursor-following preview.
- Added mousemove and click event listeners on the canvas.
- Established coordinate normalization for device pixel ratio compatibility.

## 0.3.0 - Building Prototype

- Designed low-poly house model with multiple mesh parts.
- Added foundation slab, walls, roof cone, door, windows, and chimney.
- Created BuildingStore using Zustand for global building state.
- Implemented addBuilding action with timestamp-based unique IDs.
- Rendered placed buildings by mapping over store state in the scene.

## 0.4.0 - Ghost Preview System

- Added ghost prop to House component for preview mode.
- Reduced opacity and adjusted window transparency for ghost state.
- Rendered ghost house at hover position alongside placed buildings.
- Improved visual feedback loop for placement prediction.

## 0.5.0 - UI Toolbar

- Created fixed-position Toolbar component with glass-morphism styling.
- Added tool buttons for House, Tree, and Rock with emoji icons.
- Connected selected tool state to placement behavior.
- Styled toolbar with dark background, rounded corners, and active state highlighting.

## 0.6.0 - Architecture and Documentation

- Refined folder structure for scalability.
- Added DEVELOPMENT_PROGRESS.md for phase tracking.
- Created comprehensive README with project overview, tech stack, and setup instructions.
- Added .gitignore to exclude node_modules, dist, and build artifacts.
- Removed node_modules from git tracking to reduce repository size.
