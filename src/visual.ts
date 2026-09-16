export const INDEX_COLORS = [
  "#2563eb", "#dc2626", "#059669", "#9333ea", "#ea580c", "#0891b2",
  "#be185d", "#4f46e5", "#65a30d", "#a16207", "#0f766e", "#7c3aed",
];

export function indexColor(index: number): string {
  return INDEX_COLORS[index % INDEX_COLORS.length];
}

export type ParameterScale = {
  left: number;
  right: number;
  width: number;
  x: (value: number) => number;
  value: (x: number) => number;
};

export function parameterScale(width: number, left = 62, right = 54): ParameterScale {
  const usable = Math.max(1, width - left - right);
  return {
    left,
    right,
    width,
    x: (value) => left + value * usable,
    value: (x) => Math.max(0, Math.min(1, (x - left) / usable)),
  };
}

export function svgPath(points: { x: number; y: number }[]): string {
  return points.map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}
