# Known Issues

## Active Issues
- Road ghost preview valid state may not always update during drag (minor visual issue).
- District overlays render one small mesh per district cell; very large districts may add draw calls.
- District specialization affects organic development pressure but does not yet apply district-level policies.
- Neighborhood development trend is derived from current state only (no historical trend tracking).
- District notifications are throttled by trend/traffic/health transitions but are not yet grouped into a dedicated district feed.
- City events are evaluated once per simulation day; sub-day conditions are not tracked.
- City event consequences are informational and delivered via existing notifications only; no separate simulation modifiers were introduced.
- Civilian vehicles have no dedicated 3D model (rendered using emergency vehicle model).
- Building upgrades (levels 2–3) are visual/status only; capacity/economy scaling not yet wired.
- Progress toward next city stage is based on population ratio only (simplified).
- Autosave interval constant is defined but autosave is not yet wired to a timer.
- Buses from different lines can overlap on shared road cells (no inter-bus spacing or overtaking).
- Transit route recomputation runs on each simulation tick; results are cached per line but recomputation could be made fully event-driven.
- Production bundle is ~1.3 MB minified (Three.js-dominated); code-splitting would reduce the initial load.

## Known Limitations
- Service coverage uses Euclidean distance (not road-network distance).
- Building activity state (inspection) is derived from window intensity, not occupancy.
- Demand allocation uses city-center proximity rather than per-household distance.
- No traffic lights, lane simulation, or vehicle collision avoidance.
- **Passenger entities, boarding animations, and individual citizen transit trips are NOT implemented.** Ridership is a deterministic derived estimate (accessibility pools × commute patterns × service level); citizens do not board specific buses.
- Transit accessibility uses road-walkable distance (BFS ≤ 6 road cells) from a building's nearest road cell, not door-to-door paths.
- Stop dwell times are fixed constants; no timetables, fares, or transit policies.
- No mobile touch support.

## Fixed
- Camera drag accidentally placing objects (drag threshold of 6px).
- Road ghost preview not updating validity during drag (partially addressed).
- Dead code removed (MouseSystem.tsx, useBuildMode.ts, game.ts).
- LandValue/Development overlays mounted outside the R3F Canvas crashed the app at startup (black screen); overlays now render inside the Canvas (2.52).
- TrafficPanel/AlertPanel selectors returning fresh arrays caused an infinite render loop; selectors now return stable state (2.52).
- Buses previously never reversed at route endpoints and only dwelled at terminals; they now dwell at every stop and reverse correctly (2.53).
- Deleting a line previously left stale buses until the next tick; buses are now dropped immediately and reconstructed on load (2.53).

## Missing Features (Future)
- Advanced citizen AI, migration, aging, births, deaths
- Education progression, healthcare simulation, crime AI
- Individual citizen transit trips (boarding, riding, alighting) and transit fares/policies
- Traffic lights, lane simulation
- Banking, loans, debt, inflation, supply chains
- Natural disasters, building damage
- Multiple save slots, export/import
- Sound effects and background music
- Multiplayer

## No Critical Bugs
- Placement works reliably.
- Bulldozer correctly removes objects.
- Inspection works.
- Camera drag does not accidentally place objects.
- Build passes TypeScript and production build.
- Population, households, jobs, and economy track correctly.
- Save/load and New City function.