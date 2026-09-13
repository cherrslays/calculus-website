const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('calc-theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);

themeToggle?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  if (next === 'light') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', 'dark');
  localStorage.setItem('calc-theme', next);
  drawDerivative();
  drawIntegral();
});

for (const card of document.querySelectorAll('.problem-card')) {
  card.addEventListener('click', () => card.classList.toggle('open'));
}

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round((rect.width * 0.58) * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.width * 0.58 };
}

function drawAxes(ctx, w, h, xToPx, yToPx) {
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = css('--line');
  ctx.lineWidth = 1;

  for (let x = -4; x <= 4; x++) {
    const px = xToPx(x);
    ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px,h); ctx.stroke();
  }
  for (let y = -4; y <= 6; y++) {
    const py = yToPx(y);
    ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(w,py); ctx.stroke();
  }

  ctx.strokeStyle = css('--muted');
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0,yToPx(0)); ctx.lineTo(w,yToPx(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xToPx(0),0); ctx.lineTo(xToPx(0),h); ctx.stroke();
}

const xSlider = document.getElementById('xSlider');
const xValue = document.getElementById('xValue');
const derivativeEquation = document.getElementById('derivativeEquation');
const derivativeCanvas = document.getElementById('derivativeCanvas');

function drawDerivative() {
  if (!derivativeCanvas) return;
  const { ctx, w, h } = setupCanvas(derivativeCanvas);
  const xMin=-3, xMax=3, yMin=-1, yMax=7;
  const xToPx = x => (x-xMin)/(xMax-xMin)*w;
  const yToPx = y => h-(y-yMin)/(yMax-yMin)*h;
  drawAxes(ctx,w,h,xToPx,yToPx);

  ctx.strokeStyle = css('--accent');
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  for (let i=0;i<=420;i++) {
    const x=xMin+(xMax-xMin)*i/420;
    const y=x*x;
    const px=xToPx(x), py=yToPx(y);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();

  const x0 = parseFloat(xSlider.value);
  const y0 = x0*x0;
  const m = 2*x0;
  ctx.strokeStyle = css('--ink');
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const xa=xMin, xb=xMax;
  ctx.moveTo(xToPx(xa), yToPx(y0+m*(xa-x0)));
  ctx.lineTo(xToPx(xb), yToPx(y0+m*(xb-x0)));
  ctx.stroke();

  ctx.fillStyle = css('--ink');
  ctx.beginPath(); ctx.arc(xToPx(x0), yToPx(y0), 5.5, 0, Math.PI*2); ctx.fill();

  xValue.textContent = x0.toFixed(1);
  derivativeEquation.textContent = `f'(${x0.toFixed(1)}) = ${m.toFixed(1)}`;
}

xSlider?.addEventListener('input', drawDerivative);

const nSlider = document.getElementById('nSlider');
const nValue = document.getElementById('nValue');
const approxArea = document.getElementById('approxArea');
const integralCanvas = document.getElementById('integralCanvas');

function drawIntegral() {
  if (!integralCanvas) return;
  const { ctx, w, h } = setupCanvas(integralCanvas);
  const xMin=-0.4, xMax=2.4, yMin=-0.6, yMax=5.8;
  const xToPx = x => (x-xMin)/(xMax-xMin)*w;
  const yToPx = y => h-(y-yMin)/(yMax-yMin)*h;
  drawAxes(ctx,w,h,xToPx,yToPx);

  const n = parseInt(nSlider.value,10);
  const a=0,b=2,dx=(b-a)/n;
  let sum=0;

  ctx.fillStyle = css('--accent-soft');
  ctx.strokeStyle = css('--accent');
  ctx.lineWidth = 1;
  for(let i=0;i<n;i++) {
    const x=a+i*dx;
    const mid=x+dx/2;
    const y=mid*mid+1;
    sum += y*dx;
    const left=xToPx(x), right=xToPx(x+dx), top=yToPx(y), base=yToPx(0);
    ctx.fillRect(left,top,right-left,base-top);
    ctx.strokeRect(left,top,right-left,base-top);
  }

  ctx.strokeStyle = css('--ink');
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  for(let i=0;i<=300;i++) {
    const x=a+(b-a)*i/300;
    const y=x*x+1;
    const px=xToPx(x), py=yToPx(y);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();

  nValue.textContent = n;
  approxArea.textContent = sum.toFixed(3);
}

nSlider?.addEventListener('input', drawIntegral);

function redrawAll() {
  drawDerivative();
  drawIntegral();
}
window.addEventListener('load', redrawAll);
window.addEventListener('resize', redrawAll);
