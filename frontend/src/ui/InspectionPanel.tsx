import useBuildingStore from "../store/BuildingStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import { getRoadNeighbors } from "../systems/RoadSystem";
import type { Building } from "../store/BuildingStore";
import { useSimulationStore } from "../stores/useSimulationStore";
import { getCitizenActivity } from "../systems/CitizenActivitySystem";
import useRoadUsageStore, { getCongestionLevel, ROAD_CAPACITY } from "../store/RoadUsageStore";
import useEconomyStore from "../store/EconomyStore";
import useNeedsStore from "../store/NeedsStore";
import useServiceStore from "../store/ServiceStore";
import useUtilityStore from "../store/UtilityStore";
// import useEventStore from "../store/EventStore"; // not used currently

import usePopulationStore from "../store/PopulationStore";

function getObjectInfo(building: Building) {
  switch (building.type) {
    case "shop":
      return {
        name: "Commercial Shop",
        type: "Shop",
        zone: building.zoneType ?? "commercial",
        showRoadAccess: true,
        showConnections: false,
        showHousehold: false,
        jobCount: 2,
      };
    case "factory":
      return {
        name: "Industrial Factory",
        type: "Factory",
        zone: building.zoneType ?? "industrial",
        showRoadAccess: true,
        showConnections: false,
        showHousehold: false,
        jobCount: 5,
      };
    case "park":
      return {
        name: "City Park",
        type: "Park",
        zone: building.zoneType ?? "park",
        showRoadAccess: true,
        showConnections: false,
        showHousehold: false,
        jobCount: 0,
      };
    case "tree":
      return {
        name: "Tree",
        type: "Nature",
        showRoadAccess: false,
        showConnections: false,
        showHousehold: false,
        jobCount: 0,
      };
    case "rock":
      return {
        name: "Rock",
        type: "Nature",
        showRoadAccess: false,
        showConnections: false,
        showHousehold: false,
        jobCount: 0,
      };
    case "road":
      return {
        name: "Road",
        type: "Infrastructure",
        showRoadAccess: false,
        showConnections: true,
        showHousehold: false,
        jobCount: 0,
      };
    case "house":
    default:
      return {
        name: "Residential House",
        type: "House",
        zone: building.zoneType ?? "residential",
        showRoadAccess: true,
        showConnections: false,
        showHousehold: true,
        jobCount: 0,
      };
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ICONS: Record<string, string> = {
  house: "🏠",
  shop: "🏪",
  factory: "🏭",
  park: "🌳",
  tree: "🌲",
  rock: "🪨",
  road: "🛣️",
};

export default function InspectionPanel() {
  const buildings = useBuildingStore(
    (state) => state.buildings
  );
  const selectedObjectId = useBuildingStore(
    (state) => state.selectedObjectId
  );
  const setSelectedObjectId = useBuildingStore(
    (state) => state.setSelectedObjectId
  );

  const building =
    selectedObjectId !== null
      ? buildings.find((b) => b.id === selectedObjectId)
      : null;

  if (!building) return null;

  const info = getObjectInfo(building);
  const roadAccess = info.showRoadAccess
    ? hasRoadAccess(building.position, buildings)
    : null;
  const connections = info.showConnections
    ? getRoadNeighbors(building.position, buildings)
    : null;
  const household = info.showHousehold
    ? usePopulationStore.getState().households.find(h => h.buildingId === building.id)
    : null;
  const householdPop = household ? household.population : null;
  const jobCount = info.jobCount || 0;
  const timeOfDay = useSimulationStore((state) => state.timeOfDay);
  const citizensForHousehold = household
    ? usePopulationStore.getState().citizens.filter(c => c.householdId === household.id)
    : [];
  const householdMoney = household ? useEconomyStore.getState().getHouseholdMoney(household.id) : 0;
  // For shops/factories, get business revenue
  const revenue = (building.type === 'shop' || building.type === 'factory') 
    ? useEconomyStore.getState().businessRevenue[building.id] || 0 
    : null;
  // For park, show service info
  const serviceInfo = (building.type === 'park' || building.type === 'hospital' || building.type === 'school' || building.type === 'police_station' || building.type === 'fire_station') ? (() => {
    let serviceType: 'recreation' | 'healthcare' | 'education' | 'safety' | 'emergency' = 'recreation';
    if (building.type === 'park') serviceType = 'recreation';
    else if (building.type === 'hospital') serviceType = 'healthcare';
    else if (building.type === 'school') serviceType = 'education';
    else if (building.type === 'police_station') serviceType = 'safety';
    else if (building.type === 'fire_station') serviceType = 'emergency';
    const providers = useServiceStore.getState().getProvidersForService(serviceType);
    const provider = providers.find(p => p.buildingId === building.id);
    if (provider) {
      const householdsServed = useServiceStore.getState().getHouseholdsServed(building.id);
      const citizensServed = useServiceStore.getState().getCitizensServed(building.id);
      const serviceName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
      return { serviceName, radius: provider.radius, householdsServed, citizensServed };
    }
    return null;
  })() : null;

  // Utility status for building
  const utilityStatus = useUtilityStore.getState().getUtilityStatus(building.id);
  // For utility providers, show provider info
  const providerInfo = (building.type === 'power_plant' || building.type === 'water_plant') 
    ? useUtilityStore.getState().getProviderInfo(building.id) 
    : null;

  // For events, show dispatch info if selected (placeholder)
  // const eventInfo = null; // not used yet
  // For houses, get average happiness of citizens
  const avgHappiness = (() => {
    if (!household || citizensForHousehold.length === 0) return null;
    const needsStore = useNeedsStore.getState();
    let sum = 0, count = 0;
    for (const c of citizensForHousehold) {
      const needs = needsStore.getNeeds(c.id);
      if (needs) { sum += needs.happiness; count++; }
    }
    return count > 0 ? sum / count : null;
  })();

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "240px",
        padding: "14px 16px",
        background: "rgba(24, 24, 27, 0.92)",
        borderRadius: "12px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#F3F4F6",
        fontFamily: "monospace",
        fontSize: "13px",
        zIndex: 10,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "8px",
        }}
      >
        <span style={{ fontWeight: "700", fontSize: "14px" }}>
          OBJECT INFORMATION
        </span>
        <button
          onClick={() => setSelectedObjectId(null)}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#9CA3AF",
            borderRadius: "6px",
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          ✕ Close
        </button>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontSize: "22px" }}>
          {ICONS[building.type ?? "house"]}
        </span>{" "}
        <span style={{ fontWeight: "600" }}>{info.name}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Row label="Type" value={info.type} />
        <Row label="Zone" value={capitalize(info.zone ?? "")} />

        {info.showRoadAccess && (
          <Row
            label="Road Access"
            value={
              roadAccess ? (
                <span style={{ color: "#4ADE80" }}>
                  ✓ Connected
                </span>
              ) : (
                <span style={{ color: "#FACC15" }}>
                  ✗ Not Connected
                </span>
              )
            }
          />
        )}
        {info.showHousehold && (
          <>
            <Row
              label="Household"
              value={
                householdPop !== null ? `${householdPop} people` : "None"
              }
            />
            <Row
              label="Citizens"
              value={
                household ? (
                  <span>{citizensForHousehold.length}</span>
                ) : "0"
              }
            />
            <Row
              label="Status"
              value={
                roadAccess ? (
                  <span style={{ color: "#4ADE80" }}>Active</span>
                ) : (
                  <span style={{ color: "#FACC15" }}>Inactive</span>
                )
              }
            />
            <Row
              label="Money"
              value={
                household ? (
                  <span>₹{Math.round(householdMoney)}</span>
                ) : "0"
              }
            />
            {avgHappiness !== null && (
              <Row
                label="Happiness"
                value={
                  <span style={{ color: avgHappiness >= 60 ? '#4ADE80' : avgHappiness >= 40 ? '#FBBF24' : '#EF4444' }}>
                    {Math.round(avgHappiness)}%
                  </span>
                }
              />
            )}
            {citizensForHousehold.length > 0 && (
              <div style={{ marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "4px" }}>
                <div style={{ color: "#9CA3AF", fontSize: "11px", marginBottom: "2px" }}>Citizens:</div>
                {citizensForHousehold.map((c) => {
                  const activity = getCitizenActivity(c.employmentStatus, c.age, timeOfDay);
                  const needs = useNeedsStore.getState().getNeeds(c.id);
                  return (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "1px 0" }}>
                      <span>Age {c.age} {needs ? `😊${Math.round(needs.happiness)}%` : ''}</span>
                      <span>
                        {c.employmentStatus === 'employed' && 'Employed'}
                        {c.employmentStatus === 'unemployed' && 'Unemployed'}
                        {c.employmentStatus === 'inactive' && 'Inactive'}
                        {' · '}
                        {activity.charAt(0).toUpperCase() + activity.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {jobCount > 0 && (
          <Row
            label="Jobs"
            value={jobCount}
          />
        )}
        {revenue !== null && (
          <Row
            label="Revenue"
            value={`₹${Math.round(revenue)}`}
          />
        )}
        {serviceInfo && (
          <>
            <Row
              label="Service"
              value={serviceInfo.serviceName}
            />
            <Row
              label="Coverage Radius"
              value={`${serviceInfo.radius} tiles`}
            />
            <Row
              label="Households Served"
              value={serviceInfo.householdsServed}
            />
            <Row
              label="Citizens Served"
              value={serviceInfo.citizensServed}
            />
          </>
        )}

        {/* Utility status for buildings that consume utilities */}
        {(building.type === 'house' || building.type === 'shop' || building.type === 'factory') && utilityStatus && (
          <>
            <Row
              label="⚡ Electricity"
              value={
                utilityStatus.electricity ? (
                  <span style={{ color: '#4ADE80' }}>Connected</span>
                ) : (
                  <span style={{ color: '#F87171' }}>Unconnected</span>
                )
              }
            />
            <Row
              label="💧 Water"
              value={
                utilityStatus.water ? (
                  <span style={{ color: '#4ADE80' }}>Connected</span>
                ) : (
                  <span style={{ color: '#F87171' }}>Unconnected</span>
                )
              }
            />
          </>
        )}

        {/* Utility provider info */}
        {providerInfo && (
          <>
            <Row
              label="Utility"
              value={providerInfo.type === 'electricity' ? '⚡ Electricity' : '💧 Water'}
            />
            <Row
              label="Capacity"
              value={providerInfo.capacity}
            />
            <Row
              label="Used"
              value={providerInfo.used}
            />
            <Row
              label="Available"
              value={providerInfo.available}
            />
          </>
        )}

        {info.showConnections && connections && (
          <>
            <Row
              label="North"
              value={
                connections.north ? (
                  <span style={{ color: "#4ADE80" }}>✓</span>
                ) : (
                  <span style={{ color: "#F87171" }}>✗</span>
                )
              }
            />
            <Row
              label="South"
              value={
                connections.south ? (
                  <span style={{ color: "#4ADE80" }}>✓</span>
                ) : (
                  <span style={{ color: "#F87171" }}>✗</span>
                )
              }
            />
            <Row
              label="East"
              value={
                connections.east ? (
                  <span style={{ color: "#4ADE80" }}>✓</span>
                ) : (
                  <span style={{ color: "#F87171" }}>✗</span>
                )
              }
            />
            <Row
              label="West"
              value={
                connections.west ? (
                  <span style={{ color: "#4ADE80" }}>✓</span>
                ) : (
                  <span style={{ color: "#F87171" }}>✗</span>
                )
              }
            />
          </>
        )}

        {building.type === "road" && (
          <>
            <Row
              label="Users"
              value={
                <span>{useRoadUsageStore.getState().getUsage(`${Math.round(building.position[0])},${Math.round(building.position[2])}`)}</span>
              }
            />
            <Row
              label="Capacity"
              value={ROAD_CAPACITY}
            />
            <Row
              label="Congestion"
              value={
                (() => {
                  const key = `${Math.round(building.position[0])},${Math.round(building.position[2])}`;
                  const usage = useRoadUsageStore.getState().getUsage(key);
                  const level = getCongestionLevel(usage);
                  const colors: Record<string, string> = {
                    low: '#4ADE80',
                    moderate: '#FBBF24',
                    high: '#F97316',
                    overloaded: '#EF4444'
                  };
                  return (
                    <span style={{ color: colors[level] }}>
                      {level.toUpperCase()} ({Math.round((usage / ROAD_CAPACITY) * 100)}%)
                    </span>
                  );
                })()
              }
            />
          </>
        )}

        <Row
          label="Position"
          value={`${building.position[0]}, ${building.position[1]}, ${building.position[2]}`}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "2px 0",
      }}
    >
      <span style={{ color: "#9CA3AF" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
