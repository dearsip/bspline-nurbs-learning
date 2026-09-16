import { useMemo, useRef, type PointerEvent } from "react";
import { evaluateBSplineCurve, evaluateNurbsCurve } from "../math/curve";
import type { SplineDefinition, Vec2 } from "../math/types";
import { validParameterRange } from "../math/basis";
import { indexColor, svgPath } from "../visual";
import { ContributionBar } from "./ContributionBar";

type Props = {
  definition: SplineDefinition;
  type: "bspline" | "nurbs";
  t: number;
  selectedIndex: number;
  hoveredIndex?: number;
  onMovePoint: (index: number, point: Vec2) => void;
  onSelect: (index: number) => void;
  onHover: (index?: number) => void;
  contributions: number[];
};

const W = 780;
const H = 430;
const PAD = 42;

function fitTransform(points: Vec2[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);
  const rangeX = Math.max(1e-6, maxX - minX);
  const rangeY = Math.max(1e-6, maxY - minY);
  const scale = Math.min((W - PAD * 2) / rangeX, (H - PAD * 2) / rangeY);
  const ox = (W - rangeX * scale) / 2 - minX * scale;
  const oy = (H - rangeY * scale) / 2 + maxY * scale;
  return {
    toScreen: (p: Vec2) => ({ x: ox + p.x * scale, y: oy - p.y * scale }),
    fromScreen: (p: Vec2) => ({ x: (p.x - ox) / scale, y: (oy - p.y) / scale }),
  };
}

export function CurveView(props: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const evaluation = props.type === "nurbs"
    ? evaluateNurbsCurve(props.definition, props.t)
    : evaluateBSplineCurve(props.definition, props.t);
  const [lower, upper] = validParameterRange(props.definition.knots, props.definition.controlPoints.length, props.definition.degree);
  // Keep the viewport fixed while dragging. Re-fitting to the point being moved
  // creates a feedback loop between screen and model coordinates.
  const transform = useMemo(
    () => fitTransform(props.definition.controlPoints),
    [props.definition.knots, props.definition.degree, props.definition.controlPoints.length],
  );
  const samples = useMemo(() => Array.from({ length: 241 }, (_, j) => {
    const t = lower + ((upper - lower) * j) / 240;
    const result = props.type === "nurbs" ? evaluateNurbsCurve(props.definition, t) : evaluateBSplineCurve(props.definition, t);
    return { t, span: result.span, point: transform.toScreen(result.point) };
  }), [lower, upper, props.definition, props.type, transform]);
  const screenPoints = props.definition.controlPoints.map(transform.toScreen);
  const current = transform.toScreen(evaluation.point);
  const activePath = svgPath(samples.filter((sample) => sample.span === evaluation.span).map((sample) => sample.point));

  function pointerPosition(event: PointerEvent<SVGGElement>): Vec2 {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return transform.fromScreen({
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    });
  }

  return (
    <section className="main-canvas" aria-label="Curve view">
      <div className="canvas-heading">
        <div><span className="eyebrow">GEOMETRY</span><h2>{props.type === "nurbs" ? "NURBS" : "B-spline"} curve</h2></div>
      </div>
      <svg ref={svgRef} className="curve-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Draggable control polygon and spline curve">
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#e7eaf0" strokeWidth="1" /></pattern></defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <path d={svgPath(screenPoints)} className="control-polygon" />
        <path d={svgPath(samples.map((sample) => sample.point))} className="curve-line" />
        {activePath && <path d={activePath} className="active-span-line" />}
        {screenPoints.map((point, i) => {
          const active = evaluation.activeIndices.includes(i);
          const selected = props.selectedIndex === i;
          const hovered = props.hoveredIndex === i;
          return (
            <g key={i} className="control-point" opacity={active ? 1 : 0.38}
              onPointerEnter={() => props.onHover(i)} onPointerLeave={() => props.onHover(undefined)}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                props.onSelect(i);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) props.onMovePoint(i, pointerPosition(event));
              }}>
              {(selected || hovered) && <circle cx={point.x} cy={point.y} r={selected ? 14 : 11} fill="none" stroke={indexColor(i)} strokeWidth={selected ? 3 : 2} />}
              <circle cx={point.x} cy={point.y} r="7" fill={indexColor(i)} stroke="white" strokeWidth="2" />
              <text x={point.x + 10} y={point.y - 10} fill={indexColor(i)}>P{i}</text>
            </g>
          );
        })}
        <circle cx={current.x} cy={current.y} r="7" className="current-point" />
        <text x={current.x + 11} y={current.y + 5} className="current-label">C(t)</text>
      </svg>
      <ContributionBar contributions={props.contributions} kind={props.type === "nurbs" ? "R" : "N"} selectedIndex={props.selectedIndex} onSelect={props.onSelect} />
    </section>
  );
}
