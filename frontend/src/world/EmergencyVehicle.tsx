import { useMemo } from 'react';
import { BoxGeometry } from 'three';

interface EmergencyVehicleProps {
  type: 'fire_truck' | 'ambulance' | 'police_car';
  position: [number, number, number];
  rotation: number; // in radians
}

export default function EmergencyVehicle({ type, position, rotation }: EmergencyVehicleProps) {
  const color = type === 'fire_truck' ? '#EF4444' : type === 'ambulance' ? '#3B82F6' : '#1E3A8A';
  const detailColor = type === 'fire_truck' ? '#FBBF24' : type === 'ambulance' ? '#FFFFFF' : '#FBBF24';

  const bodyGeom = useMemo(() => new BoxGeometry(0.3, 0.12, 0.6), []);
  const cabGeom = useMemo(() => new BoxGeometry(0.2, 0.08, 0.2), []);
  const lightGeom = useMemo(() => new BoxGeometry(0.04, 0.02, 0.04), []);
  const bumperGeom = useMemo(() => new BoxGeometry(0.28, 0.02, 0.04), []);
  const grilleGeom = useMemo(() => new BoxGeometry(0.06, 0.03, 0.01), []);

  return (
    <group position={[position[0], position[1] + 0.06, position[2]]} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <primitive object={bodyGeom} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Cab */}
      <mesh position={[0, 0.1, -0.2]} castShadow>
        <primitive object={cabGeom} />
        <meshStandardMaterial color={detailColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Bumper */}
      <mesh position={[0, 0.03, -0.32]} castShadow>
        <primitive object={bumperGeom} />
        <meshStandardMaterial color="#4B5563" roughness={0.8} />
      </mesh>
      {/* Grille */}
      <mesh position={[0, 0.06, -0.3]} castShadow>
        <primitive object={grilleGeom} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Headlights */}
      <mesh position={[-0.08, 0.06, -0.3]} castShadow>
        <primitive object={lightGeom} />
        <meshStandardMaterial color="#F9FAFB" emissive="#F9FAFB" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.08, 0.06, -0.3]} castShadow>
        <primitive object={lightGeom} />
        <meshStandardMaterial color="#F9FAFB" emissive="#F9FAFB" emissiveIntensity={0.3} />
      </mesh>
      {/* Beacon */}
      <mesh position={[0, 0.16, 0.05]} castShadow>
        <boxGeometry args={[0.06, 0.04, 0.06]} />
        <meshStandardMaterial color="#FACC15" emissive="#FACC15" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}