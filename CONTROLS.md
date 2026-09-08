# Controls

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 0 | Select mode (inspect objects) |
| 1 | House (residential) |
| 2 | Tree |
| 3 | Rock |
| 4 | Bulldozer (delete) |
| 5 | Road |
| 6 | Shop (commercial) |
| 7 | Factory (industrial) |
| 8 | Park (public) |
| R | Rotate ghost preview by 90° |
| Escape | Cancel tool selection / close inspection panel |

## Mouse

| Action | Effect |
|--------|--------|
| Left Click (without drag) | Place selected building / bulldoze / select (depending on tool) |
| Left Click + Drag | Orbit camera (if drag > 6px threshold) |
| Right Click + Drag | Orbit camera (OrbitControls default) |
| Scroll | Zoom in/out |

## Simulation Controls (UI)

- **Pause/Resume** button (⏸/▶) toggles simulation advance.
- **Speed** button cycles through 0x (paused), 1x, 2x, 4x.

## Toolbar

- Bottom-center fixed toolbar with buttons for each tool.
- Active tool highlighted with green border.
- Each button displays its keyboard shortcut.

## Interaction Behavior

- **Build mode**: Hover over a tile; ghost preview shows; click to place if valid (green ghost) or invalid (red ghost).
- **Road mode**: Click and drag to draw a straight line; release to place all tiles if all valid.
- **Bulldozer mode**: Hover over an object; click to delete.
- **Select mode**: Click an object to inspect; click empty ground or press Escape to close inspection.
- **Camera drag** (orbit) does not trigger placement or selection (drag threshold of 6px).
