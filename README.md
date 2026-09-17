Codexにて作成

# B-Spline / NURBS Learning Tool

An interactive visualization for understanding how B-spline and NURBS curves are built from their mathematical definitions.

The app connects each stage of the construction:

**knot vector → basis functions → control-point contributions → curve**

It is intended as a learning tool rather than a general-purpose spline or CAD editor.

## What you can explore

- How degree, control points, and the knot vector determine a B-spline curve
- How Cox–de Boor recursion builds higher-degree basis functions from lower-degree functions
- How local support limits the part of a curve affected by each control point
- How repeated knots change basis functions and curve continuity
- How curves of successive degrees relate to the final spline
- How NURBS weights turn polynomial basis functions into rational basis functions
- Why rational splines can represent circles and other conic sections exactly
- How homogeneous projection produces a NURBS curve

## Curve view

The Curve view places the geometry and the current parameter value together.

- Drag control points and see the curve update immediately.
- Drag `C(t)` directly along a continuous curve to change `t`, or use the parameter slider.
- Resize the curve canvas vertically to compare it with the panels below.
- Select a lower-degree basis function to display the corresponding intermediate curve and point.
- At degree zero, inspect the construction as discrete points rather than connected segments.
- Compare the control-point contribution bar with the curve at the current parameter.
- Follow consistent index colors across control points, basis functions, weights, and contributions.

## Basis functions and recursion

The Basis / Recursion panel shows every level of the Cox–de Boor construction in one horizontally scrollable dependency graph.

- The nodes retain index colors at the highest degree and form a staggered recursion pyramid.
- Control-point labels above the graph and knot labels below it clarify how indices shift between degrees.
- Selecting a node focuses the Curve and Basis functions panels on that degree.
- A selection displays the chosen basis function, its child functions, and the two weighted recurrence terms.
- Enable **other basis** to retain the other functions of the selected degree while inspecting the recursion.
- Click the selected node again, or click empty space in the Curve or Basis / Recursion panel, to clear the selection while keeping that degree in focus.
- Select a recurrence edge or formula term to highlight its knot interval, numerator distance, and proportional weighted contribution.

The Basis functions graph shares the same parameter direction as the knot and `t` controls. It can display knot positions, the current parameter, the selected support, child functions, weighted terms, and their sum.

## NURBS and homogeneous coordinates

In NURBS mode, each weight can be edited independently while the polynomial basis `N` and rational basis `R` remain available for comparison.

The Homogeneous view shows:

- homogeneous control points
- the homogeneous B-spline curve
- the `z = 1` projection plane
- the projection ray at the current parameter
- the projected NURBS curve

The 3D camera position is preserved while parameters and weights are edited.

## Controls and inspection

- Choose the spline type, degree, control-point count, and preset.
- Edit ordered knots and positive NURBS weights with sliders.
- Move `t` with its slider or by dragging the current curve point.
- Select related objects across the curve, basis graph, recursion graph, formulas, weights, and contributions.
- Collapse individual panels—including Basis / Recursion, Selected basis, Basis functions, Knots and parameter, Weights, and Numerical values—to keep the relevant views together.
- Inspect numerical basis values, rational basis values, control-point coordinates, and the current curve point at the bottom of the page.

## Presets

1. Linear B-spline
2. Quadratic B-spline
3. Open uniform cubic B-spline
4. Unclamped uniform cubic B-spline
5. Non-uniform cubic B-spline
6. Repeated internal knot
7. High-multiplicity repeated knot
8. Bézier as a B-spline
9. Local support / local control
10. NURBS quarter circle
11. NURBS circle
12. Conic by weight

Together, the presets cover endpoint clamping, local support, non-uniform parameterization, knot multiplicity, the Bézier special case, rational weights, exact circles, and projective construction.

## Mathematical conventions

- Degree is written as `p`; order is `p + 1`.
- The valid parameter interval is `[u_p, u_{n+1}]`.
- The right endpoint is evaluated consistently as a left limit.
- A Cox–de Boor term with a zero denominator is defined as zero.
- Repeated knots never produce `NaN`.
- NURBS weights are finite and positive.
- Lower-degree comparisons trim the knot vector symmetrically and associate the surviving basis row with the first control points.
