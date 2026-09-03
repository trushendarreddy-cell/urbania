# Game Design Document

## Overview

Urbania is a browser-based 3D city-building prototype built with React, TypeScript, Three.js, and React Three Fiber. The player places buildings, roads, and nature objects on a grid-based terrain, gradually growing a functioning city.

## Core Experience

- The player views an isometric or perspective 3D world from a free-moving camera.
- Buildings are placed by hovering over grid tiles and clicking to confirm.
- A toolbar at the bottom of the screen selects the active building type.
- The city is persistent for the session, with all placed buildings rendered in real time.

## Player Goals

- Design an organized, visually appealing city layout.
- Balance residential, commercial, and industrial zones (when implemented).
- Respond to events and citizen needs (future systems).
- Experiment with road networks and traffic flow.

## Controls

- **Left Click:** Place the selected building on the hovered tile.
- **Mouse Move:** Move the hover tile and ghost preview across the grid.
- **Right Click / Drag:** Orbit the camera around the city.
- **Scroll:** Zoom in and out.
- **Toolbar Buttons:** Switch between house, tree, rock, and future tools.

## World

- Flat green terrain plane as the base world.
- Infinite translucent grid overlay for placement guidance.
- Raycasting converts 2D mouse coordinates to 3D world positions on the ground plane.
- Grid coordinates are snapped to integer tile positions for consistent placement.

## Building Types

| Type | Description | Notes |
|------|-------------|-------|
| House | Low-poly residential building | Foundation, walls, roof, door, windows, chimney |
| Tree | Nature object | Planned |
| Rock | Nature object | Planned |

## Systems

- **Input System:** Mouse move and click listeners on the canvas for raycasting and placement.
- **Building System:** Component-based building models with ghost preview support.
- **Store System:** Zustand store tracks placed buildings with unique IDs and positions.
- **Camera System:** Orbit controls for free navigation around the world.
- **UI System:** Overlay toolbar for tool selection.

## Progression

- Phase 1: Core rendering and grid system.
- Phase 2: Mouse interaction and tile detection.
- Phase 3: Basic house placement and state management.
- Phase 4: Toolbar UI and tool switching.
- Phase 5: Advanced building types, roads, and zones.
- Phase 6: Simulation, population, economy, and events.

## Success Criteria

- Smooth 60fps performance with hundreds of placed buildings.
- Intuitive placement with clear hover feedback.
- Extensible architecture that supports rapid addition of new building types and systems.
- Enjoyable visual style that encourages creative city design.
