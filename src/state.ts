import { PRESETS, type SplinePreset } from "./presets";
import type { Vec2 } from "./math/types";

export type SplineType = "bspline" | "nurbs";
export type ViewMode = "curve" | "basis" | "homogeneous";
export type BasisSubmode = "overview" | "recursion";
export type FormulaTerm = "left" | "right";

export type AppState = {
  splineType: SplineType;
  degree: number;
  controlPoints: Vec2[];
  knots: number[];
  weights: number[];
  t: number;
  viewMode: ViewMode;
  basisSubmode: BasisSubmode;
  selectedBasis: { i: number; degree: number };
  recursionRoot: { i: number; degree: number };
  selectedFormulaTerm?: FormulaTerm;
  hoveredIndex?: number;
  showN: boolean;
  showR: boolean;
  showRecursionGraph: boolean;
  presetId?: string;
  resetSnapshot: SplinePreset;
};

export function clonePreset(preset: SplinePreset): SplinePreset {
  return {
    ...preset,
    spline: {
      ...preset.spline,
      controlPoints: preset.spline.controlPoints.map((point) => ({ ...point })),
      knots: [...preset.spline.knots],
      weights: [...preset.spline.weights],
    },
  };
}

export function stateFromPreset(preset: SplinePreset): AppState {
  const snapshot = clonePreset(preset);
  const selectedIndex = snapshot.selectedIndex ?? 0;
  return {
    splineType: snapshot.type,
    degree: snapshot.spline.degree,
    controlPoints: snapshot.spline.controlPoints,
    knots: snapshot.spline.knots,
    weights: snapshot.spline.weights,
    t: snapshot.initialT ?? snapshot.spline.knots[snapshot.spline.degree],
    viewMode: "curve",
    basisSubmode: "overview",
    selectedBasis: { i: selectedIndex, degree: snapshot.spline.degree },
    recursionRoot: { i: selectedIndex, degree: snapshot.spline.degree },
    showN: true,
    showR: true,
    showRecursionGraph: false,
    presetId: snapshot.id,
    resetSnapshot: clonePreset(snapshot),
  };
}

export const INITIAL_STATE = stateFromPreset(
  PRESETS.find((preset) => preset.id === "open-uniform-cubic") ?? PRESETS[0],
);

function openUniformKnots(count: number, degree: number): number[] {
  const knotCount = count + degree + 1;
  const interiorCount = knotCount - 2 * (degree + 1);
  return Array.from({ length: knotCount }, (_, i) => {
    if (i <= degree) return 0;
    if (i >= knotCount - degree - 1) return 1;
    return (i - degree) / (interiorCount + 1);
  });
}

function defaultPoints(count: number): Vec2[] {
  return Array.from({ length: count }, (_, i) => ({
    x: 0.08 + (0.84 * i) / Math.max(1, count - 1),
    y: i % 2 === 0 ? 0.28 : 0.74,
  }));
}

function freshState(state: AppState, degree: number, count: number): AppState {
  const knots = openUniformKnots(count, degree);
  const preset: SplinePreset = {
    id: "custom",
    name: "Custom curve",
    description: "Open-clamped custom curve.",
    type: state.splineType,
    spline: {
      degree,
      controlPoints: defaultPoints(count),
      knots,
      weights: new Array(count).fill(1),
    },
  };
  return { ...stateFromPreset(preset), splineType: state.splineType };
}

export type Action =
  | { type: "loadPreset"; preset: SplinePreset }
  | { type: "reset" }
  | { type: "setSplineType"; value: SplineType }
  | { type: "setDegree"; value: number }
  | { type: "setPointCount"; value: number }
  | { type: "setView"; value: ViewMode }
  | { type: "setSubmode"; value: BasisSubmode }
  | { type: "setT"; value: number }
  | { type: "setKnot"; index: number; value: number }
  | { type: "setWeight"; index: number; value: number }
  | { type: "resetWeights" }
  | { type: "movePoint"; index: number; point: Vec2 }
  | { type: "selectBasis"; i: number; degree?: number }
  | { type: "selectTerm"; value?: FormulaTerm }
  | { type: "hoverIndex"; value?: number }
  | { type: "toggleN" }
  | { type: "toggleR" }
  | { type: "toggleRecursionGraph" };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "loadPreset":
      return stateFromPreset(action.preset);
    case "reset":
      return stateFromPreset(state.resetSnapshot);
    case "setSplineType":
      return {
        ...state,
        splineType: action.value,
        viewMode: action.value === "bspline" && state.viewMode === "homogeneous" ? "curve" : state.viewMode,
        presetId: undefined,
      };
    case "setDegree":
      return freshState(state, action.value, Math.max(state.controlPoints.length, action.value + 1));
    case "setPointCount":
      return freshState(state, Math.min(state.degree, action.value - 1), action.value);
    case "setView":
      return { ...state, viewMode: action.value, showRecursionGraph: action.value === "basis" };
    case "setSubmode":
      return { ...state, basisSubmode: action.value };
    case "setT":
      return {
        ...state,
        t: Math.min(state.knots[state.controlPoints.length], Math.max(state.knots[state.degree], action.value)),
      };
    case "setKnot": {
      const knots = [...state.knots];
      const previous = action.index === 0 ? 0 : knots[action.index - 1];
      const next = action.index === knots.length - 1 ? 1 : knots[action.index + 1];
      knots[action.index] = Math.min(next, Math.max(previous, action.value));
      const lower = knots[state.degree];
      const upper = knots[state.controlPoints.length];
      return { ...state, knots, t: Math.min(upper, Math.max(lower, state.t)), presetId: undefined };
    }
    case "setWeight": {
      const weights = [...state.weights];
      weights[action.index] = action.value;
      return { ...state, weights, presetId: undefined };
    }
    case "resetWeights":
      return { ...state, weights: state.weights.map(() => 1), presetId: undefined };
    case "movePoint": {
      const controlPoints = state.controlPoints.map((point, i) => i === action.index ? action.point : point);
      return { ...state, controlPoints, presetId: undefined };
    }
    case "selectBasis":
      return {
        ...state,
        selectedBasis: { i: action.i, degree: action.degree ?? state.degree },
        recursionRoot: (action.degree ?? state.degree) === state.degree
          ? { i: action.i, degree: state.degree }
          : state.recursionRoot,
        showRecursionGraph: action.degree === undefined ? state.showRecursionGraph : true,
        selectedFormulaTerm: undefined,
      };
    case "selectTerm":
      return { ...state, selectedFormulaTerm: action.value };
    case "hoverIndex":
      return { ...state, hoveredIndex: action.value };
    case "toggleN":
      return { ...state, showN: !state.showN };
    case "toggleR":
      return { ...state, showR: !state.showR };
    case "toggleRecursionGraph":
      return { ...state, showRecursionGraph: !state.showRecursionGraph };
  }
}
