# Urbania

Urbania is a browser-based city simulation built around a simple idea: **a city should behave like a system, not just look like one.**

Instead of stopping at placing buildings on a 3D map, Urbania connects population, jobs, roads, traffic, services, utilities, land value, economy, development, emergencies, districts, and public transport. Changes in one part of the city can affect another.

## What you can do

Build a city from an empty map, then watch it develop over simulation time.

You can:

- place residential, commercial and industrial buildings;
- build roads and services such as hospitals, schools, police and fire stations;
- create districts and zones;
- manage electricity, water and municipal finances;
- watch households, jobs, businesses and traffic respond to the city;
- handle fires, medical incidents and crime through emergency dispatch;
- build public transport lines and inspect derived accessibility and ridership;
- save and load a city and continue the simulation later.

The goal is not to reproduce a commercial city-builder. It is to build a coherent simulation where the systems have understandable rules and can be inspected while they run.

## How the simulation fits together

```text
              City state
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   Population   Economy    Services
       │          │          │
       └──────┬───┴──────┬───┘
              ▼          ▼
            Demand    Land value
                \       /
                 ▼     ▼
                Development
                     │
                     ▼
              Roads + Traffic
                     │
             ┌───────┴────────┐
             ▼                ▼
        Emergencies        Transit
```

Most of these systems are deterministic and state-driven. The simulation clock is the main driver rather than a collection of unrelated random events.

## Systems currently implemented

### City building

Grid-based placement, ghost previews, validation, rotation, roads, zoning and bulldozing form the basic building loop.

### Population and economy

Households have jobs, income, spending and daily routines. Businesses have revenue, costs and production. Municipal finances track revenue, expenses and treasury state.

### Services and utilities

Hospitals, schools, police, fire, parks, power and water affect coverage and the needs of citizens. Service shortages can feed into city conditions and development.

### Roads and traffic

Road connections are validated on the grid. Traffic uses pathfinding with congestion effects, and emergency vehicles choose reachable providers and follow routes through the road network.

### Development

Land value and development pressure are derived from city conditions. Zones can develop into buildings when their requirements are met, and the city progresses through larger stages as it grows.

### Districts and events

Districts provide a way to inspect parts of the city rather than only looking at global statistics. City events are triggered by actual conditions such as traffic pressure, service shortages, development stagnation and budget pressure.

### Public transport

Transit stops and road-connected bus lines can be created and managed. Buses move according to the simulation clock, contribute to road usage, and provide an accessibility layer. Ridership is currently a derived estimate rather than individual passenger entities.

## Architecture

The project uses React Three Fiber for the 3D world and Zustand for simulation state.

```text
frontend/src/
├── scenes/       # Main 3D scene composition
├── world/        # Buildings, roads, citizens, vehicles and terrain
├── ui/            # HUD, menus, panels and overlays
├── store/        # Domain state
├── stores/       # Simulation clock state
├── systems/      # Simulation and interaction systems
├── services/     # Persistence
└── types/        # Shared domain types
```

The important architectural boundary is between **state**, **systems that update state**, and **React components that present it**. More detail is available in `ARCHITECTURE.md`.

## Tech stack

- React 19
- TypeScript
- Vite
- Three.js
- React Three Fiber / Drei
- Zustand
- Oxlint
- npm

## Run locally

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

Lint the project with:

```bash
npm run lint
```

## Current boundaries

Urbania is deliberately explicit about what it does not simulate yet.

- Citizens do not have individual transit boarding/riding/alighting entities.
- Ridership is a deterministic estimate derived from city state.
- Traffic does not model lanes, traffic lights or overtaking.
- Service coverage is not yet based on full road-network travel distance.
- There is no multiplayer or mobile-touch control layer.

These are simulation boundaries, not hidden features.

## Why I built it

Urbania started as a 3D browser experiment and became a way to learn how several interacting systems behave when they share the same state. The interesting engineering work is in the relationships between systems: road access affects movement, movement affects traffic, traffic affects land value, and city conditions influence development and services.

It is still evolving, but the project is intended to be a real simulation rather than a 3D scene with UI placed around it.

## Author

**T. Rushendar Reddy**  
Artificial Intelligence and Machine Learning  
Vignan University, Hyderabad
