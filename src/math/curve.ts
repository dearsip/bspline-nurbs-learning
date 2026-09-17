import { evaluateBasis, evaluateBasisTable, findSpan, validateKnotVector } from "./basis";
import { EPSILON, type CurveEvaluation, type SplineDefinition, type Vec2 } from "./types";
import { evaluateRationalBasis } from "./nurbs";

function weightedPoint(controlPoints: Vec2[], coefficients: number[]): Vec2 {
  return controlPoints.reduce(
    (acc, point, i) => ({
      x: acc.x + point.x * (coefficients[i] ?? 0),
      y: acc.y + point.y * (coefficients[i] ?? 0),
    }),
    { x: 0, y: 0 },
  );
}

export function validateSpline(definition: SplineDefinition): void {
  validateKnotVector(
    definition.knots,
    definition.controlPoints.length,
    definition.degree,
  );
  if (definition.weights.length !== definition.controlPoints.length) {
    throw new Error("Weights must have the same length as control points.");
  }
  if (definition.weights.some((w) => !Number.isFinite(w) || w <= 0)) {
    throw new Error("MVP NURBS weights must be finite and positive.");
  }
}

export function evaluateBSplineCurve(
  definition: SplineDefinition,
  t: number,
): CurveEvaluation {
  validateSpline(definition);
  const basis = evaluateBasis(
    definition.knots,
    definition.controlPoints.length,
    definition.degree,
    t,
  );
  const rationalBasis = evaluateRationalBasis(basis, definition.weights);
  const point = weightedPoint(definition.controlPoints, basis);

  return {
    point,
    basis,
    rationalBasis,
    activeIndices: basis
      .map((value, i) => ({ value, i }))
      .filter(({ value }) => value > EPSILON)
      .map(({ i }) => i),
    span: findSpan(
      definition.knots,
      definition.controlPoints.length,
      definition.degree,
      t,
    ),
  };
}

export function evaluateNurbsCurve(
  definition: SplineDefinition,
  t: number,
): CurveEvaluation {
  validateSpline(definition);
  const basis = evaluateBasis(
    definition.knots,
    definition.controlPoints.length,
    definition.degree,
    t,
  );
  const rationalBasis = evaluateRationalBasis(basis, definition.weights);
  const point = weightedPoint(definition.controlPoints, rationalBasis);

  return {
    point,
    basis,
    rationalBasis,
    activeIndices: rationalBasis
      .map((value, i) => ({ value, i }))
      .filter(({ value }) => value > EPSILON)
      .map(({ i }) => i),
    span: findSpan(
      definition.knots,
      definition.controlPoints.length,
      definition.degree,
      t,
    ),
  };
}

/**
 * Evaluates the lower-degree spline obtained by trimming one knot from each
 * end for every removed degree. The surviving middle row of the original
 * Cox–de Boor table is mapped to the first control points. For example, a
 * cubic with P0..P5 uses N1,2..N5,2 with P0..P4 at degree two.
 */
export function evaluateCurveAtBasisDegree(
  definition: SplineDefinition,
  t: number,
  basisDegree: number,
  type: "bspline" | "nurbs",
): CurveEvaluation {
  validateSpline(definition);
  if (!Number.isInteger(basisDegree) || basisDegree < 0 || basisDegree > definition.degree) {
    throw new Error(`Basis degree must be between 0 and ${definition.degree}.`);
  }
  const level = evaluateBasisTable(
    definition.knots,
    definition.controlPoints.length,
    definition.degree,
    t,
  ).levels[basisDegree];
  const offset = definition.degree - basisDegree;
  const basis = definition.controlPoints.map((_, controlIndex) =>
    controlIndex < definition.controlPoints.length - offset
      ? level[controlIndex + offset] ?? 0
      : 0,
  );
  const rationalBasis = evaluateRationalBasis(basis, definition.weights);
  const coefficients = type === "nurbs" ? rationalBasis : basis;
  return {
    point: weightedPoint(definition.controlPoints, coefficients),
    basis,
    rationalBasis,
    activeIndices: coefficients
      .map((value, i) => ({ value, i }))
      .filter(({ value }) => value > EPSILON)
      .map(({ i }) => i),
    span: findSpan(definition.knots, definition.controlPoints.length, definition.degree, t),
  };
}
