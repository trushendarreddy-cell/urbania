import { useState } from "react";
import useDistrictStore, {
  SPECIALIZATION_LABELS,
  DISTRICT_COLORS,
  MAX_DISTRICTS,
  type DistrictSpecialization,
} from "../store/DistrictStore";

const SPECIALIZATIONS: DistrictSpecialization[] = [
  "general",
  "residential",
  "commercial",
  "industrial",
  "mixed",
];

const SERVICE_COLORS: Record<string, string> = {
  Good: "#4ADE80",
  Fair: "#FBBF24",
  Poor: "#EF4444",
  None: "#6B7280",
};

export default function DistrictPanel() {
  const districts = useDistrictStore((state) => state.districts);
  const stats = useDistrictStore((state) => state.stats);
  const selectedDistrictId = useDistrictStore((state) => state.selectedDistrictId);
  const activeDistrictId = useDistrictStore((state) => state.activeDistrictId);
  const districtMode = useDistrictStore((state) => state.districtMode);
  const setSelectedDistrictId = useDistrictStore((s) => s.setSelectedDistrictId);
  const setActiveDistrictId = useDistrictStore((s) => s.setActiveDistrictId);
  const createDistrict = useDistrictStore((s) => s.createDistrict);
  const renameDistrict = useDistrictStore((s) => s.renameDistrict);
  const setSpecialization = useDistrictStore((s) => s.setSpecialization);
  const setColor = useDistrictStore((s) => s.setColor);
  const deleteDistrict = useDistrictStore((s) => s.deleteDistrict);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const district = districts.find((d) => d.id === selectedDistrictId) ?? null;

  if (!districtMode && !district) return null;

  const stat = district ? stats[district.id] : undefined;

  const allStats = districts
    .map((d) => ({ district: d, stat: stats[d.id] }))
    .filter((x) => x.stat);

  const healthy = allStats.filter((x) => x.stat.health === "Thriving" || x.stat.health === "Good").length;
  const needsAttention = allStats.filter((x) => x.stat.health === "Needs Attention").length;
  const declining = allStats.filter((x) => x.stat.trend === "Declining" || x.stat.trend === "Stagnating").length;
  const fastestGrowing = [...allStats].sort((a, b) => b.stat.avgDevPressure - a.stat.avgDevPressure)[0];
  const highestQuality = [...allStats].sort((a, b) => b.stat.quality - a.stat.quality)[0];
  const mostTraffic = [...allStats].sort((a, b) => b.stat.traffic - a.stat.traffic)[0];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "80px",
        right: "24px",
        width: "310px",
        maxHeight: "calc(100vh - 160px)",
        overflowY: "auto",
        padding: "16px 20px",
        background: "rgba(12, 12, 16, 0.92)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#F3F4F6",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        zIndex: 11,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontWeight: "600", fontSize: "15px", color: "#F9FAFB" }}>
          {district ? district.name.toUpperCase() : "Districts"}
        </span>
        {district && (
          <button onClick={() => setSelectedDistrictId(null)} style={closeBtn}>
            ✕ Close
          </button>
        )}
      </div>

      {district && stat && (
        <div style={{ color: "#9CA3AF", fontSize: "12px", marginBottom: "10px" }}>
          {stat.character} • {stat.trend}
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <button
          onClick={() => {
            const id = createDistrict();
            if (id) setActiveDistrictId(id);
          }}
          disabled={districts.length >= MAX_DISTRICTS}
          style={{
            ...smallBtn,
            opacity: districts.length >= MAX_DISTRICTS ? 0.5 : 1,
          }}
        >
          ＋ New District
        </button>
        {district && (
          <button
            onClick={() => deleteDistrict(district.id)}
            style={{
              ...smallBtn,
              background: "rgba(239,68,68,0.12)",
              color: "#F87171",
            }}
          >
            🗑 Delete
          </button>
        )}
      </div>

      {!district && (
        <div style={{ color: "#9CA3AF", fontSize: "12px" }}>
          {districts.length === 0
            ? "No districts yet. Create one, then use the District tool to paint cells."
            : "Select a district below."}
        </div>
      )}

      {district && (
        <>
          {stat && (
            <>
              <Row label="Quality" value={
                <span style={{ fontWeight: 600, color: qualityColor(stat.quality) }}>
                  {stat.quality} / 100
                </span>
              } />
              {stat.qualityReasons.map((r) => (
                <div
                  key={r}
                  style={{
                    fontSize: "11px",
                    color: r.startsWith("Low") || r.startsWith("Weak") || r.startsWith("Heavy") || r.startsWith("Poor")
                      ? "#FBBF24"
                      : "#4ADE80",
                  }}
                >
                  {r.startsWith("Low") || r.startsWith("Weak") || r.startsWith("Heavy") || r.startsWith("Poor") ? "−" : "+"} {r}
                </div>
              ))}

              <Section title="Overview" />
              <Row label="Population" value={stat.population} />
              <Row label="Households" value={stat.households} />
              <Row label="Jobs" value={stat.jobs} />
              <Row label="Buildings" value={stat.buildingCount} />
              <Row label="Land Value" value={Math.round(stat.avgLandValue)} />
              <Row label="Traffic" value={stat.trafficLevel} />
              <Row label="Development" value={stat.trend} />
              <Row label="Activity" value={stat.developmentActivity} />
              {stat.priority && (
                <Row
                  label="Priority"
                  value={<span style={{ color: "#FBBF24" }}>{stat.priority}</span>}
                />
              )}

              <Section title="Services" />
              {stat.services.map((s) => (
                <Row
                  key={s.label}
                  label={s.label}
                  value={
                    <span style={{ color: SERVICE_COLORS[s.level] }}>{s.level}</span>
                  }
                />
              ))}

              <Section title="Public Transport" />
              <Row label="Coverage" value={`${Math.round(stat.transitCoverage)}%`} />
              <Row label="Stops" value={stat.transitStops} />
              <Row label="Lines" value={stat.transitLines} />
              <Row label="Ridership" value={`${stat.transitRiders}/day`} />
              <Row
                label="Transit Need"
                value={
                  <span
                    style={{
                      color:
                        stat.transitNeed === "High"
                          ? "#EF4444"
                          : stat.transitNeed === "Moderate"
                          ? "#FBBF24"
                          : stat.transitNeed === "Low"
                          ? "#4ADE80"
                          : "#6B7280",
                    }}
                  >
                    {stat.transitNeed}
                  </span>
                }
              />

              <Section title="Buildings" />
              {Object.entries(stat.byType).map(([type, n]) => (
                <Row key={type} label={capitalize(type)} value={n} />
              ))}
            </>
          )}

          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            <div style={{ color: "#9CA3AF", fontSize: "11px", marginBottom: "4px" }}>
              Name
            </div>
            {editingName ? (
              <div style={{ display: "flex", gap: "4px" }}>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "#F3F4F6",
                    padding: "3px 8px",
                    fontSize: "12px",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={() => {
                    renameDistrict(district.id, nameDraft.trim());
                    setEditingName(false);
                  }}
                  style={smallBtn}
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNameDraft(district.name);
                  setEditingName(true);
                }}
                style={{ ...smallBtn, width: "100%" }}
              >
                ✎ Rename
              </button>
            )}
          </div>

          <div style={{ marginBottom: "8px" }}>
            <div style={{ color: "#9CA3AF", fontSize: "11px", marginBottom: "4px" }}>
              Specialization (intent)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSpecialization(district.id, spec)}
                  style={{
                    ...smallBtn,
                    padding: "3px 8px",
                    fontSize: "11px",
                    background:
                      district.specialization === spec
                        ? "rgba(74,222,128,0.18)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      district.specialization === spec
                        ? "1px solid #4ADE80"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {SPECIALIZATION_LABELS[spec]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <div style={{ color: "#9CA3AF", fontSize: "11px", marginBottom: "4px" }}>
              Color
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {DISTRICT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(district.id, c)}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    background: c,
                    border:
                      district.color === c
                        ? "2px solid #FFFFFF"
                        : "1px solid rgba(255,255,255,0.15)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {activeDistrictId !== district.id ? (
            <button
              onClick={() => setActiveDistrictId(district.id)}
              style={{ ...smallBtn, width: "100%", marginBottom: "8px" }}
            >
              🖌 Paint into this district
            </button>
          ) : (
            <div
              style={{
                fontSize: "11px",
                color: "#4ADE80",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              ● Active — use the District tool to paint cells
            </div>
          )}

          {stat && (
            <>
              <Section title="Status" />
              <Row
                label="District Health"
                value={
                  <span
                    style={{
                      color:
                        stat.health === "Thriving"
                          ? "#4ADE80"
                          : stat.health === "Good"
                          ? "#60A5FA"
                          : stat.health === "Fair"
                          ? "#FBBF24"
                          : "#EF4444",
                    }}
                  >
                    {stat.health}
                  </span>
                }
              />
            </>
          )}
        </>
      )}

      {districts.length > 0 && (
        <>
          <Section title="City Districts" />
          <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "4px" }}>
            {districts.length} neighborhood{districts.length === 1 ? "" : "s"}
          </div>
          {allStats.length > 0 && (
            <>
              <Row label="Healthy" value={healthy} />
              <Row label="Needs Attention" value={needsAttention} />
              <Row label="Declining" value={declining} />
              {fastestGrowing && (
                <Row label="Fastest Growing" value={fastestGrowing.district.name} />
              )}
              {highestQuality && (
                <Row label="Highest Quality" value={highestQuality.district.name} />
              )}
              {mostTraffic && (
                <Row label="Most Traffic" value={mostTraffic.district.name} />
              )}
            </>
          )}
          <div style={{ marginTop: "6px" }}>
            {districts.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDistrictId(d.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "4px 6px",
                  background:
                    d.id === selectedDistrictId
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "#D1D5DB",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: d.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{d.name}</span>
                <span style={{ color: "#6B7280", fontSize: "11px" }}>
                  {d.cells.length}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function qualityColor(q: number) {
  if (q >= 75) return "#4ADE80";
  if (q >= 55) return "#60A5FA";
  if (q >= 35) return "#FBBF24";
  return "#EF4444";
}

function Section({ title }: { title: string }) {
  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        marginTop: "8px",
        paddingTop: "6px",
        marginBottom: "4px",
        fontSize: "11px",
        fontWeight: 600,
        color: "#9CA3AF",
        letterSpacing: "0.04em",
      }}
    >
      {title.toUpperCase()}
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const smallBtn: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#D1D5DB",
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: "inherit",
  fontWeight: 500,
};

const closeBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#9CA3AF",
  borderRadius: "8px",
  padding: "2px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: "inherit",
};