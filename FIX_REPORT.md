# Road Ghost Preview Fix Report

## 1. Root Cause
The road ghost preview used a single `isRoadLineValid` boolean computed once per drag, not per tile. As the mouse moved, the preview's validity did not update for individual tiles, only the overall line validity.

## 2. Files Modified
- `frontend/src/scenes/GameScene.tsx` (lines 499–515)

## 3. Exact Fix
Replaced the single `valid={isRoadLineValid}` prop with per-tile validity:
```tsx
const tileValid = canPlaceObject("road", pos, 0, buildings);
<Road valid={tileValid} ... />
```

## 4. Behavior Before
Road ghost preview color stayed static during drag, not reflecting invalid tiles until mouse stopped.

## 5. Behavior After
Each tile in the road preview updates its valid/invalid color immediately as the mouse moves.

## 6. Camera Drag Test
OrbitControls drag does not place roads; threshold check remains intact.

## 7. TypeScript Result
No errors.

## 8. Build Result
Pass (npm run build succeeded).

## 9. Runtime Result
No console errors.

## 10. Console Result
Clean.