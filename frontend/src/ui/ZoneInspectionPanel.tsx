import useZoneStore from "../store/ZoneStore";
import useCityDemandStore from "../store/CityDemandStore";
import useLandValueStore from "../store/LandValueStore";
import { hasRoadAccess } from "../systems/RoadAccessSystem";
import useBuildingStore from "../store/BuildingStore";
import { getZoneDevelopmentPressure, isZoneEligible } from "../systems/OrganicDevelopmentSystem";

const ZONE_LABELS: Record<string, string> = {
  residential: "Residential Zone",
  commercial: "Commercial Zone",
  industrial: "Industrial Zone",
  park: "Park Zone",
};

const STATE_LABELS: Record<string, string> = {
  zoned: "Zoned",
  developing: "Developing",
  occupied: "Occupied",
};

export default function ZoneInspectionPanel() {
  const zones = useZoneStore((state) => state.zones);
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const setSelectedZoneId = useZoneStore((state) => state.setSelectedZoneId);

  const zone = zones.find((z) => z.id === selectedZoneId);
  if (!zone) return null;

  const buildings = useBuildingStore.getState().buildings;
  const roadAccess = hasRoadAccess(zone.position, buildings);
  const landValue = useLandValueStore
    .getState()
    .getLandValueAtPosition(zone.position);
  const pressure = getZoneDevelopmentPressure(zone.position, zone.zoneType);
  const demandStore = useCityDemandStore.getState();
  const demand =
    zone.zoneType === "residential"
      ? demandStore.residential
      : zone.zoneType === "commercial"
      ? demandStore.commercial
      : zone.zoneType === "industrial"
      ? demandStore.industrial
      : 0;
  const { reason } = isZoneEligible(zone.position, zone.zoneType);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "80px",
        right: "24px",
        width: "280px",
        padding: "16px 20px",
        background: "rgba(12, 12, 16, 0.92)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#F3F4F6",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
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
          marginBottom: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "8px",
        }}
      >
        <span style={{ fontWeight: "600", fontSize: "15px", color: "#F9FAFB" }}>
          {ZONE_LABELS[zone.zoneType] || "Zone"}
        </span>
        <button
          onClick={() => setSelectedZoneId(null)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#9CA3AF",
            borderRadius: "8px",
            padding: "2px 12px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "inherit",
          }}
        >
          ✕ Close
        </button>
      </div>

      <Row label="State" value={STATE_LABELS[zone.state] || zone.state} />
      <Row
        label="Status"
        value={
          zone.state === "developing" ? (
            <span style={{ color: "#FBBF24" }}>Developing…</span>
          ) : (
            <span style={{ color: reason.startsWith("Waiting") ? "#FACC15" : "#4ADE80" }}>
              {reason}
            </span>
          )
        }
      />
      <Row
        label="Demand"
        value={`${Math.round(demand)} (${demand >= 60 ? "High" : demand >= 35 ? "Medium" : "Low"})`}
      />
      <Row label="Dev Pressure" value={Math.round(pressure)} />
      <Row label="Land Value" value={Math.round(landValue)} />
      <Row
        label="Road Access"
        value={
          roadAccess ? (
            <span style={{ color: "#4ADE80" }}>✓ Connected</span>
          ) : (
            <span style={{ color: "#FACC15" }}>✗ Not Connected</span>
          )
        }
      />
      {zone.state !== "occupied" && (
        <Row
          label="Development"
          value={
            <span style={{ color: zone.progress >= 100 ? "#4ADE80" : "#FBBF24" }}>
              {Math.round(zone.progress)}%
            </span>
          }
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
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