import { EPSILON } from "./types";

export function evaluateRationalBasis(
  basis: number[],
  weights: number[],
): number[] {
  if (basis.length !== weights.length) {
    throw new Error("Basis and weights must have equal length.");
  }
  if (weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) {
    throw new Error("MVP NURBS weights must be finite and positive.");
  }

  const weighted = basis.map((value, i) => value * weights[i]);
  const denominator = weighted.reduce((sum, value) => sum + value, 0);

  if (Math.abs(denominator) <= EPSILON) {
    throw new Error("Rational basis denominator is zero.");
  }

  return weighted.map((value) => value / denominator);
}
