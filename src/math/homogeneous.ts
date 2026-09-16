import { evaluateBasis } from "./basis";
import { EPSILON, type SplineDefinition, type Vec3 } from "./types";

export function toHomogeneousControlPoints(
  definition: SplineDefinition,
): Vec3[] {
  return definition.controlPoints.map((point, i) => {
    const w = definition.weights[i];
    return { x: w * point.x, y: w * point.y, z: w };
  });
}

export function evaluateHomogeneousCurve(
  definition: SplineDefinition,
  t: number,
): Vec3 {
  const basis = evaluateBasis(
    definition.knots,
    definition.controlPoints.length,
    definition.degree,
    t,
  );
  const homogeneous = toHomogeneousControlPoints(definition);

  return homogeneous.reduce(
    (acc, point, i) => ({
      x: acc.x + point.x * basis[i],
      y: acc.y + point.y * basis[i],
      z: acc.z + point.z * basis[i],
    }),
    { x: 0, y: 0, z: 0 },
  );
}

export function projectHomogeneous(point: Vec3): Vec3 {
  if (Math.abs(point.z) <= EPSILON) {
    throw new Error("Cannot project a homogeneous point with W = 0.");
  }
  return {
    x: point.x / point.z,
    y: point.y / point.z,
    z: 1,
  };
}
