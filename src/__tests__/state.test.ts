import { describe, expect, it } from "vitest";
import { INITIAL_STATE, reducer } from "../state";

describe("application interaction state", () => {
  it("keeps the recursion root when a child node is selected", () => {
    const rootSelected = reducer(INITIAL_STATE, { type: "selectBasis", i: 2, degree: 3 });
    const childSelected = reducer(rootSelected, { type: "selectBasis", i: 3, degree: 2 });

    expect(childSelected.recursionRoot).toEqual({ i: 2, degree: 3 });
    expect(childSelected.selectedBasis).toEqual({ i: 3, degree: 2 });
    expect(childSelected.basisSelectionActive).toBe(true);
    expect(childSelected.showOtherBasis).toBe(false);
  });

  it("enforces knot ordering and the valid t interval in the reducer", () => {
    const movedKnot = reducer(INITIAL_STATE, { type: "setKnot", index: 4, value: 0.9 });
    expect(movedKnot.knots[4]).toBeLessThanOrEqual(movedKnot.knots[5]);

    const narrowed = { ...INITIAL_STATE, knots: [0, 0, 0, 0.2, 0.4, 0.7, 0.8, 1, 1, 1] };
    expect(reducer(narrowed, { type: "setT", value: 0 }).t).toBe(0.2);
    expect(reducer(narrowed, { type: "setT", value: 1 }).t).toBe(0.8);
  });

  it("keeps the focus degree while toggling selection and other-basis display independently", () => {
    const focused = reducer(INITIAL_STATE, { type: "selectBasis", i: 1, degree: 2 });
    const cleared = reducer(focused, { type: "selectBasis", i: 1, degree: 2 });
    expect(cleared.basisSelectionActive).toBe(false);
    expect(cleared.selectedBasis.degree).toBe(2);

    const shown = reducer(cleared, { type: "toggleOtherBasis" });
    expect(shown.showOtherBasis).toBe(true);
    expect(reducer(shown, { type: "selectBasis", i: 2, degree: 2 }).showOtherBasis).toBe(true);
    expect(reducer(shown, { type: "setView", value: "curve" }).showOtherBasis).toBe(true);
  });
});
