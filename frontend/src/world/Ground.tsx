import { useMemo } from 'react';
import { PlaneGeometry, CanvasTexture } from 'three';

function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Base color
  ctx.fillStyle = '#8BC34A';
  ctx.fillRect(0, 0, 512, 512);
  // Add subtle patches
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 10 + Math.random() * 40;
    const green = 130 + Math.random() * 60;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, ${green}, 70, 0.15)`;
    ctx.fill();
  }
  // Add some darker patches
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 5 + Math.random() * 20;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60, 100, 50, 0.2)';
    ctx.fill();
  }
  return new CanvasTexture(canvas);
}

export default function Ground() {
  const texture = useMemo(() => createGroundTexture(), []);
  const geom = useMemo(() => new PlaneGeometry(50, 50), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <primitive object={geom} />
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0} />
    </mesh>
  );
}