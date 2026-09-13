# astra-v3 review

## Why this change

The original site had five useful static pages, bilingual lesson text, a function grapher, two visual demonstrations, symbolic calculators, topic search, and nine practice questions. Inspection covered every tracked file at base commit `acaae8d84cfc0e8dd03594123f95ff8c9f01ccee` before site edits.

The original mobile breakpoint hid both chapter navigation and the sidebar. Several labels and headings did not switch languages. Practice solutions were short, the search index omitted lesson topics, and integral bounds converted empty strings to zero. Numerical failures could produce an empty result. Graphs lacked axis values and accessible descriptions; search lacked modal semantics; animations hid content until JavaScript succeeded.

## Changes

- Retain `index.html`, `limits.html`, `derivatives.html`, `integrals.html`, and `practice.html`, plus all original element IDs and deep links. Retain the legacy script unchanged.
- Expand the course to 28 main lesson sections, with rigorous hypotheses, ε–δ proofs, worked examples, implicit differentiation, MVT, global extrema, related rates, FTC applications, integration techniques, improper integrals, and error estimates.
- Expand nine exercises to 36, including bilingual reasoning, native revealable solutions, topic/difficulty filters, a progress indicator, and explicit completion saved in local storage.
- Add a limit laboratory, secant control, selectable tangent examples, derivative overlays, left/midpoint/right Riemann sums with errors, and a signed-versus-geometric-area laboratory. Retain and improve the function grapher.
- Validate calculator expressions and bounds, add derivative orders and optional point values, separate numerical and symbolic integral results, report estimated error, reject detected singularities, and isolate computation in a worker with timeout handling.
- Index 69 lesson, practice, and graph destinations. Search both languages and lesson content, with accessible native dialog semantics and keyboard opening/closing.
- Add native mobile navigation and collapsible contents, full interface translation, accessible labels and live outputs, skip navigation, visible focus styles, readable no-JavaScript notes and solutions, and reduced-motion support.
- Refine the academic serif typography, restrained green/ink palette, graph grid, cards, spacing, light/dark colors, and responsive layouts. Keep the static GitHub Pages architecture.
- Pin the existing math engines locally with licenses; remove their runtime CDN dependency. Add reproducible tests and a standard-library search-index generator.

## Verification (2026-09-13)

- `npm test`: 81 checks pass. This includes mathematical reference cases, invalid inputs, domain failures, real calculator-worker code, bilingual initialization, storage denial, search, completion, original anchor preservation, and local resource resolution.
- MathJax renders equations on all five pages with no TeX `merror` nodes.
- axe reports no violations in the tested WCAG A/AA structural rule set on the five page DOMs. This excludes browser-dependent color-contrast analysis.
- A separate palette test verifies ≥4.5:1 contrast for ink, muted text, accent, secondary accent, and error text on each theme’s main surfaces, plus primary button text.
- `npm run check`: JavaScript syntax passes and the committed search index matches the HTML.
- No production deployment, merge, or change to `main` is part of this work.

## Browser verification still required

The supplied cloud browser rejected the local preview URL with `net::ERR_BLOCKED_BY_CLIENT`. Therefore desktop/tablet/mobile screenshots, actual layout, native modal focus containment, touch interactions, and real-browser console/network behavior have **not** been verified. DOM tests use a canvas test double and do not prove pixel layout or visual graph accuracy.

Before merging, serve the branch and review at 1440, 768, 390, and 320 CSS pixels in both languages and themes:

1. Follow every page link and open/close the mobile menu and contents. Check that headings and equations do not cause page-level horizontal overflow.
2. Open search with Ctrl/Cmd + K, search Thai and English, tab through results, and close with Escape. Confirm focus returns to the opener.
3. Use each graph control by keyboard and touch. Check curve colors, dashed overlays, numeric labels, and redraw after resize/theme changes.
4. Calculate derivatives, indefinite integrals, reversed bounds, and a non-elementary integral such as `exp(-x^2)`. Verify `1/x` on `[-1,1]` is rejected numerically.
5. Reveal practice solutions, filter by topic/difficulty, mark completion, reload, and follow a direct exercise link while filters are active.
6. Inspect browser console and network errors, reduced-motion behavior, 200% zoom, Thai font fallback, and navigation with JavaScript disabled.

## Deliberate limits

This is a finite-interval educational calculator, not a general proof system. Sampling cannot detect every singularity or rapidly oscillating feature; estimated numerical error is not a convergence certificate. A symbolic antiderivative may be unavailable even when one exists. Optional Google Fonts need a network connection, with system fallbacks available.
