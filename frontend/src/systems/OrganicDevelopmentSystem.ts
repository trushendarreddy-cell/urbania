import useZoneStore from "../store/ZoneStore";
import useBuildingStore from "../store/BuildingStore";
import usePopulationStore from "../store/PopulationStore";
import useCityDemandStore from "../store/CityDemandStore";
import useLandValueStore from "../store/LandValueStore";
import useMunicipalStore from "../store/MunicipalStore";
import useProgressionStore from "../store/ProgressionStore";
import useAlertStore from "../store/AlertStore";
import { hasRoadAccess } from "./RoadAccessSystem";
import { getDistrictSpecializationPressureModifier } from "./DistrictSystem";
import { useSimulationStore } from "../stores/useSimulationStore";
import type { BuildTool } from "../types/BuildTool";
import type { ZoneType } from "../types/ZoneType";

const ZONE_CONFIG = {
  progressPerDay: 12,
  minPressure: 35,
  roadRequired: true,
  level2LandValue: 60,
  level3LandValue: 80,
};

const zoneToBuilding: Record<ZoneType, BuildTool> = {
  residential: "house",
  commercial: "shop",
  industrial: "factory",
  park: "park",
};

const demandForZone = (zoneType: ZoneType): number => {
  const demand = useCityDemandStore.getState();
  switch (zoneType) {
    case "residential":
      return demand.residential;
    case "commercial":
      return demand.commercial;
    case "industrial":
      return demand.industrial;
    default:
      return 0;
  }
};

export const getZoneDevelopmentPressure = (
  position: [number, number, number],
  zoneType: ZoneType
): number => {
  const buildings = useBuildingStore.getState().buildings;
  const landValue = useLandValueStore.getState().getLandValueAtPosition(position);
  let pressure = landValue * 0.6;

  const demand = demandForZone(zoneType);
  pressure += (demand / 100) * 30;

  if (hasRoadAccess(position, buildings)) pressure += 10;

  const policy = useMunicipalStore.getState().cityPolicy;
  if (policy === "growth") pressure += 8;
  else if (policy === "austerity") pressure -= 5;

  pressure += getDistrictSpecializationPressureModifier(
    `${Math.round(position[0])},${Math.round(position[2])}`,
    zoneType
  );

  return Math.max(0, Math.min(100, pressure));
};

export const isZoneEligible = (
  position: [number, number, number],
  zoneType: ZoneType
): { eligible: boolean; reason: string } => {
  const buildings = useBuildingStore.getState().buildings;

  if (ZONE_CONFIG.roadRequired && !hasRoadAccess(position, buildings)) {
    return { eligible: false, reason: "Waiting for road access" };
  }

  const demand = demandForZone(zoneType);
  if (demand < 25) {
    return { eligible: false, reason: "Waiting for demand" };
  }

  const pressure = getZoneDevelopmentPressure(position, zoneType);
  if (pressure < ZONE_CONFIG.minPressure) {
    return { eligible: false, reason: "Low development pressure" };
  }

  const unlocked = useProgressionStore.getState().unlockedBuildings;
  const buildingType = zoneToBuilding[zoneType];
  if (!unlocked.includes(buildingType)) {
    return { eligible: false, reason: "Locked by city progression" };
  }

  return { eligible: true, reason: "Developing" };
};

const selectInitialLevel = (
  position: [number, number, number]
): number => {
  const landValue = useLandValueStore.getState().getLandValueAtPosition(position);
  if (landValue >= ZONE_CONFIG.level3LandValue) return 3;
  if (landValue >= ZONE_CONFIG.level2LandValue) return 2;
  return 1;
};

export const processOrganicDevelopment = () => {
  const zones = useZoneStore.getState().zones;
  if (zones.length === 0) return;

  const { day } = useSimulationStore.getState();
  const buildings = useBuildingStore.getState().buildings;
  const buildingStore = useBuildingStore.getState();
  const populationStore = usePopulationStore.getState();
  const zoneStore = useZoneStore.getState();

  const developed: { zoneType: ZoneType }[] = [];

  for (const zone of zones) {
    if (zone.state === "occupied") continue;

    const occupied = buildings.some(
      (b) =>
        Math.abs(b.position[0] - zone.position[0]) < 0.1 &&
        Math.abs(b.position[2] - zone.position[2]) < 0.1
    );
    if (occupied) {
      zoneStore.removeZoneById(zone.id);
      continue;
    }

    const { eligible } = isZoneEligible(zone.position, zone.zoneType);
    if (!eligible) {
      if (zone.state === "developing") {
        zoneStore.setState(zone.id, "zoned");
      }
      continue;
    }

    zoneStore.setState(zone.id, "developing");
    const newProgress = Math.min(100, zone.progress + ZONE_CONFIG.progressPerDay);
    zoneStore.setProgress(zone.id, newProgress);

    if (newProgress >= 100) {
      const buildingType = zoneToBuilding[zone.zoneType];
      const level = selectInitialLevel(zone.position);
      const id = buildingStore.addBuilding(
        [zone.position[0], 0, zone.position[2]],
        buildingType,
        0,
        zone.zoneType
      );
      useBuildingStore.setState((state) => ({
        buildings: state.buildings.map((b) =>
          b.id === id ? { ...b, level, lastUpgradeDay: day } : b
        ),
      }));
      if (buildingType === "house") {
        populationStore.addHousehold(id);
      }
      zoneStore.removeZoneById(zone.id);
      developed.push({ zoneType: zone.zoneType });
    }
  }

  if (developed.length > 0) {
    const counts: Record<string, number> = {};
    for (const d of developed) {
      counts[d.zoneType] = (counts[d.zoneType] || 0) + 1;
    }
    const summary = Object.entries(counts)
      .map(([type, n]) => `${n} ${type}`)
      .join(", ");
    useAlertStore.getState().addAlert(
      "info",
      "population",
      `New development: ${summary}`,
      true
    );
  }
};