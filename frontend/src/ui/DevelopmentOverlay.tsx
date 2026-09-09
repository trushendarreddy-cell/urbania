import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import useBuildingStore from "../store/BuildingStore";
import useDevelopmentStore from "../store/DevelopmentStore";

interface DevelopmentOverlayProps {
  visible: boolean;
}

export default function DevelopmentOverlay({ visible }: DevelopmentOverlayProps) {
  const buildings = useBuildingStore((state) => state.buildings);
  const { scene } = useThree();

  useEffect(() => {
    // Remove existing overlay if any
    const removeOverlay = () => {
      const existing = scene.getObjectByName("developmentOverlay");
      if (existing) {
        scene.remove(existing);
        existing.traverse((child) => {
          if (child.type === 'Mesh') {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            const mat = mesh.material;
            if (Array.isArray(mat)) {
              mat.forEach(m => m.dispose());
            } else {
              mat.dispose();
            }
          }
        });
      }
    };

    if (!visible) {
      removeOverlay();
      return;
    }

    const group = new THREE.Group();
    group.name = "developmentOverlay";

    const devStore = useDevelopmentStore.getState();

    for (const building of buildings) {
      if (!['house', 'shop', 'factory'].includes(building.type || '')) continue;

      const pressure = devStore.getDevelopmentPressure(building.id);
      const color = new THREE.Color();
      if (pressure < 30) color.setHex(0xef4444);
      else if (pressure < 50) color.setHex(0xf97316);
      else if (pressure < 70) color.setHex(0xfbbf24);
      else color.setHex(0x4ade80);

      const geometry = new THREE.PlaneGeometry(0.8, 0.8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        building.position[0],
        2.8,
        building.position[2]
      );
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);
    }

    scene.add(group);
    return removeOverlay;
  }, [visible, buildings]);

  return null;
}