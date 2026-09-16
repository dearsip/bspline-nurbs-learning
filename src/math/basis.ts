import { EPSILON, type BasisEvaluation, type RecursionEdge } from "./types";

export function expectedKnotCount(controlPointCount: number, degree: number): number {
  return controlPointCount + degree + 1;
}

export function validateKnotVector(
  knots: number[],
  controlPointCount: number,
  degree: number,
): void {
  if (!Number.isInteger(degree) || degree < 0) {
    throw new Error("Degree must be a non-negative integer.");
  }
  if (controlPointCount < degree + 1) {
    throw new Error("Control-point count must be at least degree + 1.");
  }
  if (knots.length !== expectedKnotCount(controlPointCount, degree)) {
    throw new Error(
      `Expected ${expectedKnotCount(controlPointCount, degree)} knots, got ${knots.length}.`,
    );
  }
  for (let i = 1; i < knots.length; i += 1) {
    if (knots[i] < knots[i - 1]) {
      throw new Error("Knot vector must be nondecreasing.");
    }
  }
}

export function validParameterRange(
  knots: number[],
  controlPointCount: number,
  degree: number,
): [number, number] {
  const n = controlPointCount - 1;
  return [knots[degree], knots[n + 1]];
}

/**
 * The standard half-open degree-zero definition is evaluated at the right end
 * of the valid parameter domain using the left limit. This avoids inventing a
 * special basis assignment for arbitrary non-clamped knot vectors.
 */
export function effectiveEvaluationT(
  t: number,
  lower: number,
  upper: number,
): number {
  if (Math.abs(t - upper) <= EPSILON) {
    const scale = Math.max(1, Math.abs(upper - lower), Math.abs(upper));
    return upper - EPSILON * scale;
  }
  return t;
}

export function findSpan(
  knots: number[],
  controlPointCount: number,
  degree: number,
  t: number,
): number {
  validateKnotVector(knots, controlPointCount, degree);
  const n = controlPointCount - 1;
  const [lower, upper] = validParameterRange(knots, controlPointCount, degree);

  if (t < lower - EPSILON || t > upper + EPSILON) {
    throw new Error(`t=${t} is outside the valid parameter range [${lower}, ${upper}].`);
  }

  if (Math.abs(t - upper) <= EPSILON) return n;

  let low = degree;
  let high = n + 1;
  let mid = Math.floor((low + high) / 2);

  while (t < knots[mid] || t >= knots[mid + 1]) {
    if (t < knots[mid]) high = mid;
    else low = mid;
    mid = Math.floor((low + high) / 2);
  }

  return mid;
}

export function evaluateBasisTable(
  knots: number[],
  controlPointCount: number,
  degree: number,
  t: number,
): BasisEvaluation {
  validateKnotVector(knots, controlPointCount, degree);
  const [lower, upper] = validParameterRange(knots, controlPointCount, degree);

  if (t < lower - EPSILON || t > upper + EPSILON) {
    throw new Error(`t=${t} is outside the valid parameter range [${lower}, ${upper}].`);
  }

  const evaluationT = effectiveEvaluationT(t, lower, upper);
  const m = knots.length - 1;
  const levels: number[][] = [];
  const edges: RecursionEdge[] = [];

  // Degree zero has m basis functions: i = 0..m-1.
  levels[0] = Array.from({ length: m }, (_, i) =>
    knots[i] <= evaluationT && evaluationT < knots[i + 1] ? 1 : 0,
  );

  for (let q = 1; q <= degree; q += 1) {
    const count = m - q;
    const level = new Array<number>(count).fill(0);

    for (let i = 0; i < count; i += 1) {
      const leftDenominator = knots[i + q] - knots[i];
      const leftNumerator = evaluationT - knots[i];
      const leftZero = Math.abs(leftDenominator) <= EPSILON;
      const leftCoefficient = leftZero ? 0 : leftNumerator / leftDenominator;

      const rightDenominator = knots[i + q + 1] - knots[i + 1];
      const rightNumerator = knots[i + q + 1] - evaluationT;
      const rightZero = Math.abs(rightDenominator) <= EPSILON;
      const rightCoefficient = rightZero ? 0 : rightNumerator / rightDenominator;

      const leftValue = leftCoefficient * (levels[q - 1][i] ?? 0);
      const rightValue = rightCoefficient * (levels[q - 1][i + 1] ?? 0);
      level[i] = leftValue + rightValue;

      edges.push({
        parentI: i,
        parentDegree: q,
        childI: i,
        childDegree: q - 1,
        side: "left",
        coefficient: leftCoefficient,
        numerator: leftNumerator,
        denominator: leftDenominator,
        interval: [knots[i], knots[i + q]],
        zeroDenominator: leftZero,
      });

      edges.push({
        parentI: i,
        parentDegree: q,
        childI: i + 1,
        childDegree: q - 1,
        side: "right",
        coefficient: rightCoefficient,
        numerator: rightNumerator,
        denominator: rightDenominator,
        interval: [knots[i + 1], knots[i + q + 1]],
        zeroDenominator: rightZero,
      });
    }

    levels[q] = level;
  }

  return { t, evaluationT, levels, edges };
}

export function evaluateBasis(
  knots: number[],
  controlPointCount: number,
  degree: number,
  t: number,
): number[] {
  return evaluateBasisTable(knots, controlPointCount, degree, t).levels[degree].slice(
    0,
    controlPointCount,
  );
}
