# Art Style

## Philosophy

Urbania uses a low-poly, colorful art style designed to be performant in the browser while remaining visually engaging. The goal is clarity over realism, with strong color blocking and simple geometry that reads well at any zoom level.

## Color Palette

- **Sky:** Light blue (`#87CEEB`) for a clear, approachable daytime atmosphere.
- **Ground:** Vibrant green (`#6fcf5f`) representing a flat, friendly terrain.
- **Grid Primary:** Medium green (`#4f7f4f`) for individual cell lines.
- **Grid Sections:** Dark green (`#2f5f2f`) for every fifth cell to aid orientation.
- **Hover Tile:** Yellow (`yellow`) with 50% opacity to indicate selection without overwhelming the scene.
- **House Walls:** Warm beige (`#E9D8A6`) for an inviting residential look.
- **House Roof:** Muted red (`#B5423C`) for clear silhouette against the sky.
- **Foundation:** Neutral gray (`#808080`) to ground the building visually.
- **Door:** Dark brown (`#5D4037`) for contrast.
- **Windows:** Light blue (`#87CEFA`) with high opacity for glass effect.
- **Chimney:** Dark gray (`#666666`) for subtle detail.

## Geometry Style

- Buildings use basic box and cone geometries with minimal vertex count.
- No external models or textures are required; all shapes are generated procedurally.
- Buildings are composed of stacked, aligned primitives for a toy-like appearance.
- Shadows are enabled to add depth without additional geometry work.

## UI Style

- Dark semi-transparent toolbar (`rgba(35,35,35,0.9)`) with rounded corners.
- High-contrast buttons with clear active state (`#58B368`) and inactive state (`#ECECEC`).
- Generous spacing and padding for readability.
- Minimal chrome with no unnecessary borders or gradients.

## Lighting

- Single ambient light for base visibility.
- Single directional light for strong, directional shadows and depth.
- Shadow map casting from buildings to ground for grounding feedback.

## Performance Considerations

- Keep polygon count low per building to support hundreds of objects.
- Use transparent materials sparingly and with simple opacity changes.
- Avoid post-processing effects that impact frame rate on lower-end devices.

## Future Considerations

- Introduce procedural color variation for building variety.
- Add simple vertex color or material palette swapping per building type.
- Explore toon shading or outline effects to strengthen the stylized look.
- Consider seasonal color themes for the ground and sky.
