import type { SplineDefinition } from "../math/types";
import { indexColor } from "../visual";
import { MathText } from "./MathText";

type Props = {
  definition: SplineDefinition;
  type: "bspline" | "nurbs";
  t: number;
  selectedIndex: number;
  hoveredIndex?: number;
  onKnot: (index: number, value: number) => void;
  onT: (value: number) => void;
  onWeight: (index: number, value: number) => void;
  onResetWeights: () => void;
  onSelect: (index: number) => void;
};

export function ParameterPanel(props: Props) {
  const lower = props.definition.knots[props.definition.degree];
  const upper = props.definition.knots[props.definition.controlPoints.length];
  return <>
  <details className="parameter-card collapsible-card" open>
    <summary className="section-title-row"><div><span className="eyebrow">KNOT VECTOR</span><h2>Knots and parameter</h2></div><code>U = ({props.definition.knots.map((k) => k.toFixed(2)).join(", ")})</code></summary>
    <div className="slider-stack">
      <div className="t-stack-guide" aria-hidden="true" style={{ left: `${6.2 + props.t * 88.4}%` }} />
      <label className="slider-row t-row">
        <span className="math-slider-label"><MathText value="t" /></span>
        <input aria-label="Curve parameter t" type="range" min="0" max="1" step="0.001" value={props.t} onChange={(e) => props.onT(Math.min(upper, Math.max(lower, Number(e.target.value))))} />
        <output>{props.t.toFixed(3)}</output>
      </label>
      {props.definition.knots.map((knot, i) => <label className="slider-row" key={i}>
        <span className="math-slider-label"><MathText value={`u_{${i}}`} /></span>
        <input aria-label={`Knot u ${i}`} type="range" min="0" max="1" step="0.001" value={knot} onChange={(e) => props.onKnot(i, Math.min(i === props.definition.knots.length - 1 ? 1 : props.definition.knots[i + 1], Math.max(i === 0 ? 0 : props.definition.knots[i - 1], Number(e.target.value))))} />
        <output>{knot.toFixed(3)}</output>
      </label>)}
    </div>
  </details>
    {props.type === "nurbs" && <details className="weights-card collapsible-card" open>
      <summary className="section-title-row"><div><span className="eyebrow">RATIONAL CONTROL</span><h2>Weights</h2></div></summary>
      <div className="weights-panel">
      <div className="weights-actions"><button className="secondary" onClick={props.onResetWeights}>Reset weights</button></div>
      {props.definition.weights.map((weight, i) => <label key={i} className={`slider-row weight-row ${props.selectedIndex === i ? "selected" : ""}`} onClick={() => props.onSelect(i)}>
        <span className="math-slider-label" style={{ color: indexColor(i) }}><MathText value={`w_{${i}}`} /></span>
        <input aria-label={`Weight w ${i}`} type="range" min="0.1" max="5" step="0.01" value={weight} onChange={(e) => props.onWeight(i, Number(e.target.value))} />
        <output>{weight.toFixed(2)}</output>
      </label>)}
      </div>
    </details>}
  </>;
}
