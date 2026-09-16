Codexにて作成

# B-Spline / NURBS Learning App

An interactive visualization for learning how B-spline and NURBS curves are constructed.

The app connects the mathematical definition directly to the geometry on screen:

**knots → basis functions → control-point contributions → curve**

It is designed as a learning tool rather than a CAD editor.

## What you can explore

- How the degree `p` changes a spline
- How control points `P_i` influence the curve
- How the knot vector `U = (u_0, ..., u_m)` shapes the basis functions
- Which basis functions are active at the current parameter `t`
- How Cox–de Boor recursion constructs `N_{i,p}(t)`
- How repeated knots affect the curve and its basis functions
- How NURBS weights change rational basis functions `R_{i,p}(t)`
- Why NURBS can represent circles and other conic sections exactly
- How a NURBS curve is obtained by projecting a B-spline in homogeneous coordinates

## Main views

### Curve

Displays the spline, control polygon, draggable control points, and the current point `C(t)`.

The contribution bar shows how much each control point contributes at the current parameter. Colors remain consistent between control points, basis functions, weights, and contributions.

### Basis / Recursion

Displays the highest-degree basis functions together with the Cox–de Boor dependency graph.

Selecting a node or recurrence term highlights:

- the corresponding basis function
- its two child basis functions
- the weighted left and right recurrence terms
- the relevant knot interval
- the numerator distance at the current `t`

### Homogeneous coordinates

Available for NURBS presets. The interactive 3D view shows:

- homogeneous control points
- the homogeneous B-spline curve
- the `z = 1` projection plane
- the projection ray
- the resulting NURBS curve

The camera can be rotated and zoomed without interrupting parameter or weight editing.

## Interactive controls

- Drag control points directly in the Curve view.
- Move `t` to follow the curve and inspect changing contributions.
- Move individual knot sliders while knot ordering is preserved.
- Adjust positive NURBS weights independently.
- Select a control point, basis curve, recursion node, formula term, weight, or contribution segment to synchronize the related displays.
- Collapse the Basis functions, Knots and parameter, Weights, and Numerical values panels when more space is needed.

The Numerical values panel lists the current basis values, control-point coordinates, and `C(t)` coordinates. NURBS mode also lists the rational basis values.

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

Together, these presets demonstrate endpoint clamping, local support, non-uniform parameterization, knot multiplicity, the Bézier special case, rational weights, exact circles, and projective construction.

## Mathematical conventions

- Degree is written as `p`; order is `p + 1`.
- The valid parameter interval is `[u_p, u_{n+1}]`.
- The right endpoint is evaluated consistently as a left limit.
- A Cox–de Boor term with a zero denominator is defined as zero.
- Repeated knots never produce `NaN`.
- NURBS weights are positive.
