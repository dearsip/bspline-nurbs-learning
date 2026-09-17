import { evaluateBasisTable } from "../math/basis";
import type { SplineDefinition } from "../math/types";
import type { FormulaTerm } from "../state";
import { indexColor } from "../visual";
import { MathText } from "./MathText";

type Props = {
  definition: SplineDefinition;
  splineType: "bspline" | "nurbs";
  t: number;
  selected: { i: number; degree: number };
  selectionActive: boolean;
  term?: FormulaTerm;
  onTerm: (term?: FormulaTerm) => void;
};

export function FormulaInspector({ definition, splineType, t, selected, selectionActive, term, onTerm }: Props) {
  const table = evaluateBasisTable(definition.knots, definition.controlPoints.length, definition.degree, t);
  const q = Math.min(selected.degree, definition.degree);
  const maxI = Math.max(0, table.levels[q].length - 1);
  const i = Math.min(selected.i, maxI);
  const left = table.edges.find((edge) => edge.parentI === i && edge.parentDegree === q && edge.side === "left");
  const right = table.edges.find((edge) => edge.parentI === i && edge.parentDegree === q && edge.side === "right");

  return <details className="inspector collapsible-card" open>
    <summary className="inspector-summary"><div><span className="eyebrow">FORMULA / INSPECTOR</span><h2>Selected basis</h2></div></summary>
    {selectionActive && <>
    <div className="selected-formula" style={{ borderColor: indexColor(i) }}><MathText value={`N_{${i},${q}}(t)`} /></div>
    {q === 0 ? <div className="piecewise"><MathText display value={`N_{${i},0}(t)=\\begin{cases}1 & u_${i}\\le t < u_${i + 1}\\\\0 & \\text{otherwise}\\end{cases}`} /></div> : <>
      <div className="interactive-formula">
        <div><MathText value={`N_{${i},${q}}(t)=`} /></div>
        <button className={term === "left" ? "term selected" : "term"} onClick={() => onTerm(term === "left" ? undefined : "left")}><MathText value={`\\frac{t-u_${i}}{u_${i + q}-u_${i}}N_{${i},${q - 1}}(t)`} /></button>
        <span className="plus">+</span>
        <button className={term === "right" ? "term selected" : "term"} onClick={() => onTerm(term === "right" ? undefined : "right")}><MathText value={`\\frac{u_${i + q + 1}-t}{u_${i + q + 1}-u_${i + 1}}N_{${i + 1},${q - 1}}(t)`} /></button>
      </div>
      {(term === "left" ? left : term === "right" ? right : undefined)?.zeroDenominator && <p className="zero-note">u<sub>b</sub> − u<sub>a</sub> = 0 → term = 0</p>}
    </>}
    {splineType === "nurbs" && <div className="rational-formula">
      <h3>Rational basis</h3>
      <MathText display value={`R_{${i},${definition.degree}}(t)=\\frac{w_${i}N_{${i},${definition.degree}}(t)}{\\sum_j w_jN_{j,${definition.degree}}(t)}`} />
    </div>}
    </>}
  </details>;
}
