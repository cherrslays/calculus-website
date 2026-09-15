'use strict';
importScripts('math.js', 'nerdamer.js', 'math-core.js');
self.onmessage = ({ data }) => {
  try {
    const result = data.kind === 'derivative'
      ? CalcMath.derivative(data.expression, data.order, data.point)
      : CalcMath.integral(data.expression, data.a, data.b, result => self.postMessage({ result, partial: true }));
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.code || 'symbolic' }); }
};
