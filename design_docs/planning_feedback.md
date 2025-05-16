# Feedback on NNCircuit V2 Planning Documents

This document contains feedback and suggestions for the `implementation_plan.md` and `testing_methodology.md` for NNCircuit V2.

## Feedback on `implementation_plan.md`

The implementation plan is well-structured and covers the key areas for development. The phased approach is sensible.

**Suggestions:**

1.  **Parameter Scope Inheritance:**
    *   Under "Open Questions," the plan asks: "Should we implement parameter scope inheritance?".
    *   However, `diagram_format_v2.md` (in "Implementation Notes" -> "Parameter Resolution") states: "Parent module parameters can be referenced in child module instantiations."
    *   Additionally, `requirements.md` lists "Parameter scope inheritance from parent to child modules" as a "Future Enhancement."
    *   **Recommendation:** Clarify if this is a firm V2 requirement or a future goal. If it's for V2 (as `diagram_format_v2.md` implies for implementation), it should be part of the planned features in Phase 1 or 2 rather than an open question. Assuming `diagram_format_v2.md` is the more current spec for V2 implementation, it should be treated as a requirement.

2.  **Expression Evaluation Timing:**
    *   The open question "Should we evaluate expressions at load time or runtime?" is good.
    *   **Recommendation:** The plan could briefly state the initial assumption. For example: "Expressions (e.g., for parameters, conditional logic in loops) will be evaluated primarily at the time of module loading and component generation, before rendering. Dynamic runtime updates of a rendered diagram based on parameter changes are a potential future enhancement if deemed necessary." This aligns with the description of how parameters and loops are used.

3.  **Build and Bundling:**
    *   The "Technology Stack" mentions Node.js for "build tools."
    *   **Recommendation:** Briefly specify the planned module bundler (e.g., Webpack, Rollup, Parcel) if decided. This helps in understanding the development setup for `viewer.js`.

4.  **State Management for UI:**
    *   The plan mentions "view state management" for the compression toggle.
    *   **Recommendation:** Consider a brief, general note on how UI state (current module, zoom/pan state, etc.) will be managed, especially if it might grow in complexity. For now, a simple vanilla JS approach might be fine, but acknowledging it can be useful.

5.  **Error Handling (General):**
    *   The plan mentions error handling for expressions.
    *   **Recommendation:** A small note on a general strategy for handling other errors (e.g., malformed JSON, unresolved component/port references) and how they might be communicated to the user could be beneficial.

6.  **Accessibility (A11y):**
    *   While not a core requirement listed, it's always good to keep in mind.
    *   **Recommendation:** Perhaps add a note under "Future Enhancements" or as a low-priority consideration for making the SVG output more accessible (e.g., ARIA roles, attributes for inspectable elements).

## Feedback on `testing_methodology.md`

This is a very solid testing plan, outlining good tools and categories. The TDD approach and CI integration are excellent.

**Suggestions:**

1.  **Visual Regression Testing - Snapshots:**
    *   The plan mentions "Snapshot Testing" in `implementation_plan.md` ("Capture rendered SVG snapshots", "Compare against reference images") and `testing_methodology.md` has a Jest example: `expect(container).toMatchSnapshot();`.
    *   Jest's `toMatchSnapshot()` typically serializes a DOM structure or JavaScript object. For SVG, this would mean snapshotting the SVG's string representation, which can be brittle to non-functional changes (like attribute order).
    *   If the goal is true *visual* (pixel-level) regression, tools like Cypress with an image snapshot plugin (e.g., `cypress-image-snapshot`) are more common.
    *   **Recommendation:** Clarify the primary method for visual regression.
        *   If using Jest for SVG structure snapshots: Acknowledge its potential brittleness and focus on key structural elements.
        *   If using image-based snapshots (as "compare against reference images" implies): Specify this and mention the relevant Cypress plugin or tool. This would align better with testing the *visual* output. The "Visual Regression Reports" section could then refer to image diffs.

2.  **Schema Validation (`Ajv`):**
    *   The plan states Ajv will be used for JSON schema validation and "Enable runtime validation of user-provided diagrams."
    *   **Recommendation:** Briefly mention if there will also be a pre-commit hook or a CI step to validate example JSON files in the repository using this schema.

3.  **Cypress Configuration Path:**
    *   `cypress.json` has `"integrationFolder": "test/e2e"`.
    *   The project structure in `implementation_plan.md` shows `test/integration/`.
    *   The CI script runs `npm run test:e2e`.
    *   **Recommendation:** Ensure consistency in naming/paths (e.g., use `test/e2e` in the project structure or change Cypress config to `test/integration`). This is a minor detail.

4.  **Testing Parameter Logic:**
    *   Given the importance of parameters:
    *   **Recommendation:** Explicitly list test categories for:
        *   Parameter overriding (instance vs. definition).
        *   Parameter scope inheritance (if confirmed as a V2 feature).
        *   Resolution of `${PARAM_NAME}` and expressions within various fields (port sizes, labels, loop ranges, connection strings).

5.  **Component Loop Edge Cases:**
    *   The example test for component loops is good.
    *   **Recommendation:** Add a note to ensure testing of edge cases for `component_loops`, such as:
        *   Empty `range` (e.g., `[0, -1]` or `[1, 0]`).
        *   Loops generating zero components.
        *   Complex conditional logic within looped component definitions.
        *   Correct substitution of the iterator in nested expressions.

6.  **Performance Testing:**
    *   `implementation_plan.md` rightly includes "Performance Considerations."
    *   **Recommendation:** Consider adding a small section or a bullet point in `testing_methodology.md` about potential performance testing, even if it's basic initially (e.g., using Cypress to measure load/render times for complex diagrams, or manual profiling). This could be under "Future Enhancements" for testing if not immediate.

7.  **Mocking D3.js for Unit Tests:**
    *   "Mock Renderer: For testing layout without D3.js dependency" is a good idea.
    *   **Recommendation:** If specific D3 functionalities (like selections or scales) are heavily used by logic that needs unit testing in isolation, briefly mention that these might also need targeted mocking.

---

Overall, these are excellent planning documents. The suggestions above are intended to be minor refinements or points for further clarification.