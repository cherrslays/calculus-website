/* Shared, DOM-free mathematics used by the UI, worker, and regression tests. */
(function (host) {
  'use strict';
  const functions = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'exp', 'log', 'sqrt', 'abs']);
  class MathInputError extends Error { constructor(code) { super(code); this.code = code; } }
  const fail = code => { throw new MathInputError(code); };
  function expression(source) {
    if (!host.math) fail('engine');
    if (typeof source !== 'string' || !source.trim()) fail('empty');
    if (source.length > 240) fail('complexity');
    source = source.replace(/\bln\s*\(/g, 'log(').replace(/π/g, 'pi').replace(/[−–]/g, '-');
    let node;
    try { node = host.math.parse(source); } catch { fail('syntax'); }
    let count = 0;
    function visit(n, depth = 0) {
      if (++count > 100 || depth > 20) fail('complexity');
      if (n.isConstantNode) { if (typeof n.value !== 'number' || !Number.isFinite(n.value) || Math.abs(n.value) > 1e12) fail('syntax'); }
      else if (n.isSymbolNode) { if (!['x', 'e', 'pi'].includes(n.name)) fail('variable'); }
      else if (n.isOperatorNode) {
        if (!['+', '-', '*', '/', '^'].includes(n.op)) fail('syntax');
        n.args.forEach(child => visit(child, depth + 1));
      } else if (n.isFunctionNode) {
        if (!functions.has(n.fn.name) || n.args.length !== 1) fail('function');
        n.args.forEach(child => visit(child, depth + 1));
      } else if (n.isParenthesisNode) visit(n.content, depth + 1);
      else fail('syntax');
    }
    visit(node);
    const compiled = node.compile();
    const tangentArguments = [];
    node.traverse(n => { if (n.isFunctionNode && n.fn.name === 'tan') tangentArguments.push(n.args[0].compile()); });
    const evaluate = x => { try {
      // Floating-point cos(pi/2) is tiny rather than exactly zero. Do not draw a
      // spurious finite tangent value at a numerically indistinguishable pole.
      if (tangentArguments.some(arg => Math.abs(Math.cos(arg.evaluate({x}))) < 1e-14)) return NaN;
      const y = compiled.evaluate({ x }); return typeof y === 'number' && Number.isFinite(y) ? y : NaN;
    } catch { return NaN; } };
    return { node, source: node.toString(), evaluate };
  }
  function realNumber(text, optional = false) {
    if (typeof text !== 'string' || !text.trim()) { if (optional) return null; fail('bounds'); }
    // Bounds deliberately accept numbers only, avoiding implicit empty-string zero.
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim())) fail('bounds');
    const n = Number(text);
    if (!Number.isFinite(n) || Math.abs(n) > 1e6) fail('bounds');
    return n;
  }
  function derivative(source, order = 1, point = '') {
    const f = expression(source);
    if (![1, 2, 3].includes(order)) fail('order');
    let node = f.node; const stages = [];
    try { for (let i = 0; i < order; i++) { node = host.math.derivative(node, 'x'); stages.push(node.toTex()); } } catch { fail('symbolic'); }
    const result = { expression: node.toString(), tex: node.toTex(), originalTex: f.node.toTex(), order, stages };
    const x = realNumber(point, true);
    if (x !== null) {
      const h = 1e-5 * Math.max(1, Math.abs(x));
      let prior = f.node;
      for (let i = 1; i < order; i++) prior = host.math.derivative(prior, 'x');
      try {
        const g = prior.compile(), value = node.evaluate({ x });
        const at = g.evaluate({ x }), left = (at - g.evaluate({ x: x - h })) / h, right = (g.evaluate({ x: x + h }) - at) / h;
        if (![value, at, left, right, f.evaluate(x)].every(v => typeof v === 'number' && Number.isFinite(v)) || Math.abs(left - right) > .02 * (1 + Math.abs(value))) fail('point');
        result.point = x; result.value = value;
      } catch { fail('point'); }
    }
    return result;
  }
  // Reject detected real-domain singularities before quadrature. Sampling is a guard,
  // not a mathematical proof of continuity; the UI explicitly states that assumption.
  function checkInterval(parsed, a, b) {
    const guards = [];
    function addDenominator(n) {
      if (n.isParenthesisNode) return addDenominator(n.content);
      if (n.isOperatorNode && n.op === '^') return addDenominator(n.args[0]);
      if (n.isOperatorNode && n.op === '*') return n.args.forEach(addDenominator);
      guards.push(n.compile());
    }
    parsed.node.traverse(n => {
      if (n.isOperatorNode && n.op === '/') addDenominator(n.args[1]);
      if (n.isOperatorNode && n.op === '^' && !n.args[1].filter(c => c.isSymbolNode && c.name === 'x').length) {
        try { if (n.args[1].evaluate() < 0) addDenominator(n.args[0]); } catch { /* invalid values fail sampling */ }
      }
      if (n.isFunctionNode && n.fn.name === 'tan') guards.push(new host.math.FunctionNode('cos', n.args).compile());
    });
    let previous = [];
    for (let i = 0; i <= 512; i++) {
      const x = a + (b - a) * i / 512;
      if (!Number.isFinite(parsed.evaluate(x))) fail('domain');
      guards.forEach((g, j) => {
        let v; try { v = g.evaluate({ x }); } catch { fail('domain'); }
        if (typeof v !== 'number' || !Number.isFinite(v) || v === 0 || (i && v * previous[j] < 0)) fail('domain');
        previous[j] = v;
      });
    }
  }
  function integrateNumeric(source, a, b, tolerance = 1e-8) {
    const parsed = typeof source === 'string' ? expression(source) : source;
    if (![a, b].every(Number.isFinite) || Math.max(Math.abs(a), Math.abs(b)) > 1e6) fail('bounds');
    if (a === b) { if (!Number.isFinite(parsed.evaluate(a))) fail('domain'); return { value: 0, error: 0, evaluations: 1 }; }
    const sign = a < b ? 1 : -1, lo = Math.min(a, b), hi = Math.max(a, b);
    checkInterval(parsed, lo, hi);
    let evaluations = 0;
    const f = x => { if (++evaluations > 50000) fail('convergence'); const y = parsed.evaluate(x); if (!Number.isFinite(y)) fail('domain'); return y; };
    const simpson = (a, b, fa, fm, fb) => (b - a) * (fa + 4 * fm + fb) / 6;
    function refine(a, b, fa, fm, fb, whole, tol, depth) {
      const mid = (a + b) / 2, fl = f((a + mid) / 2), fr = f((mid + b) / 2);
      const left = simpson(a, mid, fa, fl, fm), right = simpson(mid, b, fm, fr, fb), delta = left + right - whole;
      if (Math.abs(delta) <= 15 * tol) return { value: left + right + delta / 15, error: Math.abs(delta) / 15 };
      if (depth === 0) fail('convergence');
      const l = refine(a, mid, fa, fl, fm, left, tol / 2, depth - 1), r = refine(mid, b, fm, fr, fb, right, tol / 2, depth - 1);
      return { value: l.value + r.value, error: l.error + r.error };
    }
    // Multiple initial panels reduce coincidental agreement on oscillatory inputs.
    let value = 0, error = 0;
    for (let i = 0; i < 16; i++) {
      const l = lo + (hi - lo) * i / 16, r = lo + (hi - lo) * (i + 1) / 16, m = (l + r) / 2;
      const fa = f(l), fm = f(m), fb = f(r), whole = simpson(l, r, fa, fm, fb);
      const part = refine(l, r, fa, fm, fb, whole, tolerance / 16, 18);
      value += part.value; error += part.error;
    }
    if (!Number.isFinite(value)) fail('convergence');
    return { value: sign * value, error, evaluations };
  }
  function integral(source, lower = '', upper = '', onNumeric) {
    const parsed = expression(source), a = realNumber(lower, true), b = realNumber(upper, true);
    if ((a === null) !== (b === null)) fail('boundsPair');
    const result = { originalTex: parsed.node.toTex() };
    if (a !== null) {
      try { result.numeric = { ...integrateNumeric(parsed, a, b), a, b }; }
      catch (e) { result.numericError = e.code || 'convergence'; }
      if (onNumeric) onNumeric({ ...result });
    }
    if (host.nerdamer) {
      try {
        let answer = host.nerdamer.integrate(parsed.source, 'x').toString();
        if (/integrate|defint|\bi\b|erf|Ei|Si|Ci/.test(answer)) throw Error('unevaluated');
        let n = host.math.parse(answer);
        // Real logarithmic primitives are valid on each interval excluding their zeros.
        n = n.transform(child => child.isFunctionNode && child.fn.name === 'log'
          ? new host.math.FunctionNode('log', [new host.math.FunctionNode('abs', child.args)]) : child);
        result.tex = n.toTex(); result.expression = n.toString();
      } catch { result.symbolicUnavailable = true; }
    } else result.symbolicUnavailable = true;
    return result;
  }
  function riemann(n, method = 'midpoint') {
    if (!Number.isInteger(n) || n < 1 || n > 200 || !['left', 'midpoint', 'right'].includes(method)) fail('bounds');
    const dx = 2 / n, offset = { left: 0, midpoint: .5, right: 1 }[method];
    const rectangles = Array.from({ length: n }, (_, i) => { const x = i * dx, sample = x + offset * dx; return { x, width: dx, height: sample * sample + 1 }; });
    return { rectangles, sum: rectangles.reduce((s, r) => s + r.height * dx, 0), exact: 14 / 3 };
  }
  host.CalcMath = { expression, realNumber, derivative, integral, integrateNumeric, riemann, MathInputError };
  if (typeof module !== 'undefined' && module.exports) module.exports = host.CalcMath;
})(typeof globalThis !== 'undefined' ? globalThis : self);
