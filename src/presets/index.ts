import type { SplineDefinition, Vec2 } from "../math/types";

export type SplinePreset = {
  id: string;
  name: string;
  description: string;
  type: "bspline" | "nurbs";
  spline: SplineDefinition;
  initialT?: number;
  selectedIndex?: number;
};

function weights(count: number): number[] {
  return new Array(count).fill(1);
}

function spline(
  degree: number,
  controlPoints: Vec2[],
  knots: number[],
  customWeights = weights(controlPoints.length),
): SplineDefinition {
  return { degree, controlPoints, knots, weights: customWeights };
}

const SQRT_HALF = Math.SQRT1_2;

export const PRESETS: SplinePreset[] = [
  {
    id: "linear",
    name: "Linear B-spline",
    description: "Degree 1: the simplest local piecewise-linear basis.",
    type: "bspline",
    spline: spline(
      1,
      [
        { x: 0.1, y: 0.2 },
        { x: 0.35, y: 0.8 },
        { x: 0.65, y: 0.3 },
        { x: 0.9, y: 0.7 },
      ],
      [0, 0, 1 / 3, 2 / 3, 1, 1],
    ),
  },
  {
    id: "quadratic",
    name: "Quadratic B-spline",
    description: "Degree 2 and a visible second recursion level.",
    type: "bspline",
    spline: spline(
      2,
      [
        { x: 0.1, y: 0.2 },
        { x: 0.28, y: 0.82 },
        { x: 0.5, y: 0.18 },
        { x: 0.72, y: 0.8 },
        { x: 0.9, y: 0.35 },
      ],
      [0, 0, 0, 1 / 3, 2 / 3, 1, 1, 1],
    ),
  },
  {
    id: "open-uniform-cubic",
    name: "Open uniform cubic B-spline",
    description: "Default cubic example with open-clamped knots.",
    type: "bspline",
    spline: spline(
      3,
      [
        { x: 0.08, y: 0.3 },
        { x: 0.22, y: 0.78 },
        { x: 0.4, y: 0.2 },
        { x: 0.6, y: 0.82 },
        { x: 0.78, y: 0.3 },
        { x: 0.92, y: 0.68 },
      ],
      [0, 0, 0, 0, 1 / 3, 2 / 3, 1, 1, 1, 1],
    ),
  },
  {
    id: "unclamped-uniform-cubic",
    name: "Unclamped uniform cubic B-spline",
    description: "Uniform knots without endpoint clamping; the curve does not interpolate its end control points.",
    type: "bspline",
    spline: spline(
      3,
      [
        { x: 0.06, y: 0.28 },
        { x: 0.2, y: 0.76 },
        { x: 0.34, y: 0.18 },
        { x: 0.5, y: 0.82 },
        { x: 0.66, y: 0.22 },
        { x: 0.8, y: 0.74 },
        { x: 0.94, y: 0.36 },
      ],
      [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    ),
    initialT: 0.5,
  },
  {
    id: "non-uniform-cubic",
    name: "Non-uniform cubic B-spline",
    description: "Shows how uneven knot spacing redistributes basis functions.",
    type: "bspline",
    spline: spline(
      3,
      [
        { x: 0.08, y: 0.3 },
        { x: 0.22, y: 0.78 },
        { x: 0.4, y: 0.2 },
        { x: 0.6, y: 0.82 },
        { x: 0.78, y: 0.3 },
        { x: 0.92, y: 0.68 },
      ],
      [0, 0, 0, 0, 0.18, 0.72, 1, 1, 1, 1],
    ),
  },
  {
    id: "repeated-knot",
    name: "Repeated internal knot",
    description: "Cubic spline with a repeated internal knot.",
    type: "bspline",
    spline: spline(
      3,
      [
        { x: 0.08, y: 0.3 },
        { x: 0.22, y: 0.78 },
        { x: 0.4, y: 0.2 },
        { x: 0.6, y: 0.82 },
        { x: 0.78, y: 0.3 },
        { x: 0.92, y: 0.68 },
      ],
      [0, 0, 0, 0, 0.5, 0.5, 1, 1, 1, 1],
    ),
  },
  {
    id: "high-multiplicity-repeated-knot",
    name: "High-multiplicity repeated knot",
    description: "A cubic spline with a triple internal knot and a visibly reduced join smoothness.",
    type: "bspline",
    spline: spline(
      3,
      [
        { x: 0.06, y: 0.24 },
        { x: 0.2, y: 0.78 },
        { x: 0.34, y: 0.32 },
        { x: 0.48, y: 0.62 },
        { x: 0.6, y: 0.18 },
        { x: 0.78, y: 0.74 },
        { x: 0.94, y: 0.38 },
      ],
      [0, 0, 0, 0, 0.5, 0.5, 0.5, 1, 1, 1, 1],
    ),
    initialT: 0.5,
  },
  {
    id: "bezier",
    name: "Bézier as B-spline",
    description: "A cubic Bézier curve represented as a B-spline special case.",
    type: "bspline",
    spline: spline(
      3,
      [
        { x: 0.1, y: 0.2 },
        { x: 0.25, y: 0.9 },
        { x: 0.75, y: 0.1 },
        { x: 0.9, y: 0.75 },
      ],
      [0, 0, 0, 0, 1, 1, 1, 1],
    ),
  },
  {
    id: "local-support",
    name: "Local support / local control",
    description: "Move the selected middle control point to see that only its supported curve region changes.",
    type: "bspline",
    spline: spline(
      3,
      [
        { x: 0.06, y: 0.34 },
        { x: 0.2, y: 0.72 },
        { x: 0.34, y: 0.24 },
        { x: 0.5, y: 0.86 },
        { x: 0.66, y: 0.2 },
        { x: 0.8, y: 0.7 },
        { x: 0.94, y: 0.34 },
      ],
      [0, 0, 0, 0, 0.25, 0.5, 0.75, 1, 1, 1, 1],
    ),
    initialT: 0.5,
    selectedIndex: 3,
  },
  {
    id: "quarter-circle",
    name: "NURBS quarter circle",
    description: "Exact rational quadratic quarter circle.",
    type: "nurbs",
    spline: spline(
      2,
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      [0, 0, 0, 1, 1, 1],
      [1, SQRT_HALF, 1],
    ),
  },
  {
    id: "circle",
    name: "NURBS circle",
    description: "Standard rational quadratic circle with repeated quarter knots.",
    type: "nurbs",
    spline: spline(
      2,
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
        { x: -1, y: 1 },
        { x: -1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 0 },
      ],
      [0, 0, 0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1, 1, 1],
      [1, SQRT_HALF, 1, SQRT_HALF, 1, SQRT_HALF, 1, SQRT_HALF, 1],
    ),
  },
  {
    id: "conic-by-weight",
    name: "Conic by weight",
    description: "A rational quadratic conic controlled by the selected middle weight.",
    type: "nurbs",
    spline: spline(
      2,
      [
        { x: 0.08, y: 0.18 },
        { x: 0.5, y: 0.92 },
        { x: 0.92, y: 0.18 },
      ],
      [0, 0, 0, 1, 1, 1],
      [1, 2, 1],
    ),
    initialT: 0.5,
    selectedIndex: 1,
  },
];
