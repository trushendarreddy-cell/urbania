# Urbania Development Status

## Current Version
2.48 — Neighborhood Identity & Local Development

## Current Phase
Active Development

---

## Completed

### Core
- World Foundation (R3F scene, ground, grid, lighting, OrbitControls, sky)
- Grid Building (snapping, hover tile, placement, validation, ghost previews)
- Build Mode (BuildMenu, keyboard shortcuts, R rotation, Escape cancellation)
- Bulldozer, Selection, Inspection
- Day/Night presentation (sky, ambient/directional light, hemisphere light)

### Buildings
- House, Shop, Factory, Park, Tree, Rock, Road
- Hospital, School, Police Station, Fire Station
- Power Plant, Water Plant
- Building levels 1–3 with visual scaling (height/roof per level)

### Roads & Traffic
- Road drag placement with auto-connections (straight, corner, T-junction, intersection)
- Road access detection (cardinal neighbors)
- RoadUsageStore (usage, capacity 5, congestion levels)
- Traffic-aware pathfinding (BFS + congestion penalty)
- Civilian vehicle spawning (max 50), emergency vehicles (Fire Truck, Ambulance, Police Car)
- Vehicle fleet limits per provider (2 each)

### Population & Citizens
- Population & Households (households of 4, active population based on road access)
- Jobs & Employment (Shop: 2 jobs, Factory: 5 jobs; employment/unemployment)
- Citizens (ages, employment status, active/inactive, stable IDs)
- Citizen Visualization (low-poly, color-coded by activity/employment, scale variation)
- Citizen Daily Routines (home/working/leisure via SimulationClock)
- Citizen Movement (road-aware pathfinding, home↔work, congestion-aware speed)

### Economy
- Household money, income, spending, business revenue, costs, profit
- Business status (HEALTHY/WEAK/STRUGGLING)
- Factory production (workers × utility factor × demand)
- Consumer demand (household demand, shop demand, unmet demand)
- Economic health, household financial state
- Municipal budget (treasury, revenue, expenses, net balance)
- Tax rate (low/normal/high) with happiness & demand effects
- City policies (growth/balanced/austerity)
- Service funding controls

### Services & Utilities
- Service architecture (providers with coverage radius)
- Recreation (Park), Healthcare (Hospital), Education (School), Safety (Police), Emergency (Fire)
- Utilities: Electricity (Power Plant), Water (Water Plant) with capacity/coverage
- Needs: housing, food, safety, recreation, healthcare, education
- Happiness derived from needs, with utility/tax/event modifiers
- Service coverage UI and alerts

### Events & Emergencies
- City events (fire, medical, crime) with lifecycle (active → responding → resolved)
- Emergency dispatch (provider selection, road connectivity, pathfinding, traffic-aware ETA)
- Emergency vehicles physically follow routes and return to station
- Event indicators and EventPanel

### Zoning (2.46)
- Vacant zone tiles (Residential/Commercial/Industrial) placed via zoning tools
- Zone states: zoned / developing / occupied
- Organic development driven by demand, road access, land value, dev pressure, progression unlocks
- Initial building level selected from land value
- Development progress per simulation day; notification on completion
- ZoneInspectionPanel explains why a zone is or isn't developing
- Zones persist in save/load; New City clears them

### Districts & Neighborhood Identity (2.47–2.48)
- DistrictStore: named, colored districts with cell lists and specialization
- District tool (key D) paints cells into the active district
- DistrictOverlay renders cell color, selected highlight, and an identity label (name, character, trend, quality)
- DistrictPanel: create/rename/recolor/specialize/delete/paint, profile, quality breakdown, service levels, priority, city-wide summary
- Derived neighborhood character (Emerging/Residential/Commercial/Industrial/Mixed/Civic) from actual building mix
- Development trend (Rapid Growth → Declining) and activity (High/Moderate/Low/None)
- Neighborhood Quality score (0–100) with transparent reasons
- Local service analysis and traffic condition from existing systems
- Throttled district notifications via AlertStore
- Specialization (player intent) shown separately from derived character (reality)
- Districts persist in save/load; New City clears them and resets notifications

### City Systems
- Simulation Clock (day, timeOfDay, pause, speed 0/1/2/4)
- Land Value (road access, services, utilities, happiness, congestion, demand)
- Development Pressure (land value + demand + happiness + road + services + policy)
- Building progression (level upgrades with cooldown/progress)
- City Progression (Village → Town → City → Large City → Metropolis)
- Milestones (10 population/service/economy/happiness milestones)
- Unlock system (buildings unlock by stage)
- City Activity (QUIET/NORMAL/BUSY/PEAK, day/night labels)
- Window illumination (emissive by building type, level, time, activity)

### Persistence & UI
- Save/Load/New City (localStorage, versioned, metadata)
- BuildMenu (categorized, lock indicators)
- HUD (day, time, population, households, money, traffic, activity, stage, municipal)
- ProgressionPanel, MunicipalPanel, CityStats, TrafficPanel, AlertPanel, ServiceOverview
- Land Value / Development Pressure overlays (toggleable)

---

## Partial
- Road ghost preview valid state (minor visual issue during drag)

## Broken / Needs Fixing
- None critical

## Not Yet Implemented (Future)
- Advanced citizen AI, migration, aging, births, deaths
- Education progression, healthcare simulation, crime AI
- Public transport, traffic lights, lane simulation
- Banking, loans, debt, inflation, supply chains
- Natural disasters, building damage
- Multiplayer, mobile touch controls, sound design

---

## Validation
- TypeScript: PASS
- Production build: PASS (chunk size warning only)
- Runtime: functional
- Console: clean

## Last Updated
September 10, 2026