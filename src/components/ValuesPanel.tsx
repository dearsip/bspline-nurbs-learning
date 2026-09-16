import type { CurveEvaluation, SplineDefinition } from "../math/types";
import { indexColor } from "../visual";
import { MathText } from "./MathText";

type Props = {
  definition: SplineDefinition;
  evaluation: CurveEvaluation;
  type: "bspline" | "nurbs";
};

export function ValuesPanel({ definition, evaluation, type }: Props) {
  return <details className="values-card collapsible-card" open>
    <summary className="section-title-row"><div><span className="eyebrow">CURRENT VALUES</span><h2>Numerical values</h2></div></summary>
    <div className="values-grid">
      <section><h3>Basis</h3><div className="value-chip-grid">
        {evaluation.basis.map((value, i) => <div className="value-chip" key={i} style={{ borderColor: indexColor(i) }}><MathText value={`N_{${i},${definition.degree}}(t)`} /><code>{value.toFixed(6)}</code></div>)}
        {type === "nurbs" && evaluation.rationalBasis.map((value, i) => <div className="value-chip rational" key={`r-${i}`} style={{ borderColor: indexColor(i) }}><MathText value={`R_{${i},${definition.degree}}(t)`} /><code>{value.toFixed(6)}</code></div>)}
      </div></section>
      <section><h3>Control points</h3><div className="value-chip-grid">
        {definition.controlPoints.map((point, i) => <div className="value-chip" key={i} style={{ borderColor: indexColor(i) }}><MathText value={`P_${i}`} /><code>({point.x.toFixed(4)}, {point.y.toFixed(4)})</code></div>)}
      </div></section>
      <section><h3>Curve point</h3><div className="curve-value"><MathText value="C(t)" /><code>({evaluation.point.x.toFixed(6)}, {evaluation.point.y.toFixed(6)})</code></div></section>
    </div>
  </details>;
}
