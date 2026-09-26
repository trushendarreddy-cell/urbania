# Game Design Document

## Overview

Urbania is a browser-based 3D city-building simulation built with React, TypeScript, Three.js, and React Three Fiber. The player places buildings, roads, zones, and transit on a grid-based terrain, gradually growing a living city with citizens, economy, services, districts, events, and public transportation.

## Core Experience

- The player views an isometric or perspective 3D world from a free-moving camera.
- Buildings are placed by hovering over grid tiles and clicking to confirm.
- A categorized build menu at the bottom of the screen selects the active tool.
- A simulation clock drives citizens, economy, traffic, services, events, and transit; the city persists via save/load.

## Player Goals

- Design an organized, visually appealing city layout.
- Balance residential, commercial, and industrial zones and manage demand.
- Keep citizens happy with services, utilities, low congestion, and transit access.
- Grow the city through progression stages (Village → Metropolis), unlocking buildings.
- Respond to condition-driven city events and manage the municipal budget.

## Controls

- **0–9, h/s/p/f:** Select tools (Select, House, Tree, Rock, Bulldozer, Road, Shop, Factory, Park, utilities, services)
- **Z/X/V:** Zoning tools (Residential/Commercial/Industrial)
- **D:** District paint tool; **B:** Bus Stop
- **R:** Rotate selected ghost by 90 degrees
- **Escape:** Cancel current tool selection
- **Left Click:** Place / select / delete (tool-dependent)
- **Left Click + Drag (>6px):** Orbit camera (drag never places)
- **Scroll:** Zoom in and out

## World

- Flat green terrain plane as the base world.
- Infinite translucent grid overlay for placement guidance.
- Raycasting converts 2D mouse coordinates to 3D world positions on the ground plane.
- Grid coordinates are snapped to integer tile positions for consistent placement.

## Building Types

| Type | Description | Notes |
|------|-------------|-------|
| Residential | House (+ zones developing organically) | Levels 1–3, households of 4 |
| Commercial / Industrial | Shop, Factory | Jobs, production, demand |
| Services | Hospital, School, Police, Fire, Park | Coverage-based citizen services |
| Utilities | Power Plant, Water Plant | Electricity/water capacity & coverage |
| Road | Drag-to-build network | Auto-connects; carries traffic & transit |
| Transit | Bus Stop | Road-adjacent stops served by bus lines |

## Systems

- **Input & Placement:** Raycasting, ghost previews, validation, drag-threshold camera handling.
- **Simulation Clock:** Day/time with pause and 0/1x/2x/4x speeds; all systems derive from it.
- **Population & Citizens:** Households, jobs, daily routines, road-aware walking.
- **Economy & Municipal:** Household/business money, demand, taxes, policies, budget.
- **Services & Utilities:** Coverage-driven needs and happiness.
- **Traffic:** Congestion-aware pathfinding and vehicle spawning on the road graph.
- **Transit:** Stops → validated bus lines → buses on cached routes → city accessibility and derived ridership (no passenger entities yet).
- **Districts & Events:** Painted districts with derived quality; condition-driven city events.
- **Persistence:** Versioned save/load with New City reset.

## Success Criteria

- Smooth performance with hundreds of placed buildings.
- Intuitive placement with clear hover feedback.
- Extensible architecture that supports rapid addition of new building types and systems.
- Enjoyable visual style that encourages creative city design.
