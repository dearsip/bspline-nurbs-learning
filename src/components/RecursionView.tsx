import { evaluateBasisTable } from "../math/basis";
import type { SplineDefinition } from "../math/types";
import type { FormulaTerm } from "../state";
import { indexColor } from "../visual";

type Props = {
  definition: SplineDefinition;
  t: number;
  selected: { i: number; degree: number };
  root: { i: number; degree: number };
  selectedTerm?: FormulaTerm;
  onSelect: (i: number, degree: number) => void;
  onTerm: (term: FormulaTerm) => void;
};

export function RecursionView(props: Props) {
  const table = evaluateBasisTable(props.definition.knots, props.definition.controlPoints.length, props.definition.degree, props.t);
  const p = props.definition.degree;
  const rootI = Math.min(props.root.i, props.definition.controlPoints.length - 1);
  const overviewNodes = props.definition.controlPoints.map((_, i) => ({ i, q: p }));
  const nodes = Array.from({ length: p + 1 }, (_, depth) => Array.from({ length: depth + 1 }, (__, offset) => ({ i: rootI + offset, q: p - depth }))).flat();
  const pos = (i: number, q: number) => {
    const depth = p - q;
    const offset = i - rootI;
    return { x: 390 + (offset - depth / 2) * 145, y: 76 + depth * 98 };
  };

  return <section className="main-canvas recursion-canvas">
    <div className="canvas-heading"><div><span className="eyebrow">COX–DE BOOR</span><h2>Basis / Recursion</h2></div></div>
    <div className="basis-overview">{overviewNodes.map(({ i, q }) => <button key={i} style={{ borderColor: indexColor(i) }} className={props.root.i === i ? "selected" : ""} onClick={() => props.onSelect(i, q)}><span>N<sub>{i},{q}</sub>(t)</span><strong>{(table.levels[q][i] ?? 0).toFixed(5)}</strong></button>)}</div>
    <div className="recursion-heading"><span className="eyebrow">RECURSION</span></div>
    <svg className="recursion-svg" viewBox={`0 0 780 ${120 + (p + 1) * 98}`} role="img" aria-label="Shared-node recursion dependency graph">
      {nodes.filter((node) => node.q > 0).flatMap((node) => ([
        { side: "left" as const, child: { i: node.i, q: node.q - 1 } },
        { side: "right" as const, child: { i: node.i + 1, q: node.q - 1 } },
      ])).map(({ side, child }, key) => {
        const parentQ = child.q + 1;
        const parentI = side === "left" ? child.i : child.i - 1;
        const a = pos(parentI, parentQ); const b = pos(child.i, child.q);
        const selectedEdge = parentI === props.selected.i && parentQ === props.selected.degree && props.selectedTerm === side;
        return <g key={key} className="dag-edge-group" onClick={() => { props.onSelect(parentI, parentQ); props.onTerm(side); }}>
          <line x1={a.x} y1={a.y + 26} x2={b.x} y2={b.y - 26} className={selectedEdge ? "dag-edge selected" : "dag-edge"} />
          <line x1={a.x} y1={a.y + 26} x2={b.x} y2={b.y - 26} className="dag-edge-hit" />
        </g>;
      })}
      {nodes.map(({ i, q }) => {
        const point = pos(i, q);
        const isChild = props.selectedTerm === "left"
          ? i === props.selected.i && q === props.selected.degree - 1
          : props.selectedTerm === "right"
            ? i === props.selected.i + 1 && q === props.selected.degree - 1
            : false;
        const selected = props.selected.i === i && props.selected.degree === q;
        return <g key={`${i}-${q}`} transform={`translate(${point.x},${point.y})`} onClick={() => props.onSelect(i, q)} className="dag-node" role="button" tabIndex={0}>
          <rect x="-57" y="-26" width="114" height="52" rx="8" className={selected || isChild ? "selected" : ""} />
          <text textAnchor="middle" y="-3">N{i},{q}(t)</text><text textAnchor="middle" y="16" className="dag-value">{(table.levels[q][i] ?? 0).toFixed(4)}</text>
        </g>;
      })}
    </svg>
  </section>;
}
