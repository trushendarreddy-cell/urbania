import useCityEventStore, {
  type CityEventSeverity,
} from "../store/CityEventStore";
import useDistrictStore, {
  type DistrictStats,
  type District,
} from "../store/DistrictStore";
import useMunicipalStore from "../store/MunicipalStore";
import useCityDemandStore from "../store/CityDemandStore";
import useAlertStore from "../store/AlertStore";
import { useSimulationStore } from "../stores/useSimulationStore";

const COOLDOWN_DAYS = 5;

const alertCategoryFor = (category: string): "service" | "economy" | "population" | "traffic" | "utility" => {
  switch (category) {
    case "services":
      return "service";
    case "economy":
      return "economy";
    case "development":
      return "population";
    case "infrastructure":
      return "traffic";
    default:
      return "population";
  }
};

const notify = (
  severity: CityEventSeverity,
  category: string,
  message: string
) => {
  useAlertStore
    .getState()
    .addAlert(severity, alertCategoryFor(category), message, true);
};

const serviceIssueCount = (stat: DistrictStats): number =>
  stat.services.filter((s) => s.level === "Poor").length;

export const evaluateCityEvents = () => {
  const { day } = useSimulationStore.getState();
  const districts = useDistrictStore.getState().districts;
  const stats = useDistrictStore.getState().stats;
  const eventStore = useCityEventStore.getState();
  const treasury = useMunicipalStore.getState().treasury;
  const dailyNet = useMunicipalStore.getState().dailyNet;
  const demand = useCityDemandStore.getState();

  // Resolve events whose condition is no longer true
  for (const e of eventStore.getActiveEvents()) {
    const stat = e.districtId ? stats[e.districtId] : undefined;
    let stillActive = true;
    switch (e.type) {
      case "traffic_pressure":
        stillActive = !!stat && stat.trafficLevel === "Heavy";
        break;
      case "service_pressure":
        stillActive = !!stat && serviceIssueCount(stat) >= 1;
        break;
      case "development_boom":
        stillActive = !!stat && (stat.trend === "Rapid Growth" || stat.trend === "Growing");
        break;
      case "development_stagnation":
        stillActive = !!stat && (stat.trend === "Stagnating" || stat.trend === "Declining");
        break;
      case "happiness_decline":
        stillActive = !!stat && stat.avgHappiness > 0 && stat.avgHappiness < 45;
        break;
      case "budget_pressure":
        stillActive = treasury < 200;
        break;
      default:
        stillActive = true;
    }
    if (!stillActive) {
      eventStore.resolveEvent(e.id, day);
      notify(
        "info",
        e.category,
        `Resolved: ${e.title}${e.districtName ? ` (${e.districtName})` : ""}`
      );
    }
  }

  // Per-district condition checks
  for (const d of districts) {
    const stat = stats[d.id];
    if (!stat) continue;
    checkTraffic(d, stat, day);
    checkServices(d, stat, day);
    checkDevelopment(d, stat, day);
    checkHappiness(d, stat, day);
  }

  // City-wide checks
  if (treasury < 200) {
    const key = "budget_pressure:city";
    if (!eventStore.isOnCooldown(key, day, COOLDOWN_DAYS)) {
      const severity: CityEventSeverity = treasury < 50 ? "critical" : "warning";
      eventStore.setCooldown(key, day);
      eventStore.createEvent(
        {
          type: "budget_pressure",
          category: "economy",
          severity,
          title: "Budget Pressure",
          description:
            severity === "critical"
              ? "Municipal funds are nearly exhausted."
              : "Municipal funds are running low.",
          districtId: null,
          districtName: null,
          navigation: "budget",
        },
        day
      );
      notify(severity, "economy", "Budget Pressure: municipal funds are low.");
    }
  } else if (treasury > 2000 && dailyNet > 0) {
    const key = "investment_interest:city";
    if (!eventStore.isOnCooldown(key, day, COOLDOWN_DAYS * 2)) {
      eventStore.setCooldown(key, day);
      eventStore.createEvent(
        {
          type: "investment_interest",
          category: "economy",
          severity: "info",
          title: "Investment Interest",
          description: "Strong finances are attracting new investment.",
          districtId: null,
          districtName: null,
          navigation: "budget",
        },
        day
      );
    }
  }

  const totalDemand =
    demand.residential + demand.commercial + demand.industrial;
  if (totalDemand >= 400) {
    const key = "city_development_surge:city";
    if (!eventStore.isOnCooldown(key, day, COOLDOWN_DAYS)) {
      eventStore.setCooldown(key, day);
      eventStore.createEvent(
        {
          type: "city_development_surge",
          category: "development",
          severity: "info",
          title: "City Development Surge",
          description: "Demand across the city is driving new construction.",
          districtId: null,
          districtName: null,
          navigation: null,
        },
        day
      );
    }
  }
};

const checkTraffic = (
  d: District,
  stat: DistrictStats,
  day: number
) => {
  if (stat.trafficLevel !== "Heavy") return;
  const key = `traffic_pressure:${d.id}`;
  const eventStore = useCityEventStore.getState();
  if (eventStore.isOnCooldown(key, day, COOLDOWN_DAYS)) return;
  eventStore.setCooldown(key, day);
  eventStore.createEvent(
    {
      type: "traffic_pressure",
      category: "infrastructure",
      severity: "warning",
      title: "Traffic Pressure",
      description: `${d.name} is experiencing severe congestion.`,
      districtId: d.id,
      districtName: d.name,
      navigation: "traffic",
    },
    day
  );
  notify("warning", "infrastructure", `Traffic Pressure: ${d.name} congestion is severe.`);
};

const checkServices = (
  d: District,
  stat: DistrictStats,
  day: number
) => {
  const poorCount = serviceIssueCount(stat);
  if (poorCount === 0) return;
  const key = `service_pressure:${d.id}`;
  const eventStore = useCityEventStore.getState();
  if (eventStore.isOnCooldown(key, day, COOLDOWN_DAYS)) return;
  const worst = stat.services.find((s) => s.level === "Poor");
  const severity: CityEventSeverity = poorCount >= 2 ? "critical" : "warning";
  eventStore.setCooldown(key, day);
  eventStore.createEvent(
    {
      type: "service_pressure",
      category: "services",
      severity,
      title: "Service Pressure",
      description: `${d.name} has poor ${worst ? worst.label.toLowerCase() : "service"} access.`,
      districtId: d.id,
      districtName: d.name,
      navigation: "services",
    },
    day
  );
  notify(severity, "services", `Service Pressure: ${d.name} has limited service access.`);
};

const checkDevelopment = (
  d: District,
  stat: DistrictStats,
  day: number
) => {
  const eventStore = useCityEventStore.getState();
  if (stat.trend === "Rapid Growth" || stat.trend === "Growing") {
    const key = `development_boom:${d.id}`;
    if (!eventStore.isOnCooldown(key, day, COOLDOWN_DAYS)) {
      eventStore.setCooldown(key, day);
      eventStore.createEvent(
        {
          type: "development_boom",
          category: "development",
          severity: "info",
          title: "Development Boom",
          description: `${d.name} is growing rapidly.`,
          districtId: d.id,
          districtName: d.name,
          navigation: "district",
        },
        day
      );
    }
  } else if (stat.trend === "Stagnating" || stat.trend === "Declining") {
    const key = `development_stagnation:${d.id}`;
    if (!eventStore.isOnCooldown(key, day, COOLDOWN_DAYS)) {
      eventStore.setCooldown(key, day);
      eventStore.createEvent(
        {
          type: "development_stagnation",
          category: "development",
          severity: "warning",
          title: "Development Stagnation",
          description: `${d.name} is developing slowly.`,
          districtId: d.id,
          districtName: d.name,
          navigation: "district",
        },
        day
      );
      notify("warning", "development", `Development Stagnation: ${d.name} is slowing down.`);
    }
  }
};

const checkHappiness = (
  d: District,
  stat: DistrictStats,
  day: number
) => {
  if (stat.avgHappiness <= 0 || stat.avgHappiness >= 45) return;
  const key = `happiness_decline:${d.id}`;
  const eventStore = useCityEventStore.getState();
  if (eventStore.isOnCooldown(key, day, COOLDOWN_DAYS)) return;
  eventStore.setCooldown(key, day);
  eventStore.createEvent(
    {
      type: "happiness_decline",
      category: "citizens",
      severity: stat.avgHappiness < 30 ? "critical" : "warning",
      title: "Happiness Decline",
      description: `Residents in ${d.name} are unhappy.`,
      districtId: d.id,
      districtName: d.name,
      navigation: "district",
    },
    day
  );
  notify("warning", "citizens", `Happiness Decline: ${d.name} residents are unhappy.`);
};

export const resetCityEvents = () => {
  useCityEventStore.getState().clear();
};