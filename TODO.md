# Implementation milestones

## Milestone 0 — Repository health

- [x] Run `npm install` and commit `package-lock.json`.
- [x] Change Pages workflow install step to `npm ci` and enable npm caching after `package-lock.json` exists.
- [x] Confirm `npm test` passes.
- [x] Confirm `npm run build` passes.
- [x] Confirm app can be served from a non-root Vite `base`.
- [ ] Add lint configuration if useful; do not block math/UI work on stylistic linting.

## Milestone 1 — Mathematical core

- [x] Review `src/math/` for correctness.
- [x] Add partition-of-unity tests across several `t` values.
- [x] Add local-support tests.
- [x] Add repeated-knot tests.
- [x] Add open-clamped endpoint tests.
- [x] Add NURBS == B-spline test for all weights = 1.
- [x] Add quarter-circle test.
- [x] Add homogeneous projection equivalence test.
- [x] Decide/document exact right-endpoint evaluation convention.

## Milestone 2 — State + shared geometry

- [x] Implement central `AppState` + reducer.
- [x] Keep derived math out of persistent state.
- [x] Implement one shared parameter-axis scale helper.
- [x] Implement stable index color assignment.
- [x] Implement preset loading and global reset.
- [x] Implement B-spline / NURBS switch.

## Milestone 3 — Core 2D learning UI

- [x] Curve view as SVG.
- [x] Drag control points.
- [x] Control polygon and `C(t)`.
- [x] Active control points.
- [x] Active knot-span curve segment.
- [x] Basis graph.
- [x] Selected basis support.
- [x] Vertically stacked knot sliders.
- [x] Enforce `u_{i-1} <= u_i <= u_{i+1}`.
- [x] `t` slider with valid interval only.
- [x] Vertical `t` guide line through knot/basis areas.
- [x] Contribution bar.
- [x] Cross-view hover/selection synchronization.

## Milestone 4 — Cox–de Boor teaching view

- [x] Basis overview submode.
- [x] Recursion triangular DAG.
- [x] Shared nodes; no duplicate equivalent nodes.
- [x] Show symbolic node label + current value.
- [x] Formula inspector.
- [x] Separately clickable left/right recurrence terms.
- [x] Highlight corresponding recursion edge.
- [x] Highlight relevant knot interval and numerator subinterval.
- [x] Degree-zero piecewise definition.
- [x] Zero-denominator educational note.
- [ ] Optional "Used by" complementary-coefficient view.

## Milestone 5 — NURBS

- [x] Positive weight sliders.
- [x] Reset weights.
- [x] Rational basis graph `R`.
- [x] `N` vs `R` display toggles.
- [x] NURBS formula inspector.
- [x] Synchronize `w_i`, `N_i`, `R_i`, `P_i`, contribution bar.
- [x] Confirm changing weights does not alter `N_i`.

## Milestone 6 — Homogeneous-coordinate view

- [x] Three.js scene.
- [x] OrbitControls.
- [x] Origin and `z = 1` plane.
- [x] Homogeneous control points `P_i^H`.
- [x] Homogeneous control polygon.
- [x] Homogeneous B-spline.
- [x] Current `C^H(t)`.
- [x] Projection ray.
- [x] Projected NURBS on `z = 1`.
- [x] Camera reset.
- [x] Resize handling and disposal.

## Milestone 7 — Presets + polish

- [x] Linear B-spline.
- [x] Quadratic B-spline.
- [x] Open uniform cubic.
- [x] Non-uniform cubic.
- [x] Repeated internal knot.
- [x] Bézier special case.
- [x] NURBS quarter circle.
- [x] NURBS circle.
- [x] Keyboard/focus accessibility.
- [x] Tablet responsive layout.
- [x] Short explanatory labels/tooltips where useful.
- [x] Avoid persistent multiplicity/continuity clutter.

## Milestone 8 — Release

- [x] `npm test`
- [x] `npm run build`
- [x] Test project Pages URL (`/REPO/` base).
- [ ] Test user Pages/root URL behavior if relevant.
- [ ] Enable Settings → Pages → GitHub Actions.
- [ ] Deploy from `main`.
- [ ] Add screenshot and short usage explanation to README.
