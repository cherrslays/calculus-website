/* Exact models for the fixed teaching examples; no user expression execution. */
(function (host) {
  'use strict';
  const quartic = x => x ** 4 - 4 * x * x;
  const quarticD = x => 4 * x ** 3 - 8 * x;
  const quarticDD = x => 12 * x * x - 8;
  const accumulation = x => x <= 1 ? x - x * x / 2 : .5 + (x - 1) ** 2 / 2;
  const regions = {
    crossing: { f: x => x, g: x => x ** 3, primitive: x => x * x / 2 - x ** 4 / 4, roots: [-1,0,1], lo: -1, hi: 1, label: 'f(x) = x; g(x) = x³', bounds: { xmin: -1.2, xmax: 1.2, ymin: -1.4, ymax: 1.4 } },
    parabola: { f: x => 2 * x + 3, g: x => x * x, primitive: x => x * x + 3 * x - x ** 3 / 3, roots: [-1,3], lo: -1, hi: 3, label: 'f(x) = 2x + 3; g(x) = x²', bounds: { xmin: -1.5, xmax: 3.5, ymin: -1, ymax: 12 } }
  };
  function between(name, a, b) {
    const r = regions[name];
    if (!r || ![a,b].every(Number.isFinite) || Math.min(a,b) < r.lo || Math.max(a,b) > r.hi) throw Error('Invalid teaching interval');
    const cuts = [Math.min(a,b), ...r.roots.filter(x => x > Math.min(a,b) && x < Math.max(a,b)), Math.max(a,b)];
    const parts = cuts.slice(1).map((right,i) => ({ a: cuts[i], b: right, signed: r.primitive(right)-r.primitive(cuts[i]) }));
    return { signed: r.primitive(b)-r.primitive(a), area: parts.reduce((total,p) => total+Math.abs(p.signed),0), parts };
  }
  host.LearningModels = { quartic, quarticD, quarticDD, accumulation, regions, between };
  if (typeof module !== 'undefined' && module.exports) module.exports = host.LearningModels;
})(typeof globalThis !== 'undefined' ? globalThis : self);
