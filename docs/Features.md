# Features

## Implemented

- **3D World Rendering:** Three.js scene with sky color, ambient light, and directional shadow-casting light.
- **Ground Plane:** Large green terrain for city placement.
- **Infinite Grid:** Translucent grid overlay for spatial orientation and placement guidance.
- **Orbit Controls:** Smooth camera rotation, zoom, and pan.
- **Mouse Raycasting:** Converts 2D cursor position to 3D tile coordinates on the ground plane.
- **Hover Tile:** Yellow translucent tile preview that follows the cursor across the grid.
- **Ghost Building:** Semi-transparent building preview shown at the hover position before placement.
- **House Model:** Low-poly house composed of foundation, walls, roof, door, windows, and chimney.
- **Shop Model:** Commercial building with sign and windows.
- **Factory Model:** Industrial building with roof and chimneys.
- **Park Model:** Green ground with trees and foliage.
- **Building Placement:** Click to place buildings at grid-aligned positions.
- **State Management:** Zustand store tracks all placed buildings with unique IDs.
- **Reactive Rendering:** Placed buildings are rendered dynamically from store state.
- **UI Toolbar:** Fixed bottom toolbar with tool buttons for all building types.
- **Keyboard Shortcuts:** 0-8 for tool selection, R for rotation, Escape for cancel.
- **Building Rotation:** R key rotates ghost preview by 90-degree increments.
- **Bulldozer Tool:** Click to remove placed buildings and road tiles.
- **Placement Validation:** Green ghost for valid placement, red ghost for invalid (occupied cell).
- **Tree Model:** Low-poly tree with brown trunk and green foliage layers.
- **Rock Model:** Low-poly rock with irregular stone shapes and gray/brown materials.
- **Road Placement:** Drag-to-build road segments with horizontal/vertical support.
- **Road Auto-Connection:** Roads automatically connect to neighboring road tiles.
- **Road Connection Types:** Isolated, straight, corner, T-junction, four-way intersection.
- **Atomic Road Placement:** Entire road segment placed or nothing if any tile is invalid.
- **Zoning:** Buildings have zone types: residential (House), commercial (Shop), industrial (Factory), park (Park).
- **Road Access:** `hasRoadAccess` checks cardinal neighbors (north, south, east, west) for any building.
- **Inspection Panel:** Select mode (key 0) to click objects; panel shows type, zone, road access, position, and road connections.
- **Selection Highlight:** Cyan torus ring around selected object.
- **Simulation Clock:** Day/night cycle with time of day, pause, and speed control (0, 1x, 2x, 4x).
- **Road Access Feedback:** Ghost preview shows "ROAD ACCESS ✓" or "NO ROAD ACCESS" label.
- **Jobs & Employment:** Shop provides 2 jobs, Factory provides 5 jobs; employment/unemployment tracked.
- **Citizens:** Each household has 4 citizens with deterministic ages and employment status (employed/unemployed/inactive).

## Planned

- **Population Simulation:** Households, active population, road-access relationship.
- **City Statistics:** Population, happiness, traffic, economy overview.
- **Building Variants:** Randomized color and dimension variations.
- **Camera Bookmarks:** Save and return to specific city views.
- **Minimap:** Top-down overview of the city layout.
- **Day/Night Lighting:** Dynamic sky and lighting transitions.
- **Weather Effects:** Rain, snow, fog.
- **Save/Load:** Persist city state to localStorage or backend.
- **Undo/Redo:** Revert accidental placements.
- **Sound Effects:** Ambient audio and placement feedback.
