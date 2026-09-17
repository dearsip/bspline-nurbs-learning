import { evaluateBasisTable } from "../math/basis";
import type { SplineDefinition } from "../math/types";
import type { FormulaTerm } from "../state";
import { indexColor } from "../visual";

type Props = {
  definition: SplineDefinition;
  t: number;
  selected: { i: number; degree: number };
  selectionActive: boolean;
  selectedTerm?: FormulaTerm;
  onSelect: (i: number, degree: number) => void;
  onClearSelection: () => void;
  onTerm: (term: FormulaTerm) => void;
};

const NODE_WIDTH = 110;
const NODE_HEIGHT = 44;
const COLUMN_STEP = 134;
const ROW_STEP = 66;
const MARGIN = 28;

export function RecursionView(props: Props) {
  const table = evaluateBasisTable(props.definition.knots, props.definition.controlPoints.length, props.definition.degree, props.t);
  const p = props.definition.degree;
  const nodes = Array.from({ length: p + 1 }, (_, depth) => {
    const q = p - depth;
    return table.levels[q].map((_, i) => ({ i, q }));
  }).flat();
  const maxCount = table.levels[0].length;
  const width = MARGIN * 2 + NODE_WIDTH + (maxCount - 1) * COLUMN_STEP;
  const height = MARGIN * 2 + NODE_HEIGHT + p * ROW_STEP;
  const focusedDegree = Math.min(props.selected.degree, p);
  const trim = p - focusedDegree;
  const isDimmedNode = (i: number, q: number) => focusedDegree < p && (
    q > focusedDegree
    || i < trim
    || i >= table.levels[q].length - trim
  );
  const pos = (i: number, q: number) => ({
    x: MARGIN + NODE_WIDTH / 2 + (i + q / 2) * COLUMN_STEP,
    y: MARGIN + NODE_HEIGHT / 2 + (p - q) * ROW_STEP,
  });

  return <details className="recursion-card collapsible-card" open>
    <summary className="section-title-row"><div><span className="eyebrow">COX–DE BOOR</span><h2>Basis / Recursion</h2></div></summary>
    <div className="recursion-scroll">
      <svg className="recursion-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="All Cox–de Boor basis functions and dependencies">
        <rect width={width} height={height} fill="transparent" onClick={props.onClearSelection} />
        {nodes.filter((node) => node.q > 0).flatMap((node) => ([
          { parent: node, side: "left" as const, child: { i: node.i, q: node.q - 1 } },
          { parent: node, side: "right" as const, child: { i: node.i + 1, q: node.q - 1 } },
        ])).map(({ parent, side, child }, key) => {
          const a = pos(parent.i, parent.q);
          const b = pos(child.i, child.q);
          const selectedEdge = props.selectionActive && parent.i === props.selected.i && parent.q === props.selected.degree && props.selectedTerm === side;
          const dimmed = isDimmedNode(parent.i, parent.q) || isDimmedNode(child.i, child.q);
          return <g key={key} className={`dag-edge-group ${dimmed ? "dimmed" : ""}`} onClick={(event) => {
            event.stopPropagation();
            if (!props.selectionActive || props.selected.i !== parent.i || props.selected.degree !== parent.q) props.onSelect(parent.i, parent.q);
            props.onTerm(side);
          }}>
            <line x1={a.x} y1={a.y + NODE_HEIGHT / 2} x2={b.x} y2={b.y - NODE_HEIGHT / 2} className={selectedEdge ? "dag-edge selected" : "dag-edge"} />
            <line x1={a.x} y1={a.y + NODE_HEIGHT / 2} x2={b.x} y2={b.y - NODE_HEIGHT / 2} className="dag-edge-hit" />
          </g>;
        })}
        {nodes.map(({ i, q }) => {
          const point = pos(i, q);
          const isChild = props.selectionActive && props.selectedTerm === "left"
            ? i === props.selected.i && q === props.selected.degree - 1
            : props.selectionActive && props.selectedTerm === "right"
              ? i === props.selected.i + 1 && q === props.selected.degree - 1
              : false;
          const selected = props.selectionActive && props.selected.i === i && props.selected.degree === q;
          const highest = q === p;
          const dimmed = !selected && isDimmedNode(i, q);
          const controlIndex = q === p
            ? i
            : q === focusedDegree && focusedDegree < p && !isDimmedNode(i, q)
              ? i - trim
              : undefined;
          return <g key={`${i}-${q}`} transform={`translate(${point.x},${point.y})`} onClick={(event) => { event.stopPropagation(); props.onSelect(i, q); }} className={`dag-node ${highest ? "highest" : ""} ${dimmed ? "dimmed" : ""}`} role="button" tabIndex={0}>
            <rect x={-NODE_WIDTH / 2} y={-NODE_HEIGHT / 2} width={NODE_WIDTH} height={NODE_HEIGHT} rx="8" className={selected || isChild ? "selected" : ""} style={highest ? { stroke: indexColor(i) } : undefined} />
            <text textAnchor="middle" y="-2" style={highest ? { fill: indexColor(i) } : undefined}>N{i},{q}(t)</text>
            <text textAnchor="middle" y="14" className="dag-value">{(table.levels[q][i] ?? 0).toFixed(4)}</text>
            {controlIndex !== undefined && <text textAnchor="middle" y={-NODE_HEIGHT / 2 - 8} className="dag-point-label" style={{ fill: indexColor(controlIndex) }}>P{controlIndex}</text>}
          </g>;
        })}
        {props.definition.knots.map((_, i) => {
          const firstBottom = pos(0, 0);
          return <text key={`knot-${i}`} x={firstBottom.x + (i - .5) * COLUMN_STEP} y={height - 7} textAnchor="middle" className="dag-knot-label">u{i}</text>;
        })}
      </svg>
    </div>
  </details>;
}
