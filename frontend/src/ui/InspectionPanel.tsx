import useBuildingStore from "../store/BuildingStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import { getRoadNeighbors } from "../systems/RoadSystem";
import type { Building } from "../store/BuildingStore";

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
              label="Status"
              value={
                roadAccess ? (
                  <span style={{ color: "#4ADE80" }}>Active</span>
                ) : (
                  <span style={{ color: "#FACC15" }}>Inactive</span>
                )
              }
            />
          </>
        )}
        {jobCount > 0 && (
          <Row
            label="Jobs"
            value={jobCount}
          />
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
