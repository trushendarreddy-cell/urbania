import { Line } from "@react-three/drei";

interface TransitRouteLineProps {
  roadPath: string[];
  color: string;
}

export default function TransitRouteLine({ roadPath, color }: TransitRouteLineProps) {
  if (roadPath.length < 2) return null;
  const points = roadPath.map((key) => {
    const [x, z] = key.split(",").map(Number);
    return [x, 0.05, z] as [number, number, number];
  });
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.6}
      dashed={false}
    />
  );
}