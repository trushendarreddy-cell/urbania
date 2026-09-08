import usePopulationStore from "../store/PopulationStore";

export default function CityStats() {
  const totalPopulation = usePopulationStore((state) => state.totalPopulation);
  const totalHouseholds = usePopulationStore((state) => state.totalHouseholds);
  const activePopulation = usePopulationStore((state) => state.activePopulation);

  return (
    <div
      style={{
        position: "fixed",
        top: "70px",
        left: "20px",
        padding: "10px 14px",
        background: "rgba(20, 20, 20, 0.85)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#F3F4F6",
        fontFamily: "monospace",
        fontSize: "13px",
        zIndex: 10,
        pointerEvents: "none",
        userSelect: "none",
        lineHeight: "1.5",
      }}
    >
      <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>
        🏙️ URBANIA
      </div>
      <div>Population  {totalPopulation}</div>
      <div>Households  {totalHouseholds}</div>
      <div>Active     {activePopulation}</div>
    </div>
  );
}