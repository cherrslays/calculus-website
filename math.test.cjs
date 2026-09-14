const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ console });
for (const file of ['vendor/math.js', 'vendor/nerdamer.js', 'math-core.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
const C = context.CalcMath;
const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
for (const [source, x, expected] of [['x^3', 2, 12], ['sin(x)', 0, 1], ['ln(x)', 2, .5], ['x^2*exp(x)', 1, 3 * Math.E], ['(3*x^2+1)^5', 1, 30 * 4 ** 4], ['x^x', 1, 1], ['tan(x)', 0, 1]]) {
  test(`derivative: ${source}`, () => near(C.derivative(source, 1, String(x)).value, expected));
}
test('second and third derivatives', () => { near(C.derivative('x^4', 2, '2').value, 48); near(C.derivative('x^4', 3, '2').value, 48); });
test('a corner and invalid real-domain point are not derivatives', () => { assert.throws(() => C.derivative('abs(x)', 1, '0')); assert.throws(() => C.derivative('log(x)', 1, '-1')); });
for (const source of ['', 'x+y', 'x=3', '[1,2]', 'import("x")', 'random()', 'x.constructor', 'factorial(100)', 'sin(x,2)', 'x;2', '"hello"', 'x'.repeat(241)]) {
  test(`reject invalid or unsupported expression: ${JSON.stringify(source).slice(0, 35)}`, () => assert.throws(() => C.expression(source)));
}
test('valid implicit multiplication and natural logarithm', () => { near(C.expression('2x + ln(e)').evaluate(3), 7); near(C.expression('sin(π/2)').evaluate(0), 1); });
for (const [source, a, b, expected] of [['x^2+1', 0, 2, 14 / 3], ['sin(x)', 0, Math.PI, 2], ['3*x^2+1', 2, 0, -10], ['x', -1, 1, 0], ['exp(-x^2)', -1, 1, 1.493648265624854], ['abs(x)', -1, 1, 1], ['1/x', 1, 2, Math.log(2)], ['sin(40*x)', 0, 1, (1-Math.cos(40))/40]]) {
  test(`numerical integral: ${source} on [${a}, ${b}]`, () => { const result = C.integrateNumeric(source, a, b); near(result.value, expected); assert.ok(result.error <= 1e-8); });
}
for (const source of ['1/x', '1/x^2', 'x^(-2)', '1/(x-0.1234)^2', 'log(x)', 'sqrt(x)', '1/(x^2-0.25)']) {
  test(`reject singular/nonreal interval: ${source}`, () => assert.equal(C.integral(source, '-1', '1').numericError, 'domain'));
}
test('trigonometric pole is rejected', () => assert.equal(C.integral('tan(x)', '0', '3').numericError, 'domain'));
test('tangent is not assigned a finite value at a floating-point pole',()=>{
  assert.ok(Number.isNaN(C.expression('tan(x)').evaluate(Math.PI/2)));
  assert.throws(()=>C.derivative('tan(x)',1,String(Math.PI/2)),{code:'point'});
});
test('higher derivative results retain each intermediate order',()=>{
  const r=C.derivative('x^4',3);assert.equal(r.stages.length,3);
  assert.match(r.stages[0],/4/);assert.match(r.stages[1],/12/);assert.match(r.stages[2],/24/);
});
test('numeric integral is emitted before a slow or failing symbolic solver',()=>{
  const original=context.nerdamer;let delivered;
  context.nerdamer={integrate(){assert.ok(delivered);throw Error('symbolic unavailable');}};
  try {const r=C.integral('x^2','0','1',partial=>{delivered=partial;near(partial.numeric.value,1/3);});assert.ok(r.symbolicUnavailable);near(r.numeric.value,1/3);}
  finally {context.nerdamer=original;}
});
test('blank bounds remain an indefinite integral', () => { const result = C.integral('x^2', '', ''); assert.ok(result.tex); assert.equal(result.numeric, undefined); });
test('one missing bound is an error', () => assert.throws(() => C.integral('x', '', '1'), { code: 'boundsPair' }));
test('invalid and unbounded bounds fail', () => { for (const value of ['NaN', 'Infinity', 'abc', '1e7', '0x10']) assert.throws(() => C.integral('x', '0', value)); });
test('equal valid bounds return zero', () => near(C.integral('x^2', '2', '2').numeric.value, 0));
test('nonelementary integral retains numerical result', () => { const result = C.integral('exp(-x^2)', '0', '1'); assert.ok(result.symbolicUnavailable); near(result.numeric.value, .746824132812427); });
test('logarithmic primitive uses an absolute value', () => assert.match(C.integral('1/x').expression, /log\(abs\(x\)\)/));
for (const source of ['x^3', 'sin(x)', 'x*exp(x)', '2*x/(1+x^2)', '1/(x^2-1)']) {
  test(`verify antiderivative numerically: ${source}`, () => {
    const result = C.integral(source); assert.ok(result.expression);
    const F = C.expression(result.expression), f = C.expression(source);
    for (const x of [.3, .7, 1.5]) { const h = 1e-5; near((F.evaluate(x+h)-F.evaluate(x-h))/(2*h), f.evaluate(x), 1e-5); }
  });
}
test('Riemann sums bracket the exact value and midpoint error decreases', () => {
  assert.ok(C.riemann(6,'left').sum < 14/3); assert.ok(C.riemann(6,'right').sum > 14/3);
  assert.ok(Math.abs(C.riemann(100).sum-14/3) < Math.abs(C.riemann(6).sum-14/3));
  near(C.riemann(2).sum, 4.5);
});
