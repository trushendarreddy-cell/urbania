# Features

## Implemented

- **3D World Rendering:** Full Three.js scene with sky color, ambient light, and directional shadow-casting light.
- **Ground Plane:** Large green terrain for city placement.
- **Infinite Grid:** Translucent grid overlay for spatial orientation and placement guidance.
- **Orbit Controls:** Smooth camera rotation, zoom, and pan.
- **Mouse Raycasting:** Converts 2D cursor position to 3D tile coordinates on the ground plane.
- **Hover Tile:** Yellow translucent tile preview that follows the cursor across the grid.
- **Ghost Building:** Semi-transparent building preview shown at the hover position before placement.
- **House Model:** Low-poly house composed of foundation, walls, roof, door, windows, and chimney.
- **Building Placement:** Click to place buildings at grid-aligned positions.
- **State Management:** Zustand store tracks all placed buildings with unique IDs.
- **Reactive Rendering:** Placed buildings are rendered dynamically from store state.
- **UI Toolbar:** Fixed bottom toolbar with tool buttons for selecting building types.

## Planned

- **Tree and Rock Models:** Additional nature building types with distinct geometry and materials.
- **Road Placement:** Click-to-place road segments with auto-connection logic.
- **Zone System:** Residential, commercial, and industrial zoning overlays.
- **Building Variants:** Randomized color and dimension variations for visual diversity.
- **Demolish Tool:** Remove placed buildings with a click.
- **Camera Bookmarks:** Save and return to specific city views.
- **Minimap:** Top-down overview of the city layout.
- **Statistics Panel:** Population, happiness, traffic, and economy overview.
- **Day/Night Cycle:** Dynamic lighting and sky color changes over time.
- **Weather Effects:** Rain, snow, and fog systems.
- **Save/Load:** Persist city state to localStorage or backend storage.
- **Undo/Redo:** Revert accidental placements or design decisions.
- **Sound Effects:** Ambient audio and placement feedback sounds.
