import { useMemo } from 'react';
import { CylinderGeometry, SphereGeometry } from 'three';
import { useSimulationStore } from '../stores/useSimulationStore';
import { getCitizenActivity } from '../systems/CitizenActivitySystem';

interface CitizenProps {
  position: [number, number, number];
  active: boolean;
  employmentStatus: 'employed' | 'unemployed' | 'inactive';
  age: number;
}

export default function Citizen({ position, active, employmentStatus, age }: CitizenProps) {
  const timeOfDay = useSimulationStore((state) => state.timeOfDay);
  const activity = getCitizenActivity(employmentStatus, age, timeOfDay);

  let bodyColor = '#4ADE80';
  let headColor = '#4ADE80';

  if (!active) {
    bodyColor = '#9CA3AF';
    headColor = '#9CA3AF';
  } else if (employmentStatus === 'employed') {
    // Base blue; shade by activity
    switch (activity) {
      case 'home':
        bodyColor = '#1E40AF'; // dark blue
        headColor = '#1E40AF';
        break;
      case 'working':
        bodyColor = '#3B82F6'; // bright blue
        headColor = '#3B82F6';
        break;
      case 'leisure':
        bodyColor = '#60A5FA'; // light blue
        headColor = '#60A5FA';
        break;
    }
  } else if (employmentStatus === 'unemployed') {
    // Base orange; shade by activity
    switch (activity) {
      case 'home':
        bodyColor = '#D97706'; // dark orange
        headColor = '#D97706';
        break;
      case 'leisure':
        bodyColor = '#F59E0B'; // medium orange
        headColor = '#F59E0B';
        break;
      // Unemployed never working
      default:
        bodyColor = '#F59E0B';
        headColor = '#F59E0B';
    }
  }

  // Use position to seed deterministic variation in height/scale
  const bodyGeom = useMemo(() => new CylinderGeometry(0.08, 0.08, 0.15, 6), []);
  const headGeom = useMemo(() => new SphereGeometry(0.06, 6, 6), []);
  // Subtle scale variation based on position
  const seed = position[0] * 100 + position[2];
  const scaleVar = 0.85 + Math.abs(Math.sin(seed)) * 0.3;

  return (
    <group position={[position[0], position[1] + 0.075, position[2]]} scale={[scaleVar, scaleVar, scaleVar]}>
      <mesh geometry={bodyGeom} position={[0, 0.075, 0]}>
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      <mesh geometry={headGeom} position={[0, 0.18, 0]}>
        <meshStandardMaterial color={headColor} roughness={0.6} />
      </mesh>
    </group>
  );
}