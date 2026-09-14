# Calculus Atlas

Version 3.1 adds deployment hardening for GitHub Pages: cache-busted critical assets, an inline language-visibility guard, a MathJax CDN fallback, and improved Thai system-font fallbacks. These prevent stale or missing assets from exposing both translations or raw TeX during deployment.

A Thai/English single-variable calculus learning platform for GitHub Pages. This upgrade extends the existing site at `bc80337`, including its newer sans-serif typography, and preserves all five page URLs and existing anchors.

## Learn

- `index.html`: course overview, prerequisites, navigation and function grapher.
- `limits.html`: limit laws, continuity and discontinuity classification, infinity, ε–δ proofs, squeeze, L’Hôpital and four interactive limit examples.
- `derivatives.html`: first principles, rules, tangent/secant/derivative lab, implicit and logarithmic differentiation, inverse functions, higher derivatives, MVT, related rates, optimization, linear approximation, Newton’s method and a quartic analysis lab.
- `integrals.html`: Riemann sums, antiderivatives, FTC with hypotheses, substitution, repeated parts, partial fractions, trigonometric integrals/substitution, improper integrals, numerical error, signed area, areas between curves and accumulation labs.
- `practice.html`: 60 worked problems across eight topics, each with basic, intermediate, difficult and challenge/exam levels. Every problem has a bilingual hint, collapsible ordered solution, explicit final answer and completion checkbox.

Language, theme and progress are saved locally. Existing `calc-completed-v3` records and all 36 previous problem IDs still work. Denied storage does not break the page. Search indexes 105 destinations in both languages, including lesson and problem text. Open search with Ctrl/Cmd + K. No account or server database is required.

## Run locally

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. Use HTTP/HTTPS: calculator workers cannot reliably run from `file://`. Committed static pages need no production build or Node.js server.

MathJax 3.2.2, math.js 14.0.1 and Nerdamer 1.1.13 are pinned in `vendor/` with licenses and provenance. Essential mathematics does not depend on a CDN. Google Fonts are optional, with system font fallbacks.

## Calculators

Use `x`, `pi`, `e`, arithmetic operators, parentheses and the documented elementary functions. `ln(x)` is normalized to `log(x)`; angles are in radians. The restricted grammar rejects assignments, arrays, property access and arbitrary functions. Expressions are limited to 240 characters and bounded AST complexity.

The derivative calculator supports orders 1–3, intermediate derivative formulas, optional point evaluation and a derivative overlay. The integral calculator provides elementary symbolic antiderivatives when available and adaptive Simpson quadrature on finite continuous real intervals. Numerical analysis appears before symbolic integration finishes and survives a symbolic timeout. Leave both bounds blank for an indefinite integral. Reversed bounds work; one missing bound is an error.

Domain sampling and denominator checks reject detected singularities but cannot certify continuity or find every narrow feature. Numerical errors are estimates, not convergence proofs. Analyze improper integrals using limits. Interpret symbolic expressions on their real domains. A terminable worker imposes an eight-second limit; edited inputs invalidate old results and canceled jobs cannot overwrite newer ones.

## Authoring and verification

Use Node.js 20+ for development:

```sh
npm ci
npm run build
npm test
npm run check
```

Edit practice in `content/practice.json`. Run `npm run build` and commit the source plus generated `practice.html` and `search-index.js`. The generator validates bilingual fields and escapes authored text. Hints and solutions remain in static HTML, readable without JavaScript.

Edit other lessons directly in their existing HTML files, then regenerate search with `node scripts/build-search.cjs`. The previous Python entry point remains as a compatibility wrapper. `npm run check` checks syntax and detects stale generated practice/search files.

An independent mathematical audit uses Python 3 and SymPy, development only:

```sh
python -m pip install -r tests/requirements-math.txt
python tests/audit-mathematics.py
python scripts/check-http.py
```

This cross-checks 60 answer records through 97 symbolic equalities and conditions using a different engine from the website. It complements editorial review of reasoning and theorem hypotheses; it is not an automatic proof of every sentence. Review both translations and update the corresponding mathematical check when changing a problem.

`math-core.js` contains expression validation and calculation. `learning-models.js` contains exact teaching examples. `calculator-worker.js` isolates symbolic work. `app.js` handles navigation, search, graphs, localization and practice state. `theme.js` applies saved preferences before paint. The unused legacy `script.js` remains unchanged.

Tests cover all pages/languages, workers, invalid inputs, domain failures, mathematical references, graphs, search, completion, existing anchors, local assets, MathJax rendering, structural accessibility and theme text contrast. DOM tests use jsdom and a canvas test double; they do not establish actual browser layout or touch behavior. See `REVIEW.md` for evidence and remaining review steps.

## Deployment

Keep GitHub Pages pointed at the existing `main` branch and repository root. Review `calculus-content-upgrade` before merging. Relative URLs support the `/calculus-website/` subpath. Push the full repository tree, including `vendor/`, `content/`, `scripts/` and `tests/`; uploading only root files omits required runtime engines. This change does not alter deployment configuration.
