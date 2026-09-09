import useAlertStore from "../store/AlertStore";
import useServiceStore from "../store/ServiceStore";
import useEventStore from "../store/EventStore";
import usePopulationStore from "../store/PopulationStore";
import useBuildingStore from "../store/BuildingStore";
import useUtilityStore from "../store/UtilityStore";
import useNeedsStore from "../store/NeedsStore";
import { hasRoadAccess } from "./RoadAccessSystem";

// This function should be called on simulation day change or when relevant state updates.
export function evaluateAlerts() {
  const buildings = useBuildingStore.getState().buildings;
  const households = usePopulationStore.getState().households;
  const serviceStore = useServiceStore.getState();
  const utilityStore = useUtilityStore.getState();
  const alertStore = useAlertStore.getState();

  // Check service coverage for each service type
  const serviceTypes: Array<'recreation' | 'healthcare' | 'education' | 'safety' | 'emergency'> = ['recreation', 'healthcare', 'education', 'safety', 'emergency'];
  for (const type of serviceTypes) {
    const providers = serviceStore.getProvidersForService(type);
    if (providers.length === 0) {
      // No providers: critical alert if population > 0
      if (households.length > 0) {
        alertStore.addAlert('critical', 'service', `No ${type} service available in the city.`, false);
      }
      continue;
    }
    // Count households not covered
    let uncovered = 0;
    for (const h of households) {
      const building = buildings.find(b => b.id === h.buildingId);
      if (!building) continue;
      if (!hasRoadAccess(building.position, buildings)) continue; // inactive households don't need services
      const coverage = serviceStore.getCoverage(building.position, type);
      if (!coverage.covered) {
        uncovered++;
      }
    }
    const totalActive = households.filter(h => {
      const b = buildings.find(bld => bld.id === h.buildingId);
      return b && hasRoadAccess(b.position, buildings);
    }).length;
    if (totalActive > 0) {
      const uncoveredRatio = uncovered / totalActive;
      if (uncoveredRatio > 0.7) {
        alertStore.addAlert('critical', 'service', `Most households lack ${type} coverage.`, false);
      } else if (uncoveredRatio > 0.4) {
        alertStore.addAlert('warning', 'service', `${type} coverage is low.`);
      }
    }
  }

  // Check utilities
  const utilityBuildings = buildings.filter(b => b.type === 'house' || b.type === 'shop' || b.type === 'factory');
  let noElectricity = 0, noWater = 0;
  for (const b of utilityBuildings) {
    const status = utilityStore.getUtilityStatus(b.id);
    if (status) {
      if (!status.electricity) noElectricity++;
      if (!status.water) noWater++;
    }
  }
  if (utilityBuildings.length > 0) {
    const elecRatio = noElectricity / utilityBuildings.length;
    const waterRatio = noWater / utilityBuildings.length;
    if (elecRatio > 0.5) alertStore.addAlert('critical', 'utility', 'Electricity shortage affecting many buildings.', false);
    else if (elecRatio > 0.2) alertStore.addAlert('warning', 'utility', 'Electricity coverage is low.');
    if (waterRatio > 0.5) alertStore.addAlert('critical', 'utility', 'Water shortage affecting many buildings.', false);
    else if (waterRatio > 0.2) alertStore.addAlert('warning', 'utility', 'Water coverage is low.');
  }

    // Check overall happiness
    const needsStore = useNeedsStore.getState();
    const needsMap = needsStore.needs;
    const happinessValues = Object.values(needsMap).map(n => n.happiness);
    if (happinessValues.length > 0) {
      const avg = happinessValues.reduce((a, b) => a + b, 0) / happinessValues.length;
      if (avg < 30) {
        alertStore.addAlert('critical', 'population', 'Citizen happiness is critically low.', false);
      } else if (avg < 50) {
        alertStore.addAlert('warning', 'population', 'Citizen happiness is below average.');
      }
    }

    // Check if there are any active events (fires, crimes, etc.) that are not resolved
    const activeEvents = useEventStore.getState().getActiveEvents();
    if (activeEvents.length > 0) {
      alertStore.addAlert('warning', 'service', `${activeEvents.length} active emergency events require attention.`);
    }

  // Check population vs housing pressure
  const totalPopulation = usePopulationStore.getState().totalPopulation;
  const totalHouseholds = usePopulationStore.getState().totalHouseholds;
  // Rough: if many households have high population, maybe demand high
  if (totalPopulation > 0 && totalHouseholds > 0) {
    const avgPopPerHousehold = totalPopulation / totalHouseholds;
    if (avgPopPerHousehold > 4.5) {
      alertStore.addAlert('warning', 'population', 'Housing pressure: households are overcrowded.');
    }
  }
}