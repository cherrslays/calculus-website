# calculus-content-upgrade review

## GitHub Pages display repair — v3.1

The online symptom in which Thai and English appeared together and TeX delimiters such as `$$...$$` remained visible is consistent with stale or missing critical assets during deployment. Version 3.1 hardens every page against that failure mode:

- Each page contains a minimal inline language-visibility guard, so only the selected language is visible even before the main stylesheet finishes loading.
- Local styles and scripts use explicit version query strings to bypass stale GitHub Pages/browser caches after deployment.
- Local MathJax remains the primary renderer, with a pinned CDN fallback if the local bundle is unavailable.
- Thai font fallbacks now include native iOS and Windows choices.
- `.nojekyll` keeps GitHub Pages from processing the static tree through Jekyll.
- A regression test verifies the guard, versioned stylesheet, and MathJax fallback on all five pages.

Final verification after this repair: 97/97 regression tests, 60 answers / 97 independent mathematical checks, reproducible generated pages and search index, and HTTP loading of all five pages plus 11 required local assets.

## Scope and preserved behavior

Base: latest GitHub main, `bc80337b69b3fcae7146061ad16da8b2f2514065`. The audit inspected all five HTML pages, root JavaScript and CSS, asset references, existing explanations and all 36 previous exercises before implementation. Work is on `calculus-content-upgrade`; main and the live deployment were not modified.

The five-page static architecture, newer sans-serif typography, academic palette, Thai/English switching, theme preferences, native search dialog, mobile navigation/contents, calculators, function grapher, existing labs and explicit practice progress remain. A preservation test covers every previous element ID, including all 36 exercise IDs and their existing completion records. The unused legacy `script.js` remains unchanged.

## Important fixes

- Latest main referenced math.js and Nerdamer under `vendor/`, but that directory was absent. Restore the pinned, licensed engines from the known local astra-v3 work so graphs and calculator workers can start.
- Restore missing test/build scripts. Serve the restored local MathJax 3.2.2 bundle on every page so equation rendering does not depend on the CDN.
- Correct malformed nested prime notation in the curve-analysis second derivative and normalize derivative notation in solutions.
- Qualify direct-substitution advice: continuity must justify substitution, and a piecewise function's assigned value does not determine its limit.
- Expand terse exercises with explicit tasks, intermediate algebra, hints and final answers. Reclassify routine exercises so difficult/challenge labels represent multi-step work.
- Preserve completed numerical integration when symbolic work times out. Ignore messages from canceled workers, show successive derivative orders, and reject numerically indistinguishable tangent poles.
- Expand tangent graph bounds to retain both secant points. Add wrapping, equation/table scrolling, responsive graph sizing, accessible output text and native solution controls.
- Rebuild search from the DOM so nested exercise headings do not corrupt section titles; all 105 destinations have bilingual titles.
- Make the practice generator reproducible across repeated runs, without accumulating structural whitespace.

## Content and difficulty progression

The course now has 35 main lesson sections and 60 worked problems. All eight topics contain all four difficulty tiers:

| Topic | Basic | Intermediate | Difficult | Challenge | Total |
|---|---:|---:|---:|---:|---:|
| Limits | 4 | 6 | 3 | 1 | 14 |
| Continuity | 1 | 1 | 1 | 1 | 4 |
| Derivatives | 1 | 6 | 2 | 1 | 10 |
| Applications of derivatives | 2 | 3 | 2 | 1 | 8 |
| Integrals | 2 | 3 | 1 | 1 | 7 |
| Integration techniques | 2 | 3 | 2 | 1 | 8 |
| FTC and accumulation | 1 | 2 | 1 | 1 | 5 |
| Areas between curves | 1 | 1 | 1 | 1 | 4 |

The 24 new exercises cover:

- Parameter-dependent one-sided limits, a negative-infinity radical, double rationalization with squeeze.
- Continuity at two joins, IVT existence plus uniqueness, differentiability with a discontinuous derivative.
- Implicit second derivatives, logarithmic differentiation of a variable power, an arcsine composite requiring absolute values.
- A sliding ladder, an open-box global optimum, a complete quartic sketch.
- Recovering motion from acceleration, logarithmic improper tails, two improper endpoints.
- Repeated integration by parts, trigonometric substitution, repeated partial fractions.
- Two moving integration bounds, piecewise accumulation, exponential accumulation extrema and concavity.
- Crossing lobes, line/parabola area, horizontal slices.

Every problem includes a bilingual hint before a native collapsible solution, ordered reasoning, explicit final answer, difficulty/topic tags and manual completion. Difficult solutions show standard methods, domain restrictions, signs, intermediate algebra and endpoint comparisons. `content/practice.json` generates static practice HTML.

## Visuals and interactions

- Limit explorer: removable hole, jump, `1/x` pole and squeezed `x² sin(1/x)` oscillation, with envelope curves and two-sided numeric output.
- Quartic lab: marked extrema/inflections, movable point, first/second derivative graphs, slope and concavity descriptions.
- Between-curves lab: `x` with `x³`, or `2x+3` with `x²`; moving upper bound, signed difference, geometric area and each split region's contribution.
- Accumulation lab: integrand and shaded area paired with the accumulation graph and tangent, including a stationary point that is not an extremum.
- SVG triangle: back-substitution for `x=3 sin θ`, with the illustrated positive-x restriction stated.
- Existing function, tangent/secant, derivative, Riemann and signed-area tools remain. New controls and outputs respond to language, theme and viewport changes.

## Verification — 2026-09-14

- `npm test`: 96 passed, 0 failed. Includes real worker execution, cancellation/timeouts, expressions/domains, mathematical references, all pages in both languages, search, practice, saved state, old anchors, assets and graph controls.
- `python tests/audit-mathematics.py`: 60 answer records / 97 independent symbolic checks passed, using SymPy rather than the site's engines. Worked prose and theorem arguments were also reviewed. These checks corroborate selected claims, not every sentence automatically.
- MathJax renders equations across all five page DOMs without TeX error nodes. Additional checks reject malformed primes and interpreted TeX escapes.
- axe finds no violations in the tested WCAG A/AA structural rule set on all five pages. Browser-dependent color analysis is excluded; a separate test verifies theme text palette contrast of at least 4.5:1.
- Graph projections run at 224, 540 and 1000-pixel canvas widths without nonfinite drawing coordinates. This tests graph sizing, not actual CSS layout.
- `npm run check` validates JavaScript syntax and reproducibility of generated practice/search files. `git diff --check` passes.
- `python scripts/check-http.py`: all five pages and 11 complete local assets, including worker dependencies, load successfully over HTTP.

## Remaining limitations and browser review

The cloud browser rejected the local preview with `net::ERR_BLOCKED_BY_CLIENT`. Actual desktop/tablet/mobile layout, touch interactions, native modal focus containment, visual graph rendering, and browser console/network output could not be verified. DOM tests use jsdom and a canvas test double; no screenshot or real-browser pass is claimed.

Before merging, review at 1440, 768, 390 and 320 CSS pixels in both languages/themes. Check mobile navigation/contents, long equations and solutions, search/Escape/focus return, every graph slider, calculator errors/timeouts, practice filters and reload persistence, 200% zoom and reduced motion. Native hints/solutions and course text remain available without JavaScript.

The integral calculator targets continuous real functions on finite intervals. Sampling cannot certify continuity, find every narrow singularity or establish improper convergence. Symbolic primitives may be unavailable; an estimated error is not an exact answer. Finite graph sampling cannot resolve every oscillation. Optional Google Fonts have system fallbacks.
