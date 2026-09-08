import usePopulationStore from "../store/PopulationStore";
import useEconomyStore from "../store/EconomyStore";
import useNeedsStore from "../store/NeedsStore";
import useServiceStore from "../store/ServiceStore";
import useUtilityStore from "../store/UtilityStore";
import useBuildingStore from "../store/BuildingStore";

export default function CityStats() {
  const totalPopulation = usePopulationStore((state) => state.totalPopulation);
  const totalHouseholds = usePopulationStore((state) => state.totalHouseholds);
  const activePopulation = usePopulationStore((state) => state.activePopulation);
  const totalJobs = usePopulationStore((state) => state.totalJobs);
  const employed = usePopulationStore((state) => state.employed);
  const unemployed = usePopulationStore((state) => state.unemployed);
  const totalCitizens = usePopulationStore((state) => state.totalCitizens);
  const activeCitizens = usePopulationStore((state) => state.activeCitizens);
  const dailyIncome = useEconomyStore((state) => state.dailyIncome);
  const dailySpending = useEconomyStore((state) => state.dailySpending);
  const totalBusinessRevenue = useEconomyStore((state) => state.totalBusinessRevenue);
  // Total household money
  const householdMoneyMap = useEconomyStore((state) => state.householdMoney);
  const totalMoney = Object.values(householdMoneyMap).reduce((a, b) => a + b, 0);
  // Happiness stats
  const needsMap = useNeedsStore((state) => state.needs);
  const happinessValues = Object.values(needsMap).map(n => n.happiness);
  const avgHappiness = happinessValues.length > 0 ? happinessValues.reduce((a, b) => a + b, 0) / happinessValues.length : 0;
  const happyCount = happinessValues.filter(h => h >= 60).length;
  const unhappyCount = happinessValues.filter(h => h < 40).length;
  // Service coverage stats
  const households = usePopulationStore.getState().households;
  const allBuildings = useBuildingStore.getState().buildings;
  let coveredRecreation = 0;
  for (const h of households) {
    const building = allBuildings.find(b => b.id === h.buildingId);
    if (building) {
      const coverage = useServiceStore.getState().getCoverage(building.position, "recreation");
      if (coverage.covered) coveredRecreation++;
    }
  }
  const totalHouseholdsCount = households.length;
  const recreationCoverage = totalHouseholdsCount > 0 ? (coveredRecreation / totalHouseholdsCount) * 100 : 0;

  // Utility coverage stats
  let electricCovered = 0, waterCovered = 0;
  let utilityBuildings = 0;
  for (const b of allBuildings) {
    if (b.type === 'house' || b.type === 'shop' || b.type === 'factory') {
      utilityBuildings++;
      const status = useUtilityStore.getState().getUtilityStatus(b.id);
      if (status && status.electricity) electricCovered++;
      if (status && status.water) waterCovered++;
    }
  }
  const electricCoverage = utilityBuildings > 0 ? (electricCovered / utilityBuildings) * 100 : 0;
  const waterCoverage = utilityBuildings > 0 ? (waterCovered / utilityBuildings) * 100 : 0;

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
      <div>Citizens    {totalCitizens}</div>
      <div>Active     {activePopulation}</div>
      <div>ActiveCit  {activeCitizens}</div>
      <div>Jobs       {totalJobs}</div>
      <div>Employed   {employed}</div>
      <div>Unemployed {unemployed}</div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "4px", paddingTop: "4px" }}>
        <div>💰 Money    {Math.round(totalMoney)}</div>
        <div>💸 Income   {Math.round(dailyIncome)}</div>
        <div>🛒 Spending {Math.round(dailySpending)}</div>
        <div>🏢 Revenue  {Math.round(totalBusinessRevenue)}</div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "4px", paddingTop: "4px" }}>
        <div>😊 Avg Happiness {Math.round(avgHappiness)}%</div>
        <div>😄 Happy {happyCount}</div>
        <div>😞 Unhappy {unhappyCount}</div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "4px", paddingTop: "4px" }}>
        <div>🏞️ Recreation Coverage {Math.round(recreationCoverage)}%</div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "4px", paddingTop: "4px" }}>
        <div>⚡ Electricity {Math.round(electricCoverage)}%</div>
        <div>💧 Water {Math.round(waterCoverage)}%</div>
      </div>
    </div>
  );
}