import { lazy, Suspense, useMemo, useReducer } from "react";
import { PRESETS } from "./presets";
import { reducer, INITIAL_STATE } from "./state";
import { evaluateCurveAtBasisDegree } from "./math/curve";
import { CurveView } from "./components/CurveView";
import { BasisGraph } from "./components/BasisGraph";
import { ParameterPanel } from "./components/ParameterPanel";
import { FormulaInspector } from "./components/FormulaInspector";
import { RecursionView } from "./components/RecursionView";
import { ValuesPanel } from "./components/ValuesPanel";
const HomogeneousView = lazy(() => import("./components/HomogeneousView").then((module) => ({ default: module.HomogeneousView })));

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const definition = useMemo(() => ({ degree: state.degree, controlPoints: state.controlPoints, knots: state.knots, weights: state.weights }), [state.degree, state.controlPoints, state.knots, state.weights]);
  const focusDegree = Math.min(state.selectedBasis.degree, state.degree);
  const evaluation = evaluateCurveAtBasisDegree(definition, state.t, focusDegree, state.splineType);
  const highestEvaluation = evaluateCurveAtBasisDegree(definition, state.t, state.degree, state.splineType);
  const contributions = state.splineType === "nurbs" ? evaluation.rationalBasis : evaluation.basis;
  const highestContributions = state.splineType === "nurbs" ? highestEvaluation.rationalBasis : highestEvaluation.basis;
  const focusOffset = state.degree - focusDegree;
  const selectedIndex = Math.min(Math.max(0, state.selectedBasis.i - focusOffset), state.controlPoints.length - 1);
  const hoveredControlIndex = state.hoveredIndex === undefined
    ? undefined
    : state.hoveredIndex - focusOffset;

  return <main className="app-shell">
    <header className="app-header"><div className="brand"><div className="brand-mark">B<sup>p</sup></div><h1>B-Spline / NURBS Learning Tool</h1></div><div className="header-status"><span className="status-dot" /> interactive lesson</div></header>
    <section className="toolbar" aria-label="Spline controls">
      <label><span>Type</span><select value={state.splineType} onChange={(e) => dispatch({ type: "setSplineType", value: e.target.value as "bspline" | "nurbs" })}><option value="bspline">B-Spline</option><option value="nurbs">NURBS</option></select></label>
      <label><span>Degree p <small>(order = {state.degree + 1})</small></span><select value={state.degree} onChange={(e) => dispatch({ type: "setDegree", value: Number(e.target.value) })}>{[1,2,3,4,5].map((degree) => <option key={degree} value={degree} disabled={degree >= state.controlPoints.length}>{degree}</option>)}</select></label>
      <label><span>Control points</span><select value={state.controlPoints.length} onChange={(e) => dispatch({ type: "setPointCount", value: Number(e.target.value) })}>{Array.from({ length: 12 - state.degree }, (_, i) => state.degree + 1 + i).map((count) => <option key={count}>{count}</option>)}</select></label>
      <label className="preset-control"><span>Preset</span><select value={state.presetId ?? "custom"} onChange={(e) => { const preset = PRESETS.find((item) => item.id === e.target.value); if (preset) dispatch({ type: "loadPreset", preset }); }}><option value="custom" disabled>Custom curve</option>{PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label>
      <button className="secondary reset-button" onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </section>
    <nav className="view-tabs" aria-label="Main view"><button className={state.viewMode !== "homogeneous" ? "active" : ""} onClick={() => dispatch({ type: "setView", value: "curve" })}>Curve</button><button className={state.viewMode === "homogeneous" ? "active" : ""} disabled={state.splineType !== "nurbs"} onClick={() => dispatch({ type: "setView", value: "homogeneous" })}>Homogeneous</button></nav>
    <div className="workspace">
      {state.viewMode !== "homogeneous" && <CurveView definition={definition} type={state.splineType} t={state.t} focusDegree={focusDegree} contributions={contributions} selectedIndex={state.basisSelectionActive ? selectedIndex : undefined} hoveredIndex={hoveredControlIndex} onMovePoint={(index, point) => dispatch({ type: "movePoint", index, point })} onT={(value) => dispatch({ type: "setT", value })} onSelect={(i) => dispatch({ type: "selectBasis", i: i + focusOffset, degree: focusDegree })} onClearSelection={() => dispatch({ type: "clearBasisSelection" })} onHover={(value) => dispatch({ type: "hoverIndex", value: value === undefined ? undefined : value + focusOffset })} />}
      {state.viewMode === "homogeneous" && state.splineType === "nurbs" && <Suspense fallback={<section className="main-canvas loading-canvas">…</section>}><HomogeneousView definition={definition} t={state.t} contributions={highestContributions} selectedIndex={selectedIndex} onSelect={(i) => dispatch({ type: "selectBasis", i })} /></Suspense>}
      <FormulaInspector definition={definition} splineType={state.splineType} t={state.t} selected={state.selectedBasis} selectionActive={state.basisSelectionActive} term={state.selectedFormulaTerm} onTerm={(value) => dispatch({ type: "selectTerm", value })} />
    </div>
    <RecursionView definition={definition} t={state.t} selected={state.selectedBasis} selectionActive={state.basisSelectionActive} selectedTerm={state.selectedFormulaTerm} onSelect={(i, degree) => dispatch({ type: "selectBasis", i, degree })} onClearSelection={() => dispatch({ type: "clearBasisSelection" })} onTerm={(value) => dispatch({ type: "selectTerm", value })} />
    <BasisGraph definition={definition} type={state.splineType} t={state.t} selected={state.selectedBasis} selectionActive={state.basisSelectionActive} selectedTerm={state.selectedFormulaTerm} hoveredIndex={state.hoveredIndex} showN={state.showN} showR={state.showR} showOtherBasis={state.showOtherBasis} onSelect={(i, degree) => dispatch({ type: "selectBasis", i, degree })} onHover={(value) => dispatch({ type: "hoverIndex", value })} onToggleN={() => dispatch({ type: "toggleN" })} onToggleR={() => dispatch({ type: "toggleR" })} onToggleOtherBasis={() => dispatch({ type: "toggleOtherBasis" })} />
    <ParameterPanel definition={definition} type={state.splineType} t={state.t} selectedIndex={selectedIndex} hoveredIndex={hoveredControlIndex} onKnot={(index, value) => dispatch({ type: "setKnot", index, value })} onT={(value) => dispatch({ type: "setT", value })} onWeight={(index, value) => dispatch({ type: "setWeight", index, value })} onResetWeights={() => dispatch({ type: "resetWeights" })} onSelect={(i) => dispatch({ type: "selectBasis", i })} />
    <ValuesPanel definition={definition} evaluation={evaluation} type={state.splineType} basisDegree={focusDegree} basisIndexOffset={focusOffset} />
    <footer>
      <a href="https://github.com/dearsip/bspline-nurbs-learning" target="_blank" rel="noreferrer">
        GitHub repository
      </a>
    </footer>
  </main>;
}
