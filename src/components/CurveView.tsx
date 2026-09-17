import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { evaluateBSplineCurve, evaluateCurveAtBasisDegree, evaluateNurbsCurve } from "../math/curve";
import type { SplineDefinition, Vec2 } from "../math/types";
import { validParameterRange } from "../math/basis";
import { indexColor, svgPath } from "../visual";
import { ContributionBar } from "./ContributionBar";

type Props = {
  definition: SplineDefinition;
  type: "bspline" | "nurbs";
  t: number;
  focusDegree: number;
  selectedIndex?: number;
  hoveredIndex?: number;
  onMovePoint: (index: number, point: Vec2) => void;
  onT: (value: number) => void;
  onSelect: (index: number) => void;
  onClearSelection: () => void;
  onHover: (index?: number) => void;
  contributions: number[];
};

const PAD = 28;

function fitTransform(points: Vec2[], width: number, height: number) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = Math.max(1e-6, maxX - minX);
  const rangeY = Math.max(1e-6, maxY - minY);
  const scale = Math.min((width - PAD * 2) / rangeX, (height - PAD * 2) / rangeY);
  const ox = (width - rangeX * scale) / 2 - minX * scale;
  const oy = (height - rangeY * scale) / 2 + maxY * scale;
  return {
    toScreen: (p: Vec2) => ({ x: ox + p.x * scale, y: oy - p.y * scale }),
    fromScreen: (p: Vec2) => ({ x: (p.x - ox) / scale, y: (oy - p.y) / scale }),
  };
}

export function CurveView(props: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 780, height: 360 });
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => setViewport({
      width: Math.max(1, stage.clientWidth),
      height: Math.max(PAD * 2 + 1, stage.clientHeight),
    });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const originalEvaluation = props.type === "nurbs"
    ? evaluateNurbsCurve(props.definition, props.t)
    : evaluateBSplineCurve(props.definition, props.t);
  const evaluation = evaluateCurveAtBasisDegree(props.definition, props.t, props.focusDegree, props.type);
  const [lower, upper] = validParameterRange(props.definition.knots, props.definition.controlPoints.length, props.definition.degree);
  // Keep the viewport fixed while dragging. Re-fitting to the point being moved
  // creates a feedback loop between screen and model coordinates.
  const transform = useMemo(
    () => fitTransform(props.definition.controlPoints, viewport.width, viewport.height),
    [props.definition.knots, props.definition.degree, props.definition.controlPoints.length, viewport],
  );
  const originalSamples = useMemo(() => Array.from({ length: 241 }, (_, j) => {
    const t = lower + ((upper - lower) * j) / 240;
    const result = props.type === "nurbs" ? evaluateNurbsCurve(props.definition, t) : evaluateBSplineCurve(props.definition, t);
    return { t, span: result.span, point: transform.toScreen(result.point) };
  }), [lower, upper, props.definition, props.type, transform]);
  const focusedSamples = useMemo(() => Array.from({ length: 241 }, (_, j) => {
    const t = lower + ((upper - lower) * j) / 240;
    const result = evaluateCurveAtBasisDegree(props.definition, t, props.focusDegree, props.type);
    return { t, span: result.span, point: transform.toScreen(result.point) };
  }), [lower, upper, props.definition, props.focusDegree, props.type, transform]);
  const screenPoints = props.definition.controlPoints.map(transform.toScreen);
  const current = transform.toScreen(evaluation.point);
  const originalCurrent = transform.toScreen(originalEvaluation.point);
  const activePath = svgPath(focusedSamples.filter((sample) => sample.span === evaluation.span).map((sample) => sample.point));
  const focusedIsOriginal = props.focusDegree === props.definition.degree;
  const degreeZeroPoints = props.focusDegree === 0
    ? focusedSamples.reduce<Vec2[]>((points, sample) => {
      if (!points.some((point) => Math.abs(point.x - sample.point.x) < 1e-6 && Math.abs(point.y - sample.point.y) < 1e-6)) points.push(sample.point);
      return points;
    }, [])
    : [];

  function screenPointerPosition(event: PointerEvent<SVGElement>): Vec2 {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * viewport.width,
      y: ((event.clientY - rect.top) / rect.height) * viewport.height,
    };
  }

  function pointerPosition(event: PointerEvent<SVGElement>): Vec2 {
    return transform.fromScreen(screenPointerPosition(event));
  }

  function parameterAtScreenPoint(point: Vec2): number {
    let closestT = props.t;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < focusedSamples.length - 1; i += 1) {
      const a = focusedSamples[i];
      const b = focusedSamples[i + 1];
      const dx = b.point.x - a.point.x;
      const dy = b.point.y - a.point.y;
      const lengthSquared = dx * dx + dy * dy;
      const amount = lengthSquared <= 1e-12
        ? 0
        : Math.max(0, Math.min(1, ((point.x - a.point.x) * dx + (point.y - a.point.y) * dy) / lengthSquared));
      const x = a.point.x + amount * dx;
      const y = a.point.y + amount * dy;
      const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestT = a.t + amount * (b.t - a.t);
      }
    }
    return closestT;
  }

  return (
    <section className="main-canvas curve-canvas" aria-label="Curve view">
      <div className="canvas-heading" onClick={props.onClearSelection}>
        <div><span className="eyebrow">GEOMETRY</span><h2>{props.type === "nurbs" ? "NURBS" : "B-spline"} curve</h2></div>
      </div>
      <div ref={stageRef} className="curve-stage">
      <svg ref={svgRef} className="curve-svg" viewBox={`0 0 ${viewport.width} ${viewport.height}`} role="img" aria-label="Draggable control polygon and spline curve">
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#e7eaf0" strokeWidth="1" /></pattern></defs>
        <rect width={viewport.width} height={viewport.height} fill="url(#grid)" onPointerDown={props.onClearSelection} />
        <path d={svgPath(screenPoints)} className="control-polygon" />
        <path d={svgPath(originalSamples.map((sample) => sample.point))} className={focusedIsOriginal ? "curve-line" : "curve-line de-emphasized"} />
        {!focusedIsOriginal && props.focusDegree > 0 && <path d={svgPath(focusedSamples.map((sample) => sample.point))} className="degree-curve-line" />}
        {props.focusDegree > 0 && activePath && <path d={activePath} className={`active-span-line ${focusedIsOriginal ? "" : "focused-lower"}`} />}
        {screenPoints.map((point, i) => {
          const active = evaluation.activeIndices.includes(i);
          const selected = props.selectedIndex === i;
          const hovered = props.hoveredIndex === i;
          return (
            <g key={i} className="control-point" opacity={active ? 1 : 0.38}
              onPointerEnter={() => props.onHover(i)} onPointerLeave={() => props.onHover(undefined)}
              onPointerDown={(event) => {
                event.stopPropagation();
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
        {degreeZeroPoints.map((point, i) => <circle key={`${point.x}-${point.y}-${i}`} cx={point.x} cy={point.y} r="4.5" className="degree-zero-point" />)}
        {!focusedIsOriginal && <circle cx={originalCurrent.x} cy={originalCurrent.y} r="5" className="original-current-point" />}
        <g className={`current-marker ${props.focusDegree > 0 ? "draggable" : ""}`}
          onPointerDown={props.focusDegree > 0 ? (event) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
          } : undefined}
          onPointerMove={props.focusDegree > 0 ? (event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) props.onT(parameterAtScreenPoint(screenPointerPosition(event)));
          } : undefined}>
          <circle cx={current.x} cy={current.y} r="7" className="current-point" />
          <text x={current.x + 11} y={current.y + 5} className="current-label">{focusedIsOriginal ? "C(t)" : `C${props.focusDegree}(t)`}</text>
        </g>
      </svg>
      </div>
      <ContributionBar contributions={props.contributions} kind={props.type === "nurbs" ? "R" : "N"} selectedIndex={props.selectedIndex} onSelect={props.onSelect} />
    </section>
  );
}
