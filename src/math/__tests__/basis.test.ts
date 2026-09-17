import { describe, expect, it } from "vitest";
import { evaluateBasis, evaluateBasisTable } from "../basis";
import { evaluateBSplineCurve, evaluateCurveAtBasisDegree, evaluateNurbsCurve } from "../curve";
import { evaluateHomogeneousCurve, projectHomogeneous } from "../homogeneous";
import { PRESETS } from "../../presets";
import { EPSILON } from "../types";

function preset(id: string) {
  const value = PRESETS.find((p) => p.id === id);
  if (!value) throw new Error(`Missing preset ${id}`);
  return value.spline;
}

describe("B-spline basis", () => {
  it("uses the half-open degree-zero definition", () => {
    const knots = [0, 0.25, 0.5, 1];
    const table = evaluateBasisTable(knots, 3, 0, 0.25);
    expect(table.levels[0].slice(0, 3)).toEqual([0, 1, 0]);
  });

  it("forms a partition of unity on an open cubic example", () => {
    const s = preset("open-uniform-cubic");

    for (const t of [0, 0.1, 0.25, 0.5, 0.9, 1]) {
      const basis = evaluateBasis(s.knots, s.controlPoints.length, s.degree, t);
      expect(basis.reduce((sum, v) => sum + v, 0)).toBeCloseTo(1, 8);
    }
  });

  it("does not produce NaN with repeated knots", () => {
    const s = preset("repeated-knot");
    const evaluation = evaluateBasisTable(
      s.knots,
      s.controlPoints.length,
      s.degree,
      0.5,
    );

    for (const level of evaluation.levels) {
      for (const value of level) {
        expect(Number.isNaN(value)).toBe(false);
        expect(Number.isFinite(value)).toBe(true);
      }
    }

    expect(evaluation.edges.some((edge) => edge.zeroDenominator)).toBe(true);
  });

  it("keeps basis functions locally supported", () => {
    const s = preset("open-uniform-cubic");
    const basis = evaluateBasis(s.knots, s.controlPoints.length, s.degree, 0.1);

    // At most p+1 highest-degree bases are active in a nondegenerate knot span.
    expect(basis.filter((v) => v > 1e-10).length).toBeLessThanOrEqual(s.degree + 1);

    for (let i = 0; i < s.controlPoints.length; i += 1) {
      const supportStart = s.knots[i];
      const supportEnd = s.knots[i + s.degree + 1];
      for (const t of [0.05, 0.2, 0.48, 0.8, 0.95]) {
        if (t < supportStart - EPSILON || t >= supportEnd) {
          expect(evaluateBasis(s.knots, s.controlPoints.length, s.degree, t)[i]).toBeCloseTo(0, 12);
        }
      }
    }
  });

  it("interpolates the endpoints of an open-clamped spline", () => {
    const s = preset("open-uniform-cubic");
    const start = evaluateBSplineCurve(s, 0).point;
    const end = evaluateBSplineCurve(s, 1).point;
    expect(start.x).toBeCloseTo(s.controlPoints[0].x, 9);
    expect(start.y).toBeCloseTo(s.controlPoints[0].y, 9);
    expect(end.x).toBeCloseTo(s.controlPoints.at(-1)!.x, 8);
    expect(end.y).toBeCloseTo(s.controlPoints.at(-1)!.y, 8);
  });

  it("forms a partition of unity around a repeated internal knot", () => {
    const s = preset("repeated-knot");
    for (const t of [0, 0.2, 0.5 - 1e-8, 0.5, 0.5 + 1e-8, 0.8, 1]) {
      const basis = evaluateBasis(s.knots, s.controlPoints.length, s.degree, t);
      expect(basis.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
    }
  });
});

describe("B-spline / NURBS relation", () => {
  it("evaluates every visible recursion degree without losing a finite curve point", () => {
    for (const presetValue of PRESETS) {
      const s = presetValue.spline;
      const lower = s.knots[s.degree];
      const upper = s.knots[s.controlPoints.length];
      for (let q = 0; q <= s.degree; q += 1) {
        for (const t of [lower, (lower + upper) / 2, upper]) {
          const evaluation = evaluateCurveAtBasisDegree(s, t, q, presetValue.type);
          expect(Number.isFinite(evaluation.point.x)).toBe(true);
          expect(Number.isFinite(evaluation.point.y)).toBe(true);
          expect(evaluation.basis.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
          expect(evaluation.rationalBasis.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
        }
      }
    }
  });

  it("maps a lower-degree row symmetrically to the first control points", () => {
    const s = preset("open-uniform-cubic");
    const start = evaluateCurveAtBasisDegree(s, 0, 2, "bspline");
    const end = evaluateCurveAtBasisDegree(s, 1, 2, "bspline");

    expect(start.point).toEqual(s.controlPoints[0]);
    expect(end.point.x).toBeCloseTo(s.controlPoints[4].x, 9);
    expect(end.point.y).toBeCloseTo(s.controlPoints[4].y, 9);
    expect(start.basis[5]).toBe(0);
    expect(end.basis[5]).toBe(0);
  });

  it("matches B-spline when all weights are one", () => {
    const s = preset("open-uniform-cubic");
    const bs = evaluateBSplineCurve(s, 0.42);
    const nu = evaluateNurbsCurve(s, 0.42);

    expect(nu.point.x).toBeCloseTo(bs.point.x, 10);
    expect(nu.point.y).toBeCloseTo(bs.point.y, 10);
  });

  it("positive rational basis also sums to one", () => {
    const s = preset("quarter-circle");
    for (const t of [0, 0.1, 0.4, 0.75, 1]) {
      const rational = evaluateNurbsCurve(s, t).rationalBasis;
      expect(rational.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    }
  });

  it("changing weights changes R but not the polynomial basis N", () => {
    const s = preset("quarter-circle");
    const changed = { ...s, weights: [1, 2.5, 1] };
    const original = evaluateNurbsCurve(s, 0.4);
    const weighted = evaluateNurbsCurve(changed, 0.4);
    expect(weighted.basis).toEqual(original.basis);
    expect(weighted.rationalBasis[1]).not.toBeCloseTo(original.rationalBasis[1], 6);
  });

  it("quarter-circle preset lies on the unit circle", () => {
    const s = preset("quarter-circle");

    for (const t of [0, 0.2, 0.5, 0.8, 1]) {
      const point = evaluateNurbsCurve(s, t).point;
      expect(point.x * point.x + point.y * point.y).toBeCloseTo(1, 7);
    }
  });

  it("homogeneous projection equals direct NURBS evaluation", () => {
    const s = preset("quarter-circle");

    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const direct = evaluateNurbsCurve(s, t).point;
      const projected = projectHomogeneous(evaluateHomogeneousCurve(s, t));

      expect(projected.x).toBeCloseTo(direct.x, 10);
      expect(projected.y).toBeCloseTo(direct.y, 10);
    }
  });
});
