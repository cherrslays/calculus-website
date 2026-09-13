# Calculus Atlas

A Thai/English single-variable calculus learning platform for GitHub Pages. Version 3 preserves the original five page URLs and all existing anchors while expanding the course and its tools.

## Learn

- `index.html`: course overview, prerequisites, chapter navigation, and function grapher.
- `limits.html`: intuition, laws, continuity, infinity, ε–δ proofs, squeeze theorem, L’Hôpital’s rule, and a two-sided limit laboratory.
- `derivatives.html`: first principles, differentiation rules, tangent/secant/derivative laboratory, implicit and logarithmic differentiation, Mean Value Theorem, extrema, related rates, linear approximation, and Newton’s method.
- `integrals.html`: Riemann sums, antiderivatives, FTC with hypotheses, substitution, parts, partial fractions, trigonometric identities, signed/geometric area, improper integrals, and numerical error.
- `practice.html`: 36 problems (12 per chapter), worked solutions, difficulty/topic filters, and explicit completion tracking.

Language, theme, and practice completion are saved locally in the reader’s browser. No account, analytics, or server database is required. Denied browser storage does not break the page. Search uses a local index of 69 destinations and supports both languages and lesson body text. Open it with Ctrl/Cmd + K.

## Run locally

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. Serve over HTTP/HTTPS: calculator workers cannot reliably run from `file://` URLs. The production site has no build step and does not need Node.js.

MathJax 3.2.2, math.js 14.0.1, and Nerdamer 1.1.13 are pinned in `vendor/`, with their licenses. Essential mathematics does not depend on a CDN. Google Fonts are optional; system serif, sans-serif, and Thai fonts provide fallbacks. See `vendor/README.md` for provenance.

## Calculators

Use `x`, `pi`, `e`, arithmetic operators, parentheses, and the documented elementary functions. `ln(x)` is normalized to `log(x)`; angles are in radians. Inputs are restricted to a small real-expression grammar (240 characters maximum); assignments, arrays, arbitrary functions, and property access are rejected.

The derivative calculator supports orders 1–3, optional point evaluation, and an overlay of the selected derivative. The integral calculator offers elementary symbolic antiderivatives when available and adaptive Simpson quadrature on finite continuous real intervals. Leave **both** bounds blank for an indefinite integral. Reversed bounds are supported; only one blank bound is an error.

Numerical estimates report an estimated absolute error, not an exact value or proof of convergence. Domain sampling and denominator checks reject detected singularities, but cannot certify continuity or catch every narrow feature. Analyze improper integrals with limits. Symbolic expressions must be interpreted on their real domains. Calculations run in a terminable worker with an eight-second timeout so complex input cannot lock the interface indefinitely.

## Development and verification

Node.js 20+ and Python 3 are sufficient for the checks:

```sh
npm ci
npm test
npm run check
```

After editing lesson or practice HTML, regenerate and commit the static search index:

```sh
python3 scripts/build-search.py
```

`math-core.js` contains DOM-independent expression validation, differentiation, integration, and Riemann sums. `calculator-worker.js` runs the symbolic work away from the UI. `app.js` supplies navigation, search, graphs, localization, and practice state. `theme.js` applies saved preferences before paint. `script.js` is the untouched legacy script, retained for compatibility and not loaded by the current pages.

Tests cover numerical reference values, symbolic derivatives/antiderivatives, invalid inputs, detected singularities, worker execution, language and storage behavior, search, practice, original anchors, local assets, MathJax TeX rendering, axe structural accessibility checks, and theme text contrast. DOM tests use jsdom and a canvas test double; they do not establish real-browser layout or native dialog focus behavior. See `REVIEW.md` for the test evidence and remaining browser review checklist.

## Deployment

Keep GitHub Pages pointed at the existing `main` branch and repository root. Review and merge `astra-v3` only when ready. All local URLs are relative, so the site supports the `/calculus-website/` GitHub Pages subpath. This change does not alter the deployment configuration or publish a replacement production site.
