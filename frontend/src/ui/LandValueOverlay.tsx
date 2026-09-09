import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import useBuildingStore from "../store/BuildingStore";
import useLandValueStore from "../store/LandValueStore";

interface LandValueOverlayProps {
  visible: boolean;
}

export default function LandValueOverlay({ visible }: LandValueOverlayProps) {
  const buildings = useBuildingStore((state) => state.buildings);
  const { scene } = useThree();

  // We'll use a simple mesh for each building to show color
  // For performance, we only update when visible and buildings change
  useEffect(() => {
    if (!visible) {
      // Remove any existing overlay meshes
      // We'll manage via a separate group
      return;
    }

    // Create a group to hold overlay meshes
    const group = new THREE.Group();
    group.name = "landValueOverlay";

    const landValueStore = useLandValueStore.getState();

    for (const building of buildings) {
      // Only for developable buildings
      if (!['house', 'shop', 'factory'].includes(building.type || '')) continue;

      const value = landValueStore.getLandValue(building.id);
      const color = new THREE.Color();
      if (value < 30) color.setHex(0xef4444); // red
      else if (value < 50) color.setHex(0xf97316); // orange
      else if (value < 70) color.setHex(0xfbbf24); // yellow
      else color.setHex(0x4ade80); // green

      // Create a plane or box on top of building
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
        2.5, // above building
        building.position[2]
      );
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);
    }

    scene.add(group);

    return () => {
      // Cleanup
      const existing = scene.getObjectByName("landValueOverlay");
      if (existing) {
        scene.remove(existing);
        // Dispose geometries and materials
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
  }, [visible, buildings]);

  return null;
}