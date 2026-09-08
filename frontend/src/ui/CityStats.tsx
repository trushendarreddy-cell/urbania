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

  const dailyIncome = useEconomyStore((state) => state.dailyIncome);
  const dailySpending = useEconomyStore((state) => state.dailySpending);
  const totalBusinessRevenue = useEconomyStore((state) => state.totalBusinessRevenue);
  const economicHealth = useEconomyStore((state) => state.economicHealth);
  const aggregateDemand = useEconomyStore((state) => state.aggregateDemand);
  const unmetDemand = useEconomyStore((state) => state.unmetDemand);
  // Total household money
  const householdMoneyMap = useEconomyStore((state) => state.householdMoney);
  const totalMoney = Object.values(householdMoneyMap).reduce((a, b) => a + b, 0);
  // Employment rate
  const totalActivePop = usePopulationStore((state) => state.activePopulation);
  const employmentRate = totalActivePop > 0 ? (employed / totalActivePop) * 100 : 0;
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
  let coveredHealthcare = 0;
  let coveredSafety = 0;
  let coveredEmergency = 0;
  for (const h of households) {
    const building = allBuildings.find(b => b.id === h.buildingId);
    if (building) {
      const recCoverage = useServiceStore.getState().getCoverage(building.position, "recreation");
      if (recCoverage.covered) coveredRecreation++;
      const healthCoverage = useServiceStore.getState().getCoverage(building.position, "healthcare");
      if (healthCoverage.covered) coveredHealthcare++;
      const safetyCoverage = useServiceStore.getState().getCoverage(building.position, "safety");
      if (safetyCoverage.covered) coveredSafety++;
      const emergencyCoverage = useServiceStore.getState().getCoverage(building.position, "emergency");
      if (emergencyCoverage.covered) coveredEmergency++;
    }
  }
  // Education coverage: count children with school coverage
  const citizens = usePopulationStore.getState().citizens;
  let childrenWithEducation = 0;
  let totalChildren = 0;
  for (const c of citizens) {
    if (c.age < 18) {
      totalChildren++;
      const household = households.find(h => h.id === c.householdId);
      if (household) {
        const building = allBuildings.find(b => b.id === household.buildingId);
        if (building) {
          const eduCoverage = useServiceStore.getState().getCoverage(building.position, "education");
          if (eduCoverage.covered) childrenWithEducation++;
        }
      }
    }
  }
  const totalHouseholdsCount = households.length;
  const recreationCoverage = totalHouseholdsCount > 0 ? (coveredRecreation / totalHouseholdsCount) * 100 : 0;
  const healthcareCoverage = totalHouseholdsCount > 0 ? (coveredHealthcare / totalHouseholdsCount) * 100 : 0;
  const safetyCoverage = totalHouseholdsCount > 0 ? (coveredSafety / totalHouseholdsCount) * 100 : 0;
  const emergencyCoverage = totalHouseholdsCount > 0 ? (coveredEmergency / totalHouseholdsCount) * 100 : 0;
  const educationCoverage = totalChildren > 0 ? (childrenWithEducation / totalChildren) * 100 : 0;

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
        top: "80px",
        left: "24px",
        padding: "12px 16px",
        background: "rgba(12, 12, 16, 0.88)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#F3F4F6",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        zIndex: 10,
        pointerEvents: "none",
        userSelect: "none",
        lineHeight: "1.6",
        minWidth: "140px",
      }}
    >
      <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "6px", color: "#F9FAFB", letterSpacing: "0.03em" }}>
        🏙️ CITY STATS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
        <span style={{ color: "#9CA3AF" }}>Population</span>
        <span style={{ textAlign: "right" }}>{totalPopulation}</span>
        <span style={{ color: "#9CA3AF" }}>Households</span>
        <span style={{ textAlign: "right" }}>{totalHouseholds}</span>
        <span style={{ color: "#9CA3AF" }}>Citizens</span>
        <span style={{ textAlign: "right" }}>{totalCitizens}</span>
        <span style={{ color: "#9CA3AF" }}>Active</span>
        <span style={{ textAlign: "right" }}>{activePopulation}</span>
        <span style={{ color: "#9CA3AF" }}>Jobs</span>
        <span style={{ textAlign: "right" }}>{totalJobs}</span>
        <span style={{ color: "#9CA3AF" }}>Employed</span>
        <span style={{ textAlign: "right" }}>{employed}</span>
        <span style={{ color: "#9CA3AF" }}>Unemployed</span>
        <span style={{ textAlign: "right" }}>{unemployed}</span>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "6px", paddingTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Money</span>
          <span>₹{Math.round(totalMoney).toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Income</span>
          <span>₹{Math.round(dailyIncome)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Spending</span>
          <span>₹{Math.round(dailySpending)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Revenue</span>
          <span>₹{Math.round(totalBusinessRevenue)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Employ. Rate</span>
          <span>{Math.round(employmentRate)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Econ Health</span>
          <span>{Math.round(economicHealth)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Demand</span>
          <span>{Math.round(aggregateDemand)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Unmet Demand</span>
          <span>{Math.round(unmetDemand)}</span>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "6px", paddingTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Avg Happiness</span>
          <span>{Math.round(avgHappiness)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Happy</span>
          <span>{happyCount}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Unhappy</span>
          <span>{unhappyCount}</span>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "6px", paddingTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Recreation</span>
          <span>{Math.round(recreationCoverage)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Healthcare</span>
          <span>{Math.round(healthcareCoverage)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Education</span>
          <span>{Math.round(educationCoverage)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Safety</span>
          <span>{Math.round(safetyCoverage)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Emergency</span>
          <span>{Math.round(emergencyCoverage)}%</span>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "6px", paddingTop: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Electricity</span>
          <span>{Math.round(electricCoverage)}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#9CA3AF" }}>Water</span>
          <span>{Math.round(waterCoverage)}%</span>
        </div>
      </div>
    </div>
  );
}