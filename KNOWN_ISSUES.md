# Known Issues

## Active Issues
- Road ghost preview valid state may not always update during drag (minor visual issue).
- Civilian vehicles have no dedicated 3D model (rendered using emergency vehicle model).
- Building upgrades (levels 2–3) are visual/status only; capacity/economy scaling not yet wired.
- Progress toward next city stage is based on population ratio only (simplified).
- Autosave interval constant is defined but autosave is not yet wired to a timer.

## Known Limitations
- Service coverage uses Euclidean distance (not road-network distance).
- Building activity state (inspection) is derived from window intensity, not occupancy.
- Demand allocation uses city-center proximity rather than per-household distance.
- No traffic lights, lane simulation, or vehicle collision avoidance.
- No mobile touch support.

## Fixed
- Camera drag accidentally placing objects (drag threshold of 6px).
- Road ghost preview not updating validity during drag (partially addressed).
- Dead code removed (MouseSystem.tsx, useBuildMode.ts, game.ts).

## Missing Features (Future)
- Advanced citizen AI, migration, aging, births, deaths
- Education progression, healthcare simulation, crime AI
- Public transport, traffic lights, lane simulation
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