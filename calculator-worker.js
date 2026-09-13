'use strict';
importScripts('vendor/math.js', 'vendor/nerdamer.js', 'math-core.js');
self.onmessage = ({ data }) => {
  try {
    const result = data.kind === 'derivative'
      ? CalcMath.derivative(data.expression, data.order, data.point)
      : CalcMath.integral(data.expression, data.a, data.b);
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.code || 'symbolic' }); }
};
