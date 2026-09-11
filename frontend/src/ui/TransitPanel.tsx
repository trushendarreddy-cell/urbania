import { useState } from "react";
import useTransitStore from "../store/TransitStore";
import useMunicipalStore from "../store/MunicipalStore";
import {
  computeTransitStats,
  computeStopStats,
  computeLineStats,
  getTransitDemandLevel,
} from "../systems/TransitSystem";

const STOP_COST = 25;
const LINE_COST = 100;
const BUS_COST = 40;

export default function TransitPanel() {
  const panelOpen = useTransitStore((s) => s.panelOpen);
  const setPanelOpen = useTransitStore((s) => s.setPanelOpen);
  const stops = useTransitStore((s) => s.stops);
  const lines = useTransitStore((s) => s.lines);
  const selectedStopId = useTransitStore((s) => s.selectedStopId);
  const selectedLineId = useTransitStore((s) => s.selectedLineId);
  const setSelectedStopId = useTransitStore((s) => s.setSelectedStopId);
  const setSelectedLineId = useTransitStore((s) => s.setSelectedLineId);
  const lineDraft = useTransitStore((s) => s.lineDraft);
  const startLineDraft = useTransitStore((s) => s.startLineDraft);
  const cancelLineDraft = useTransitStore((s) => s.cancelLineDraft);
  const commitLineDraft = useTransitStore((s) => s.commitLineDraft);
  const renameLine = useTransitStore((s) => s.renameLine);
  const toggleLine = useTransitStore((s) => s.toggleLine);
  const deleteLine = useTransitStore((s) => s.deleteLine);
  const treasury = useMunicipalStore((s) => s.treasury);

  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  if (!panelOpen) return null;

  const stats = computeTransitStats();
  const demand = getTransitDemandLevel();
  const selectedStop = stops.find((s) => s.id === selectedStopId) ?? null;
  const selectedLine = lines.find((l) => l.id === selectedLineId) ?? null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: "80px",
        left: "24px",
        width: "320px",
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
        zIndex: 12,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "8px",
        }}
      >
        <span style={{ fontWeight: "600", fontSize: "15px", color: "#F9FAFB" }}>
          🚌 PUBLIC TRANSPORT
        </span>
        <button onClick={() => setPanelOpen(false)} style={closeBtn}>
          ✕ Close
        </button>
      </div>

      <Section title="Network" />
      <Row label="Stops" value={stats.stopCount} />
      <Row label="Bus Lines" value={stats.lineCount} />
      <Row label="Active Buses" value={stats.busCount} />
      <Row label="Daily Riders" value={stats.dailyRiders} />
      <Row label="Coverage" value={`${Math.round(stats.coverage)}%`} />
      <Row label="Treasury" value={`₹${Math.round(treasury)}`} />
      <Row
        label="Demand"
        value={
          <span style={{ color: demandColor(demand) }}>{demand}</span>
        }
      />
      <Row
        label="Status"
        value={
          <span
            style={{
              color:
                stats.network === "Good"
                  ? "#4ADE80"
                  : stats.network === "Fair"
                  ? "#FBBF24"
                  : "#EF4444",
            }}
          >
            {stats.network}
          </span>
        }
      />

      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        <button
          onClick={() => (lineDraft ? cancelLineDraft() : startLineDraft())}
          style={{
            ...smallBtn,
            background: lineDraft ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
            color: lineDraft ? "#F87171" : "#D1D5DB",
          }}
        >
          {lineDraft ? "✕ Cancel Line" : "＋ Create Line"}
        </button>
        {lineDraft && lineDraft.length >= 2 && (
          <button
            onClick={() => {
              if (treasury < LINE_COST) return;
              const id = commitLineDraft();
              if (id) useMunicipalStore.getState().spend(LINE_COST);
            }}
            disabled={treasury < LINE_COST}
            style={{
              ...smallBtn,
              background: "rgba(74,222,128,0.18)",
              border: "1px solid #4ADE80",
              opacity: treasury < LINE_COST ? 0.5 : 1,
            }}
          >
            ✓ Finish ({lineDraft.length}) ₹{LINE_COST}
          </button>
        )}
      </div>
      {lineDraft && lineDraft.length >= 2 && treasury < LINE_COST && (
        <div style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>
          Insufficient municipal funds.
        </div>
      )}
      {lineDraft && (
        <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
          Click transit stops on the map to add them to the line.
        </div>
      )}

      {stats.highDemand.length > 0 && (
        <>
          <Section title="High Demand" />
          {stats.highDemand.map((n) => (
            <div key={n} style={{ fontSize: "12px", color: "#FBBF24" }}>▲ {n}</div>
          ))}
        </>
      )}
      {stats.lowCoverage.length > 0 && (
        <>
          <Section title="Low Coverage" />
          {stats.lowCoverage.map((n) => (
            <div key={n} style={{ fontSize: "12px", color: "#EF4444" }}>▼ {n}</div>
          ))}
        </>
      )}

      {selectedStop && (
        <>
          <Section title="Stop" />
          {(() => {
            const s = computeStopStats(selectedStop);
            return (
              <>
                <Row label="Lines" value={s.lines} />
                <Row label="Nearby Population" value={s.population} />
                <Row label="Nearby Jobs" value={s.jobs} />
                <Row label="Daily Riders" value={s.riders} />
                <Row
                  label="Coverage"
                  value={<span style={{ color: serviceColor(s.level) }}>{s.level}</span>}
                />
              </>
            );
          })()}
          <button
            onClick={() => setSelectedStopId(null)}
            style={{ ...smallBtn, width: "100%", marginTop: "4px" }}
          >
            Deselect
          </button>
        </>
      )}

      {selectedLine && (
        <>
          <Section title="Line" />
          {(() => {
            const ls = computeLineStats(selectedLine);
            const level =
              ls.riders >= 80 ? "Good" : ls.riders >= 30 ? "Fair" : "Poor";
            return (
              <>
                <Row
                  label="Status"
                  value={
                    selectedLine.disrupted
                      ? "Disrupted"
                      : selectedLine.enabled
                      ? "Active"
                      : "Disabled"
                  }
                />
                <Row label="Stops" value={selectedLine.stopIds.length} />
                <Row label="Buses" value={ls.busCount} />
                <Row label="Daily Riders" value={ls.riders} />
                <Row
                  label="Coverage"
                  value={
                    <span style={{ color: serviceColor(level) }}>{level}</span>
                  }
                />
                {selectedLine.stopIds.length > 0 && (
                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                    Route:{" "}
                    {selectedLine.stopIds
                      .map((id) => stops.find((s) => s.id === id)?.name ?? "?")
                      .join(" → ")}
                  </div>
                )}
              </>
            );
          })()}
          {selectedLine.disrupted && selectedLine.disruptedReason && (
            <div style={{ fontSize: "11px", color: "#F87171" }}>
              {selectedLine.disruptedReason}
            </div>
          )}
          <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setNameDraft(selectedLine.name);
                setEditingLineId(selectedLine.id);
              }}
              style={smallBtn}
            >
              ✎ Rename
            </button>
            <button onClick={() => toggleLine(selectedLine.id)} style={smallBtn}>
              {selectedLine.enabled ? "⏸ Disable" : "▶ Enable"}
            </button>
            <button
              onClick={() => {
                deleteLine(selectedLine.id);
                setSelectedLineId(null);
              }}
              style={{ ...smallBtn, background: "rgba(239,68,68,0.12)", color: "#F87171" }}
            >
              🗑 Delete
            </button>
          </div>
          {editingLineId === selectedLine.id && (
            <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
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
                  renameLine(selectedLine.id, nameDraft.trim());
                  setEditingLineId(null);
                }}
                style={smallBtn}
              >
                Save
              </button>
            </div>
          )}
        </>
      )}

      <Section title="Bus Lines" />
      {lines.length === 0 && (
        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
          No bus lines yet.
        </div>
      )}
      {lines.map((l) => {
        const ls = computeLineStats(l);
        return (
          <div
            key={l.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "4px 6px",
              background: l.id === selectedLineId ? "rgba(255,255,255,0.08)" : "transparent",
              borderRadius: "6px",
            }}
          >
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: l.color, flexShrink: 0 }} />
            <button
              onClick={() => setSelectedLineId(l.id)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                color: "#D1D5DB",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "inherit",
                textAlign: "left",
                padding: 0,
              }}
            >
              {l.name} · {ls.riders}/day · {ls.busCount} bus{ls.busCount === 1 ? "" : "es"}
            </button>
            <span style={{ color: l.disrupted ? "#F87171" : l.enabled ? "#4ADE80" : "#6B7280", fontSize: "11px" }}>
              {l.disrupted ? "disrupted" : l.enabled ? "active" : "off"}
            </span>
          </div>
        );
      })}

      <Section title="Stops" />
      {stops.map((s) => {
        const ss = computeStopStats(s);
        return (
          <button
            key={s.id}
            onClick={() => setSelectedStopId(s.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              padding: "3px 6px",
              background: s.id === selectedStopId ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none",
              borderRadius: "6px",
              color: "#D1D5DB",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <span>{s.name}</span>
            <span style={{ color: "#6B7280" }}>
              {ss.lines} line{ss.lines === 1 ? "" : "s"} · {s.cellKey}
            </span>
          </button>
        );
      })}
      {stops.length === 0 && (
        <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
          Place Bus Stops (BuildMenu → Transit) to start.
        </div>
      )}
      <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "6px" }}>
        Costs: Stop ₹{STOP_COST} · Line ₹{LINE_COST} · Bus ₹{BUS_COST}
      </div>
    </div>
  );
}

function demandColor(d: string) {
  if (d === "Very High") return "#EF4444";
  if (d === "High") return "#F97316";
  if (d === "Moderate") return "#FBBF24";
  return "#4ADE80";
}

function serviceColor(level: string) {
  if (level === "Good") return "#4ADE80";
  if (level === "Fair") return "#FBBF24";
  if (level === "Poor") return "#EF4444";
  return "#6B7280";
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