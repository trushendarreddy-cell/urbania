# Known Issues

## Minor Visual Issues
- **Road ghost preview**: During road drag, the ghost road tiles may not always show the correct valid/invalid color until the mouse stops moving. This is a minor visual glitch and does not affect placement logic.

## Missing Features (Future)
- No population simulation (planned).
- No economy or resource management (planned).
- No save/load functionality (planned).
- No sound effects (planned).

## No Critical Bugs
- Placement works reliably.
- Bulldozer correctly removes objects.
- Inspection works.
- Camera drag does not accidentally place objects.
- Build passes TypeScript and production build.

## Workarounds
- For road ghost visual glitch, the final placement validity is correctly checked before placing, so invalid segments are never placed.
