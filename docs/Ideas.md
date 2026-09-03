# Ideas

## Core Concept

A browser-based city-building game where players design and grow a city on a grid-based 3D terrain using intuitive mouse interactions. The focus is on accessibility, low-poly aesthetics, and extensible systems rather than heavy simulation.

## Gameplay Ideas

- **Freeform Placement:** Place buildings anywhere on the grid without strict zoning rules, encouraging creative city layouts.
- **Ghost Preview:** Always show where a building will land before confirming placement to reduce mistakes.
- **Camera Freedom:** Orbit, zoom, and pan around the city to plan from any angle.
- **Incremental Complexity:** Start with simple houses, then introduce roads, services, and population needs over time.
- **Light Simulation:** Track population happiness, traffic flow, and resource availability as abstract metrics rather than deep spreadsheets.
- **Events:** Random city events (festivals, storms, traffic jams) that change how players adapt their layout.
- **Easter Eggs:** Hidden buildings, landmarks, or humor in the UI or world generation.

## Technical Ideas

- **Component-Driven World:** Every object (house, tree, road, rock) is a reusable React component composed of Three.js primitives.
- **Reactive State:** Use Zustand for global city state so any system can read or update the city without prop drilling.
- **Raycasting Pipeline:** Centralize mouse-to-world conversion so all placement tools share one reliable coordinate system.
- **Procedural Details:** Add small randomized variations to buildings (color, roof angle, slight rotation) to make the city feel alive.
- **Performance:** Use instancing or merged geometries when building counts grow large to maintain frame rate.
- **Persistence:** Save city state to localStorage or a backend for later continuation.

## Art Direction

- Low-poly geometry with bold, simple colors.
- Bright, approachable palette rather than realistic textures.
- Clean UI with high-contrast buttons and minimal chrome.
- Animations kept short and snappy (placement pop, hover pulse).

## Future Expansions

- Additional biomes and terrain types.
- Multiplayer city collaboration or competition.
- Scenario-based challenges (build a harbor, manage a disaster).
- Mod support through a plugin system.
