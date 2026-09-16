import { useMemo } from "react";
import { evaluateBasisTable } from "../math/basis";
import { evaluateRationalBasis } from "../math/nurbs";
import type { SplineDefinition } from "../math/types";
import type { FormulaTerm } from "../state";
import { indexColor, parameterScale, svgPath } from "../visual";

type Props = {
  definition: SplineDefinition;
  type: "bspline" | "nurbs";
  t: number;
  selected: { i: number; degree: number };
  selectedTerm?: FormulaTerm;
  hoveredIndex?: number;
  showN: boolean;
  showR: boolean;
  showRecursion: boolean;
  onSelect: (index: number, degree?: number) => void;
  onHover: (index?: number) => void;
  onToggleN: () => void;
  onToggleR: () => void;
  onToggleRecursion: () => void;
};

const W = 1000;
const H = 245;
const scale = parameterScale(W);
const Y0 = 188;
const YH = 145;

export function BasisGraph(props: Props) {
  const lower = props.definition.knots[props.definition.degree];
  const upper = props.definition.knots[props.definition.controlPoints.length];
  const selectedQ = Math.min(props.selected.degree, props.definition.degree);
  const selectedI = Math.min(props.selected.i, (props.definition.knots.length - 1) - selectedQ - 1);
  const samples = useMemo(() => Array.from({ length: 241 }, (_, s) => {
    const t = s / 240;
    if (t < lower || t > upper) return { t, levels: [] as number[][], r: props.definition.controlPoints.map(() => 0) };
    const table = evaluateBasisTable(props.definition.knots, props.definition.controlPoints.length, props.definition.degree, t);
    const n = table.levels[props.definition.degree].slice(0, props.definition.controlPoints.length);
    return { t, levels: table.levels, r: evaluateRationalBasis(n, props.definition.weights) };
  }), [props.definition, lower, upper]);

  const values = (i: number, q: number) => samples.map((sample) => sample.levels[q]?.[i] ?? 0);
  const pathFor = (series: number[]) => svgPath(samples.map((sample, k) => ({ x: scale.x(sample.t), y: Y0 - series[k] * YH })));
  const target = values(selectedI, selectedQ);
  const leftChild = selectedQ > 0 ? values(selectedI, selectedQ - 1) : [];
  const rightChild = selectedQ > 0 ? values(selectedI + 1, selectedQ - 1) : [];
  const leftDenominator = (props.definition.knots[selectedI + selectedQ] ?? 0) - (props.definition.knots[selectedI] ?? 0);
  const rightDenominator = (props.definition.knots[selectedI + selectedQ + 1] ?? 0) - (props.definition.knots[selectedI + 1] ?? 0);
  const weightedLeft = leftChild.map((value, k) => Math.abs(leftDenominator) < 1e-10 ? 0 : value * (samples[k].t - props.definition.knots[selectedI]) / leftDenominator);
  const weightedRight = rightChild.map((value, k) => Math.abs(rightDenominator) < 1e-10 ? 0 : value * (props.definition.knots[selectedI + selectedQ + 1] - samples[k].t) / rightDenominator);
  const supportStart = props.definition.knots[selectedI] ?? 0;
  const supportEnd = props.definition.knots[selectedI + selectedQ + 1] ?? 1;
  const termStart = props.selectedTerm === "right" ? props.definition.knots[selectedI + 1] : props.definition.knots[selectedI];
  const termEnd = props.selectedTerm === "right" ? props.definition.knots[selectedI + selectedQ + 1] : props.definition.knots[selectedI + selectedQ];
  const numeratorStart = props.selectedTerm === "right" ? props.t : termStart;
  const numeratorEnd = props.selectedTerm === "right" ? termEnd : props.t;
  const currentTable = props.t >= lower && props.t <= upper
    ? evaluateBasisTable(props.definition.knots, props.definition.controlPoints.length, props.definition.degree, props.t)
    : undefined;
  const selectedChildValue = props.selectedTerm === "right"
    ? currentTable?.levels[selectedQ - 1]?.[selectedI + 1] ?? 0
    : currentTable?.levels[selectedQ - 1]?.[selectedI] ?? 0;
  const selectedWeightedValue = props.selectedTerm === "right"
    ? (Math.abs(rightDenominator) < 1e-10 ? 0 : selectedChildValue * (props.definition.knots[selectedI + selectedQ + 1] - props.t) / rightDenominator)
    : (Math.abs(leftDenominator) < 1e-10 ? 0 : selectedChildValue * (props.t - props.definition.knots[selectedI]) / leftDenominator);
  const knotGroups = props.definition.knots.reduce<Array<{ value: number; indices: number[] }>>((groups, value, i) => {
    const last = groups.at(-1);
    if (last && Math.abs(last.value - value) < 1e-10) last.indices.push(i);
    else groups.push({ value, indices: [i] });
    return groups;
  }, []);

  return <details className="basis-card collapsible-card" open>
    <summary className="section-title-row">
      <div><span className="eyebrow">KNOTS → BASIS → CURVE</span><h2>Basis functions</h2></div>
    </summary>
    <div className="toggles basis-toggles">
      <label><input type="checkbox" checked={props.showN} onChange={props.onToggleN} /> N<sub>i,p</sub></label>
      {props.type === "nurbs" && <label><input type="checkbox" checked={props.showR} onChange={props.onToggleR} /> R<sub>i,p</sub></label>}
      <label><input type="checkbox" checked={props.showRecursion} onChange={props.onToggleRecursion} /> selected recursion</label>
    </div>
    <svg className="basis-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Basis-function graph with knot positions">
      <line x1={scale.left} y1={Y0} x2={W - scale.right} y2={Y0} className="axis-line" />
      <rect x={scale.x(supportStart)} y="26" width={Math.max(0, scale.x(supportEnd) - scale.x(supportStart))} height={Y0 - 26} className="support-band" />
      {props.selectedTerm && selectedQ > 0 && <>
        <rect x={scale.x(termStart)} y={Y0 - 15} width={Math.max(0, scale.x(termEnd) - scale.x(termStart))} height="14" className="denominator-band" />
        <rect x={scale.x(Math.min(numeratorStart, numeratorEnd))} y={Y0 - 10} width={Math.abs(scale.x(numeratorEnd) - scale.x(numeratorStart))} height="9" className="numerator-band" />
      </>}
      {!props.showRecursion && props.definition.controlPoints.map((_, i) => {
        const emphasized = selectedQ === props.definition.degree && selectedI === i || props.hoveredIndex === i;
        const nPath = pathFor(values(i, props.definition.degree));
        const rPath = pathFor(samples.map((sample) => sample.r[i] ?? 0));
        return <g key={i} onClick={() => props.onSelect(i)} onPointerEnter={() => props.onHover(i)} onPointerLeave={() => props.onHover(undefined)} className="basis-hit">
          {props.showN && <path d={nPath} fill="none" stroke={indexColor(i)} strokeWidth={emphasized ? 4 : props.type === "nurbs" ? 1.5 : 2.3} strokeDasharray={props.type === "nurbs" ? "6 4" : undefined} opacity={emphasized ? 1 : .7} />}
          {props.type === "nurbs" && props.showR && <path d={rPath} fill="none" stroke={indexColor(i)} strokeWidth={emphasized ? 4.5 : 2.5} opacity={emphasized ? 1 : .88} />}
        </g>;
      })}
      {props.showRecursion && <>
        {selectedQ > 0 && <>
          <path d={pathFor(leftChild)} className="child-basis left-child" />
          <path d={pathFor(rightChild)} className="child-basis right-child" />
        </>}
        <path d={pathFor(target)} fill="none" stroke={indexColor(selectedI)} strokeWidth="4.5" className="selected-basis-curve" />
        {selectedQ > 0 && <>
          <path d={pathFor(weightedLeft)} className={`weighted-term left-term ${props.selectedTerm === "left" ? "selected-term" : ""}`} />
          <path d={pathFor(weightedRight)} className={`weighted-term right-term ${props.selectedTerm === "right" ? "selected-term" : ""}`} />
        </>}
        {props.selectedTerm && selectedQ > 0 && <>
          <line x1={scale.x(props.t)} y1={Y0} x2={scale.x(props.t)} y2={Y0 - selectedWeightedValue * YH} className="proportion-weighted" />
          <line x1={scale.x(props.t)} y1={Y0 - selectedWeightedValue * YH} x2={scale.x(props.t)} y2={Y0 - selectedChildValue * YH} className="proportion-child" />
        </>}
      </>}
      <line x1={scale.x(props.t)} y1="20" x2={scale.x(props.t)} y2={Y0} className="t-guide" />
      <text x={scale.x(props.t) + 6} y="19" className="t-label">t</text>
      {knotGroups.map((group) => <g key={group.indices[0]}>
        <line x1={scale.x(group.value)} y1={Y0} x2={scale.x(group.value)} y2={Y0 + 7} className="knot-tick" />
        <text x={scale.x(group.value)} y="210" textAnchor="middle" className="knot-label">{group.indices.length === 1 ? `u${group.indices[0]}` : `u${group.indices[0]}–u${group.indices.at(-1)}`}</text>
      </g>)}
    </svg>
    {props.showRecursion && <div className="basis-legend">
      <span className="legend-target">N<sub>{selectedI},{selectedQ}</sub></span>
      {selectedQ > 0 && <><span className="legend-child-left">N<sub>{selectedI},{selectedQ - 1}</sub></span><span className="legend-child-right">N<sub>{selectedI + 1},{selectedQ - 1}</sub></span><span className="legend-term-left">left weighted term</span><span className="legend-term-right">right weighted term</span></>}
    </div>}
  </details>;
}
