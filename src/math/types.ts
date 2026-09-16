export const EPSILON = 1e-10;

export type Vec2 = {
  x: number;
  y: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type SplineDefinition = {
  degree: number;
  controlPoints: Vec2[];
  knots: number[];
  weights: number[];
};

export type RecursionEdge = {
  parentI: number;
  parentDegree: number;
  childI: number;
  childDegree: number;
  side: "left" | "right";
  coefficient: number;
  numerator: number;
  denominator: number;
  interval: [number, number];
  zeroDenominator: boolean;
};

export type BasisEvaluation = {
  t: number;
  evaluationT: number;
  levels: number[][];
  edges: RecursionEdge[];
};

export type CurveEvaluation = {
  point: Vec2;
  basis: number[];
  rationalBasis: number[];
  activeIndices: number[];
  span: number;
};
