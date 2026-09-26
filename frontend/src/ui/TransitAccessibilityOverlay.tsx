import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import useBuildingStore from "../store/BuildingStore";
import { getAccessibility } from "../systems/TransitAccessibilitySystem";

interface TransitAccessibilityOverlayProps {
  visible: boolean;
}

/**
 * Transit Accessibility Overlay (2.54).
 *
 * Green plane above a building = effective transit access (a stop served by
 * an enabled, intact line is walkable from the building). Gray = no access.
 * Derived from the cached accessibility snapshot; no per-frame work.
 */
export default function TransitAccessibilityOverlay({
  visible,
}: TransitAccessibilityOverlayProps) {
  const buildings = useBuildingStore((state) => state.buildings);
  const { scene } = useThree();

  useEffect(() => {
    if (!visible) return;

    const group = new THREE.Group();
    group.name = "transitAccessibilityOverlay";

    const access = getAccessibility();

    for (const building of buildings) {
      if (!["house", "shop", "factory"].includes(building.type || "")) continue;

      const color = new THREE.Color();
      if (access.accessibleBuildingIds.has(building.id)) color.setHex(0x4ade80);
      else color.setHex(0x6b7280);

      const geometry = new THREE.PlaneGeometry(0.9, 0.9);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(building.position[0], 2.2, building.position[2]);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);
    }

    scene.add(group);

    return () => {
      const existing = scene.getObjectByName("transitAccessibilityOverlay");
      if (existing) {
        scene.remove(existing);
        existing.traverse((child) => {
          if (child.type === "Mesh") {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            const mat = mesh.material;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat.dispose();
          }
        });
      }
    };
  }, [visible, buildings]);

  return null;
}
