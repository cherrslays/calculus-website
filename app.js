/* Calculus Atlas: progressive enhancement for the five static course pages. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];
  const tr = (en, th) => root.dataset.lang === 'th' ? th : en;
  const number = value => Number.isFinite(value) ? Number(value.toPrecision(9)).toLocaleString(root.lang, { maximumSignificantDigits: 9 }) : '—';
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Session features still work. */ } };
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const errors = {
    engine: ['The math engine could not load. Reload this page.', 'โหลดเครื่องคำนวณไม่สำเร็จ ลองโหลดหน้านี้ใหม่'],
    empty: ['Enter an expression in x.', 'ใส่นิพจน์ที่มีตัวแปร x'],
    complexity: ['Use a shorter expression (up to 240 characters).', 'ใช้นิพจน์ที่สั้นลง (ไม่เกิน 240 ตัวอักษร)'],
    syntax: ['Check the expression. Try x^2 + sin(x); use parentheses and explicit multiplication.', 'ตรวจนิพจน์ เช่น x^2 + sin(x) ใช้วงเล็บและเครื่องหมายคูณให้ชัดเจน'],
    variable: ['Use x as the only variable. Constants pi and e are supported.', 'ใช้ x เป็นตัวแปรเดียว ใช้ค่าคงที่ pi และ e ได้'],
    function: ['Supported functions: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, exp, log/ln, sqrt, abs.', 'ฟังก์ชันที่รองรับ: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, exp, log/ln, sqrt, abs'],
    bounds: ['Enter finite decimal numbers with magnitude at most 1,000,000.', 'ใส่เลขทศนิยมจำกัดที่มีค่าสัมบูรณ์ไม่เกิน 1,000,000'],
    boundsPair: ['Enter both bounds, or leave both blank for an antiderivative.', 'ใส่ขอบทั้งสองด้าน หรือเว้นว่างทั้งคู่เพื่อหาปฏิยานุพันธ์'],
    point: ['The derivative is undefined or cannot be reliably evaluated at that point.', 'อนุพันธ์ไม่นิยามหรือไม่สามารถหาค่าได้อย่างน่าเชื่อถือที่จุดนี้'],
    domain: ['No numerical result: the interval contains a detected singularity or non-real value. Split and analyze the interval using limits.', 'ไม่แสดงค่าตัวเลข: ตรวจพบจุดเอกฐานหรือค่าที่ไม่เป็นจำนวนจริงในช่วง ให้แบ่งช่วงและวิเคราะห์ด้วยลิมิต'],
    convergence: ['The numerical method did not converge within its error and time limits. Try a smaller continuous interval.', 'วิธีเชิงตัวเลขไม่ลู่เข้าภายในเกณฑ์ความคลาดเคลื่อนและเวลา ลองช่วงต่อเนื่องที่เล็กลง'],
    symbolic: ['A symbolic result is unavailable for this expression. Try simplifying it.', 'ยังหาผลเชิงสัญลักษณ์ของนิพจน์นี้ไม่ได้ ลองจัดรูปให้ง่ายขึ้น'],
    timeout: ['Calculation timed out. Simplify the expression or reduce the interval and try again.', 'การคำนวณใช้เวลานานเกินไป ลองลดความซับซ้อนหรือย่อช่วงแล้วคำนวณใหม่'],
    worker: ['The calculator could not start. Serve this site over HTTP/HTTPS and reload.', 'เปิดเครื่องคำนวณไม่สำเร็จ ให้เปิดเว็บผ่าน HTTP/HTTPS แล้วโหลดใหม่']
  };
  const errorText = code => tr(...(errors[code] || errors.syntax));
  let typesetQueue = Promise.resolve();
  function typeset(element) {
    if (!element || !window.MathJax?.startup?.promise) return;
    typesetQueue = typesetQueue.then(() => MathJax.startup.promise).then(() => {
      if (element.isConnected) return MathJax.typesetPromise([element]);
    }).catch(() => { /* Raw TeX stays readable. */ });
  }
  function clearMath(el) { try { window.MathJax?.typesetClear?.([el]); } catch { /* No prior math. */ } el.replaceChildren(); }
  function paragraph(parent, text, className = '') { const p = document.createElement('p'); p.textContent = text; p.className = className; parent.append(p); return p; }
  function formula(parent, tex) { const div = document.createElement('div'); div.className = 'equation-block'; div.textContent = `\\[${tex}\\]`; parent.append(div); }

  // Native dialog supplies modal focus containment and Escape handling.
  const dialog = $('searchOverlay'), search = $('searchInput');
  let searchOpener;
  function renderSearch() {
    const terms = (search?.value || '').trim().normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const ranked = (window.SEARCH_INDEX || []).map(item => {
      const haystack = [item.en, item.th, item.text].join(' ').normalize('NFKC').toLocaleLowerCase();
      return { item, match: terms.every(term => haystack.includes(term)), score: terms.reduce((score, term) => score + ([item.en, item.th].join(' ').toLowerCase().includes(term) ? 3 : 0), 0) };
    }).filter(x => x.match).sort((a, b) => b.score - a.score);
    if (!$('searchResults')) return;
    $('searchResults').replaceChildren();
    for (const { item } of ranked) {
      const a = document.createElement('a'); a.className = 'search-result'; a.href = item.url;
      const title = document.createElement('strong'); title.textContent = tr(item.en, item.th);
      const description = document.createElement('span'); description.textContent = tr(item.previewEn, item.previewTh);
      a.append(title, description); a.addEventListener('click', () => dialog.close()); $('searchResults').append(a);
    }
    $('searchCount').textContent = ranked.length ? tr(`${ranked.length} results`, `พบ ${ranked.length} รายการ`) : tr('No matching topics. Try a different word or formula.', 'ไม่พบหัวข้อ ลองใช้คำหรือสูตรอื่น');
  }
  function openSearch(button) { if (!dialog || dialog.open) return; searchOpener = button || document.activeElement; renderSearch(); dialog.showModal(); search.focus(); }
  all('[data-search-open]').forEach(b => b.addEventListener('click', () => openSearch(b)));
  $('searchClose')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  dialog?.addEventListener('close', () => searchOpener?.focus());
  search?.addEventListener('input', renderSearch);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') all('.mobile-nav[open], .mobile-toc[open]').forEach(el => { el.open = false; el.querySelector('summary').focus(); });
  });
  all('.mobile-nav a, .mobile-toc a').forEach(a => a.addEventListener('click', () => { a.closest('details').open = false; }));

  function syncLanguage() {
    all('[data-label-en]').forEach(el => el.setAttribute('aria-label', tr(el.dataset.labelEn, el.dataset.labelTh)));
    all('option[data-en]').forEach(el => { el.textContent = tr(el.dataset.en, el.dataset.th); });
    all('[data-lang-toggle]').forEach(b => { b.textContent = root.lang === 'en' ? 'TH' : 'EN'; });
    all('[data-theme-toggle]').forEach(b => b.setAttribute('aria-pressed', String(root.dataset.theme === 'dark')));
    renderSearch(); updatePractice(); redraw();
    if (lastCalculation) displayCalculation(lastCalculation);
    if (lastError) displayError(lastError);
    if (activeWorker) setBusy(true);
  }
  all('[data-lang-toggle]').forEach(b => b.addEventListener('click', () => {
    root.dataset.lang = root.lang = root.lang === 'en' ? 'th' : 'en'; save('calc-lang', root.lang); syncLanguage();
    // Both language variants are already in the document; refresh newly visible math.
    typeset(document.querySelector('main'));
  }));
  all('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; save('calc-theme', root.dataset.theme); b.setAttribute('aria-pressed', String(root.dataset.theme === 'dark')); redraw(); }));

  // Practice completion is explicitly user-controlled, never inferred from revealing an answer.
  let completed;
  try { const data = JSON.parse(read('calc-completed-v3', '[]')); completed = new Set(Array.isArray(data) ? data.filter(x => typeof x === 'string') : []); } catch { completed = new Set(); }
  all('[data-complete]').forEach(input => { input.checked = completed.has(input.dataset.complete); input.addEventListener('change', () => {
    input.checked ? completed.add(input.dataset.complete) : completed.delete(input.dataset.complete);
    save('calc-completed-v3', JSON.stringify([...completed])); updatePractice();
  }); });
  function updatePractice() {
    if (!$('practiceStatus')) return;
    const problems = all('.problem'), topic = $('practiceTopic').value, level = $('practiceLevel').value;
    let visible = 0, done = 0;
    for (const p of problems) {
      const isDone = completed.has(p.id); if (isDone) done++;
      p.hidden = (topic !== 'all' && p.dataset.topic !== topic) || (level !== 'all' && p.dataset.level !== level) || ($('hideCompleted').checked && isDone);
      p.classList.toggle('completed', isDone); if (!p.hidden) visible++;
    }
    all('main .lesson-section').forEach(s => { s.hidden = ![...s.querySelectorAll('.problem')].some(p => !p.hidden); });
    $('practiceStatus').textContent = tr(`${visible} problems shown · ${done} of ${problems.length} completed`, `แสดง ${visible} ข้อ · ทำแล้ว ${done} จาก ${problems.length} ข้อ`);
    $('practiceProgress').value = done; $('practiceProgress').max = problems.length; $('practiceEmpty').hidden = visible > 0;
  }
  ['practiceTopic', 'practiceLevel', 'hideCompleted'].forEach(id => $(id)?.addEventListener('change', updatePractice));
  function revealHash() {
    if (!$('practiceTopic')) return;
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = $(id); if (!target) return;
    $('practiceTopic').value = 'all'; $('practiceLevel').value = 'all'; $('hideCompleted').checked = false; updatePractice();
    requestAnimationFrame(() => target.scrollIntoView());
  }
  window.addEventListener('hashchange', revealHash);

  // Canvas graphs: compile expressions once, leave gaps across discontinuities,
  // and expose numeric results in adjacent text for keyboard/screen-reader users.
  const color = name => getComputedStyle(root).getPropertyValue(name).trim();
  function frame(canvas, bounds) {
    const width = canvas.getBoundingClientRect().width || 600, height = Math.max(210, width * .56), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    const pad = 32, { xmin, xmax, ymin, ymax } = bounds;
    const xp = x => pad + (x - xmin) / (xmax - xmin) * (width - pad * 1.5), yp = y => height - pad - (y - ymin) / (ymax - ymin) * (height - pad * 1.5);
    ctx.font = '11px system-ui'; ctx.lineWidth = 1;
    const step = (xmax - xmin) > 12 ? 2 : 1;
    for (let x = Math.ceil(xmin / step) * step; x <= xmax; x += step) {
      ctx.strokeStyle = color('--line'); ctx.beginPath(); ctx.moveTo(xp(x), pad / 2); ctx.lineTo(xp(x), height - pad); ctx.stroke();
      ctx.fillStyle = color('--muted'); ctx.fillText(String(x), xp(x) - 4, height - 12);
    }
    const ystep = Math.max(1, Math.ceil((ymax - ymin) / 8));
    for (let y = Math.ceil(ymin / ystep) * ystep; y <= ymax; y += ystep) {
      ctx.strokeStyle = color('--line'); ctx.beginPath(); ctx.moveTo(pad, yp(y)); ctx.lineTo(width - pad / 2, yp(y)); ctx.stroke();
      ctx.fillStyle = color('--muted'); ctx.fillText(String(y), 3, yp(y) + 4);
    }
    ctx.strokeStyle = color('--muted'); ctx.beginPath();
    if (ymin <= 0 && ymax >= 0) { ctx.moveTo(pad, yp(0)); ctx.lineTo(width - pad / 2, yp(0)); }
    if (xmin <= 0 && xmax >= 0) { ctx.moveTo(xp(0), pad / 2); ctx.lineTo(xp(0), height - pad); }
    ctx.stroke();
    ctx.fillText('x', width - 12, height - 12); ctx.fillText('y', 8, 12);
    ctx.save(); ctx.beginPath(); ctx.rect(pad, pad / 2, width - pad * 1.5, height - pad * 1.5); ctx.clip();
    return { ctx, xp, yp, width, height, ...bounds };
  }
  function curve(g, fn, stroke = '--accent', dashed = false) {
    const { ctx, xp, yp, xmin, xmax, ymin, ymax } = g;
    ctx.strokeStyle = color(stroke); ctx.lineWidth = 2.5; ctx.setLineDash(dashed ? [6, 5] : []); ctx.beginPath();
    let prior = null, count = 0;
    for (let i = 0; i <= 650; i++) {
      const x = xmin + (xmax - xmin) * i / 650, y = fn(x);
      if (!Number.isFinite(y) || y < ymin - (ymax - ymin) || y > ymax + (ymax - ymin)) { prior = null; continue; }
      if (prior === null || Math.abs(y - prior) > (ymax - ymin) * .65) ctx.moveTo(xp(x), yp(y)); else ctx.lineTo(xp(x), yp(y));
      prior = y; count++;
    }
    ctx.stroke(); ctx.setLineDash([]); return count;
  }
  function point(g, x, y, hollow = false, stroke = '--accent') { const { ctx, xp, yp } = g; ctx.beginPath(); ctx.arc(xp(x), yp(y), 5, 0, Math.PI * 2); ctx.fillStyle = color(hollow ? '--paper' : stroke); ctx.strokeStyle = color(stroke); ctx.lineWidth = 2; ctx.fill(); ctx.stroke(); }
  function shade(g, fn, a, b) {
    const { ctx, xp, yp } = g; const lo = Math.min(a, b), hi = Math.max(a, b);
    for (let i = 0; i < 260; i++) {
      const x = lo + (hi - lo) * i / 260, next = lo + (hi - lo) * (i + 1) / 260, y = fn((x + next) / 2);
      if (!Number.isFinite(y)) continue;
      ctx.fillStyle = color(y >= 0 ? '--accent-soft' : '--negative-soft');
      ctx.fillRect(xp(x), Math.min(yp(0), yp(y)), xp(next) - xp(x) + .4, Math.abs(yp(0) - yp(y)));
    }
  }
  function drawFunction() {
    if (!$('functionGraph')) return;
    const g = frame($('functionGraph'), { xmin: -6, xmax: 6, ymin: -5, ymax: 5 }); if (!g) return;
    try {
      const f = CalcMath.expression($('graphExpr').value), count = curve(g, f.evaluate);
      $('graphStatus').textContent = count ? tr(`f(x) = ${f.source}. Window: −6 ≤ x ≤ 6, −5 ≤ y ≤ 5. f(0) = ${number(f.evaluate(0))}. Gaps indicate undefined or out-of-view values.`, `f(x) = ${f.source} ช่วงแสดงผล: −6 ≤ x ≤ 6, −5 ≤ y ≤ 5 ค่า f(0) = ${number(f.evaluate(0))} ช่องว่างหมายถึงค่าไม่นิยามหรืออยู่นอกกรอบ`) : tr('No real curve is visible in this window.', 'ไม่มีกราฟค่าจริงในกรอบนี้');
      $('graphExpr').removeAttribute('aria-invalid');
    } catch (e) { $('graphStatus').textContent = errorText(e.code); $('graphExpr').setAttribute('aria-invalid', 'true'); }
    g.ctx.restore();
  }
  const demos = {
    square: { f: x => x * x, d: x => 2 * x, label: 'x²', rule: '2x' },
    cubic: { f: x => x ** 3 - 3 * x, d: x => 3 * x * x - 3, label: 'x³ − 3x', rule: '3x² − 3' },
    sine: { f: Math.sin, d: Math.cos, label: 'sin(x)', rule: 'cos(x)' }
  };
  function drawTangent() {
    if (!$('derivativeCanvas')) return;
    const selected = $('tangentFunction').value, { f, d, label, rule } = demos[selected], a = Number($('xSlider').value), h = Number($('hSlider').value), m = d(a), secant = (f(a + h) - f(a)) / h;
    const end = a + h;
    const g = frame($('derivativeCanvas'), { xmin: -3, xmax: Math.max(3, end + .3), ymin: Math.min(-7, f(a) - 1, f(end) - 1), ymax: Math.max(8, f(a) + 1, f(end) + 1) }); if (!g) return;
    curve(g, f); if ($('showDerivative').checked) curve(g, d, '--accent2', true);
    curve(g, x => f(a) + secant * (x - a), '--warning', true); curve(g, x => f(a) + m * (x - a), '--ink'); point(g, a, f(a)); point(g, a + h, f(a + h), true, '--warning'); g.ctx.restore();
    $('xValue').textContent = a.toFixed(1); $('slopeValue').textContent = m.toFixed(3);
    const demoPanel = $('derivativeCanvas').closest('.panel'); demoPanel.querySelector('h3').textContent = `f(x) = ${label}`; demoPanel.querySelector('.stat:last-child strong').textContent = `f′(x) = ${rule}`;
    $('tangentStats').textContent = tr(`Tangent slope ${number(m)} · Secant slope ${number(secant)} · h = ${h}. Green: f. Ink: tangent. Gold: secant. Blue dashed: f′.`, `ความชันเส้นสัมผัส ${number(m)} · ความชันเส้นตัด ${number(secant)} · h = ${h} สีเขียว: f สีหมึก: เส้นสัมผัส สีทอง: เส้นตัด เส้นประน้ำเงิน: f′`);
  }
  function drawRiemann() {
    if (!$('riemannCanvas')) return;
    const n = Number($('nSlider').value), method = $('riemannMethod').value, result = CalcMath.riemann(n, method);
    const g = frame($('riemannCanvas'), { xmin: -.3, xmax: 2.3, ymin: -.5, ymax: 5.7 }); if (!g) return;
    for (const r of result.rectangles) { g.ctx.fillStyle = color('--accent-soft'); g.ctx.strokeStyle = color('--accent'); g.ctx.lineWidth = .8; g.ctx.fillRect(g.xp(r.x), g.yp(r.height), g.xp(r.x + r.width) - g.xp(r.x), g.yp(0) - g.yp(r.height)); g.ctx.strokeRect(g.xp(r.x), g.yp(r.height), g.xp(r.x + r.width) - g.xp(r.x), g.yp(0) - g.yp(r.height)); }
    curve(g, x => x * x + 1, '--ink'); g.ctx.restore();
    $('nValue').textContent = n; $('areaValue').textContent = result.sum.toFixed(5);
    $('riemannStats').textContent = tr(`${n} rectangles · ${$('riemannMethod').selectedOptions[0].textContent} · Sum = ${number(result.sum)} · Exact = 14/3 · Absolute error = ${number(Math.abs(result.sum - result.exact))}`, `สี่เหลี่ยม ${n} รูป · ${$('riemannMethod').selectedOptions[0].textContent} · ผลบวก = ${number(result.sum)} · ค่าจริง = 14/3 · ความคลาดเคลื่อนสัมบูรณ์ = ${number(Math.abs(result.sum - result.exact))}`);
  }
  function drawLimit() {
    if (!$('limitCanvas')) return;
    const selected = $('limitFunction').value, hole = selected === 'hole', pole = selected === 'pole', oscillating = selected === 'oscillating';
    const a = hole ? 2 : 0, h = 10 ** (-Number($('limitDistance').value));
    const f = hole ? x => x === 2 ? NaN : x + 2 : pole ? x => x === 0 ? NaN : 1 / x : oscillating ? x => x === 0 ? 0 : x * x * Math.sin(1 / x) : x => x < 0 ? -1 : 1;
    const g = frame($('limitCanvas'), hole ? { xmin: 0, xmax: 4, ymin: 1, ymax: 7 } : { xmin: -2, xmax: 2, ymin: pole ? -8 : -2, ymax: pole ? 8 : 2 }); if (!g) return;
    // Draw the two sides separately to avoid connecting across a jump.
    curve(g, x => x < a ? f(x) : NaN); curve(g, x => x > a ? f(x) : NaN);
    if (hole) point(g, a, 4, true);
    else if (oscillating) { curve(g, x => x*x, '--muted', true); curve(g, x => -x*x, '--muted', true); point(g, 0, 0); }
    else if (!pole) { point(g, 0, -1, true); point(g, 0, 1); }
    point(g, a - h, f(a - h), false, '--accent2'); point(g, a + h, f(a + h), false, '--warning'); g.ctx.restore();
    const conclusion = hole ? tr('Both approach 4; f(2) is undefined.', 'ทั้งสองด้านเข้าใกล้ 4 แต่ f(2) ไม่นิยาม') : pole ? tr('Left tends to −∞, right to +∞: no two-sided limit. Values outside the vertical window are clipped.', 'ซ้ายเข้าใกล้ −∞ ขวาเข้าใกล้ +∞ จึงไม่มีลิมิตสองด้าน ค่านอกกรอบแนวตั้งจะถูกตัด') : oscillating ? tr('The bounds ±x² squeeze both sides to 0=f(0). A finite-resolution drawing cannot resolve every oscillation.', 'ขอบ ±x² บีบทั้งสองด้านเข้าสู่ 0=f(0) รูปวาดความละเอียดจำกัดไม่อาจแสดงการแกว่งได้ทุกครั้ง') : tr('Left approaches −1, right approaches 1: no two-sided limit.', 'ซ้ายเข้าใกล้ −1 ขวาเข้าใกล้ 1 จึงไม่มีลิมิตสองด้าน');
    $('limitStats').textContent = tr(`Distance h = ${number(h)}. Left: x = ${number(a - h)}, f = ${number(f(a - h))}. Right: x = ${number(a + h)}, f = ${number(f(a + h))}. `, `ระยะ h = ${number(h)} ด้านซ้าย: x = ${number(a - h)}, f = ${number(f(a - h))} ด้านขวา: x = ${number(a + h)}, f = ${number(f(a + h))} `) + conclusion;
  }
  function drawArea() {
    if (!$('areaCanvas')) return;
    const b = Number($('areaBound').value), signed = (b * b - 1) / 2, geometric = b < 0 ? (1 - b * b) / 2 : (1 + b * b) / 2;
    const g = frame($('areaCanvas'), { xmin: -1.5, xmax: 2.5, ymin: -1.5, ymax: 2.5 }); if (!g) return;
    shade(g, x => x, -1, b); curve(g, x => x); g.ctx.restore();
    $('areaStats').textContent = tr(`b = ${number(b)} · Signed integral = ${number(signed)} · Geometric area = ${number(geometric)}. Green is positive; rose is negative.`, `b = ${number(b)} · ปริพันธ์แบบมีเครื่องหมาย = ${number(signed)} · พื้นที่เรขาคณิต = ${number(geometric)} สีเขียวเป็นบวก สีชมพูเป็นลบ`);
  }
  function drawCurveAnalysis() {
    if (!$('curveCanvas')) return;
    const M = LearningModels, a = Number($('curvePoint').value), second = $('curveSecond').checked;
    const g = frame($('curveCanvas'), { xmin: -2.5, xmax: 2.5, ymin: -5, ymax: 15 }); if (!g) return;
    curve(g, M.quartic);
    [-Math.SQRT2,0,Math.SQRT2].forEach(x => point(g,x,M.quartic(x)));
    [-Math.sqrt(2/3),Math.sqrt(2/3)].forEach(x => point(g,x,M.quartic(x),true));
    point(g,a,M.quartic(a),false,'--warning'); g.ctx.restore();
    const dg = frame($('curveDerivativeCanvas'), { xmin: -2.5, xmax: 2.5, ymin: -45, ymax: second ? 70 : 45 });
    if (dg) { curve(dg,M.quarticD,'--accent2'); if (second) curve(dg,M.quarticDD,'--ink',true); point(dg,a,M.quarticD(a),false,'--warning'); dg.ctx.restore(); }
    const slope = M.quarticD(a), curvature = M.quarticDD(a);
    const direction = Math.abs(slope)<1e-10 ? tr('stationary','จุดนิ่ง') : slope>0 ? tr('increasing','เพิ่ม') : tr('decreasing','ลด');
    const concavity = Math.abs(curvature)<1e-10 ? tr('test neighboring concavity','ตรวจความเว้าข้างเคียง') : curvature>0 ? tr('concave up','เว้าขึ้น') : tr('concave down','เว้าลง');
    $('curveStats').textContent = `a = ${number(a)} · f(a) = ${number(M.quartic(a))} · f′(a) = ${number(slope)} · f″(a) = ${number(curvature)} · ${direction} · ${concavity}`;
  }
  function drawBetween() {
    if (!$('betweenCanvas')) return;
    const selected = $('betweenFunction').value, r = LearningModels.regions[selected], a = r.lo, b = a + (r.hi-a)*Number($('betweenFraction').value);
    const result = LearningModels.between(selected,a,b), g = frame($('betweenCanvas'),r.bounds); if (!g) return;
    for (let i=0;i<300;i++) {
      const x=a+(b-a)*i/300, end=a+(b-a)*(i+1)/300, mid=(x+end)/2, top=Math.max(r.f(mid),r.g(mid)), bottom=Math.min(r.f(mid),r.g(mid));
      g.ctx.fillStyle=color(r.f(mid)>=r.g(mid)?'--accent-soft':'--negative-soft');
      g.ctx.fillRect(g.xp(x),g.yp(top),g.xp(end)-g.xp(x)+.3,g.yp(bottom)-g.yp(top));
    }
    curve(g,r.f); curve(g,r.g,'--accent2',true); r.roots.forEach(x=>point(g,x,r.f(x),true)); g.ctx.restore();
    const pieces=result.parts.map(p=>`[${number(p.a)}, ${number(p.b)}]: ${number(Math.abs(p.signed))}`).join('; ');
    $('betweenStats').textContent = tr(`${r.label}. Interval [${number(a)}, ${number(b)}]. Signed ∫(f−g) = ${number(result.signed)}. Geometric area = ${number(result.area)}. Area by piece: ${pieces}.`,`${r.label} ช่วง [${number(a)}, ${number(b)}] ปริพันธ์มีเครื่องหมาย ∫(f−g) = ${number(result.signed)} พื้นที่เรขาคณิต = ${number(result.area)} พื้นที่แต่ละส่วน: ${pieces}`);
  }
  function drawAccumulation() {
    if (!$('accumulationCanvas')) return;
    const a=Number($('accumulationPoint').value), A=LearningModels.accumulation, f=x=>Math.abs(x-1), bounds={xmin:-.15,xmax:3.15,ymin:-.3,ymax:3};
    const top=frame($('accumulationIntegrand'),bounds);
    if (top) { shade(top,f,0,a); curve(top,f); point(top,a,f(a),false,'--warning'); top.ctx.restore(); }
    const bottom=frame($('accumulationCanvas'),bounds);
    if (bottom) { curve(bottom,x=>x>=0&&x<=3?A(x):NaN); curve(bottom,x=>A(a)+f(a)*(x-a),'--ink',true); point(bottom,a,A(a),false,'--warning'); bottom.ctx.restore(); }
    $('accumulationStats').textContent=tr(`x = ${number(a)} · Accumulated area A(x) = ${number(A(a))} · Tangent slope A′(x) = |x−1| = ${number(f(a))}. At x=1, slope is zero but A keeps increasing.`,`x = ${number(a)} · พื้นที่สะสม A(x) = ${number(A(a))} · ความชันเส้นสัมผัส A′(x) = |x−1| = ${number(f(a))} ที่ x=1 ความชันเป็นศูนย์ แต่ A ยังคงเพิ่ม`);
  }
  function drawCalculator() {
    const canvas = $('calcGraph') || $('intGraph'); if (!canvas) return;
    const isDerivative = Boolean($('calcGraph')), input = $(isDerivative ? 'derivExpr' : 'intExpr');
    let xmin = -5, xmax = 5;
    const numeric = lastCalculation?.result.numeric;
    if (!isDerivative && numeric && numeric.a !== numeric.b && Math.abs(numeric.b - numeric.a) < 25) { xmin = Math.min(numeric.a, numeric.b) - .5; xmax = Math.max(numeric.a, numeric.b) + .5; }
    const g = frame(canvas, { xmin, xmax, ymin: -6, ymax: 6 }); if (!g) return;
    try {
      const f = CalcMath.expression(lastCalculation?.source || input.value);
      if (!isDerivative && numeric) shade(g, f.evaluate, numeric.a, numeric.b);
      curve(g, f.evaluate);
      if (isDerivative && lastCalculation?.result.expression) {
        const compiled = math.compile(lastCalculation.result.expression);
        curve(g, x => { try { const y = compiled.evaluate({ x }); return typeof y === 'number' ? y : NaN; } catch { return NaN; } }, '--accent2', true);
      }
    } catch { /* Output explains invalid input; empty axes remain usable. */ }
    g.ctx.restore();
  }

  let activeWorker = null, jobTimer = null, lastCalculation = null, lastError = null;
  const out = $('derivOut') || $('intOut'), submit = $('derivCalcBtn') || $('intCalcBtn');
  function setBusy(busy) {
    if (!submit) return;
    submit.disabled = busy; out.setAttribute('aria-busy', String(busy));
    submit.textContent = busy ? tr('Calculating…', 'กำลังคำนวณ…') : $('derivExpr') ? tr('Differentiate', 'หาอนุพันธ์') : tr('Integrate', 'อินทิเกรต');
  }
  function stopWorker() { clearTimeout(jobTimer); activeWorker?.terminate(); activeWorker = null; setBusy(false); }
  function displayError(code) { lastError = code; clearMath(out); paragraph(out, errorText(code), 'error'); }
  function displayCalculation(record) {
    const { result, kind } = record; clearMath(out);
    if (kind === 'derivative') {
      paragraph(out, tr(`Derivative of order ${result.order}`, `อนุพันธ์อันดับ ${result.order}`), 'result-label');
      formula(out, result.tex);
      if (result.stages?.length > 1) {
        const details = document.createElement('details'), summary = document.createElement('summary');
        summary.textContent = tr('Successive derivatives', 'อนุพันธ์แต่ละอันดับ'); details.append(summary);
        result.stages.forEach((tex,i) => formula(details, `f^{(${i+1})}(x)=${tex}`)); out.append(details);
      }
      if (result.point !== undefined) paragraph(out, tr(`At x = ${number(result.point)}: ${number(result.value)}`, `ที่ x = ${number(result.point)}: ${number(result.value)}`));
      paragraph(out, tr('Green: original function. Blue dashed: the selected derivative. Check the real domain, corners and endpoints before interpreting the formula.', 'สีเขียว: ฟังก์ชันเดิม เส้นประน้ำเงิน: อนุพันธ์อันดับที่เลือก ตรวจโดเมนค่าจริง มุมแหลม และปลายช่วงก่อนใช้สูตร'), 'input-help');
    } else {
      if (result.tex) { paragraph(out, tr('Antiderivative', 'ปฏิยานุพันธ์'), 'result-label'); formula(out, `${result.tex}+C`); paragraph(out, tr('Valid on intervals where the real expression and its derivative exist; constants may differ between disconnected intervals.', 'ใช้บนช่วงที่นิพจน์ค่าจริงและอนุพันธ์นิยาม ค่าคงที่อาจต่างกันระหว่างช่วงที่ไม่เชื่อมต่อกัน'), 'input-help'); }
      else paragraph(out, result.pendingSymbolic ? tr('Numerical analysis finished. Looking for an antiderivative…', 'วิเคราะห์เชิงตัวเลขแล้ว กำลังหาปฏิยานุพันธ์…') : result.symbolicTimeout ? tr('Symbolic calculation timed out. The completed numerical analysis is retained below.', 'การคำนวณเชิงสัญลักษณ์หมดเวลา ผลวิเคราะห์เชิงตัวเลขที่เสร็จแล้วยังคงอยู่ด้านล่าง') : tr('An elementary antiderivative is unavailable from this solver. This does not affect a valid numerical estimate below.', 'เครื่องมือนี้ยังหาปฏิยานุพันธ์รูปฟังก์ชันมูลฐานไม่ได้ แต่ยังแสดงค่าประมาณเชิงตัวเลขที่คำนวณได้ด้านล่าง'), 'input-help');
      if (result.numeric) {
        paragraph(out, tr('Numerical definite integral ≈ ', 'ปริพันธ์จำกัดเขตเชิงตัวเลข ≈ ') + number(result.numeric.value), 'numeric-answer');
        paragraph(out, tr(`Bounds: ${number(result.numeric.a)} → ${number(result.numeric.b)}. Estimated absolute error: ${result.numeric.error.toExponential(2)}. Adaptive Simpson method; assumes continuity.`, `ขอบเขต: ${number(result.numeric.a)} → ${number(result.numeric.b)} ค่าคลาดเคลื่อนสัมบูรณ์โดยประมาณ: ${result.numeric.error.toExponential(2)} ใช้วิธีซิมป์สันปรับช่วง โดยสมมติความต่อเนื่อง`), 'input-help');
      }
      if (result.numericError) paragraph(out, errorText(result.numericError), 'error');
    }
    typeset(out);
  }
  $('calculatorForm')?.addEventListener('submit', e => {
    e.preventDefault(); stopWorker(); lastCalculation = null; lastError = null;
    const kind = $('derivExpr') ? 'derivative' : 'integral', source = $(kind === 'derivative' ? 'derivExpr' : 'intExpr').value;
    const message = { kind, expression: source, order: Number($('derivOrder')?.value || 1), point: $('derivPoint')?.value || '', a: $('intA')?.value || '', b: $('intB')?.value || '' };
    try { CalcMath.expression(source); } catch (error) { displayError(error.code || 'engine'); drawCalculator(); return; }
    setBusy(true); clearMath(out); paragraph(out, tr('Calculating…', 'กำลังคำนวณ…'));
    try {
      const worker = activeWorker = new Worker('calculator-worker.js');
      worker.onmessage = ({ data }) => {
        if (activeWorker !== worker) return;
        if (!data.partial) stopWorker();
        if (data.error) displayError(data.error);
        else { lastCalculation = { kind, source, result: { ...data.result, pendingSymbolic: Boolean(data.partial) } }; displayCalculation(lastCalculation); }
        drawCalculator();
      };
      worker.onerror = () => { if (activeWorker !== worker) return; stopWorker(); displayError('worker'); };
      jobTimer = setTimeout(() => {
        if (activeWorker !== worker) return;
        stopWorker();
        if (lastCalculation?.result.pendingSymbolic) {
          lastCalculation.result.pendingSymbolic = false; lastCalculation.result.symbolicTimeout = true; displayCalculation(lastCalculation);
        } else displayError('timeout');
      }, 8000);
      worker.postMessage(message);
    } catch { stopWorker(); displayError('worker'); }
  });
  // Invalidate an old answer as soon as its inputs change; never label it as a new result.
  all('#calculatorForm input, #calculatorForm select').forEach(input => input.addEventListener('input', () => {
    stopWorker(); lastCalculation = null; lastError = null; clearMath(out); paragraph(out, tr('Inputs changed. Calculate to update the result.', 'ข้อมูลเปลี่ยนแล้ว กดคำนวณเพื่ออัปเดตคำตอบ')); drawCalculator();
  }));
  function redraw() { drawFunction(); drawTangent(); drawRiemann(); drawLimit(); drawArea(); drawCurveAnalysis(); drawBetween(); drawAccumulation(); drawCalculator(); }
  $('graphDraw')?.addEventListener('click', drawFunction);
  $('graphExpr')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); drawFunction(); } });
  ['xSlider', 'hSlider', 'tangentFunction', 'showDerivative'].forEach(id => $(id)?.addEventListener('input', drawTangent));
  ['nSlider', 'riemannMethod'].forEach(id => $(id)?.addEventListener('input', drawRiemann));
  ['limitFunction', 'limitDistance'].forEach(id => $(id)?.addEventListener('input', drawLimit));
  $('areaBound')?.addEventListener('input', drawArea);
  ['curvePoint','curveSecond'].forEach(id=>$(id)?.addEventListener('input',drawCurveAnalysis));
  ['betweenFunction','betweenFraction'].forEach(id=>$(id)?.addEventListener('input',drawBetween));
  $('accumulationPoint')?.addEventListener('input',drawAccumulation);
  let resizeFrame;
  window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(redraw); });
  window.addEventListener('load', redraw);
  // Visible by default: motion enhancement must never hide course content on failure.
  if ('IntersectionObserver' in window) {
    const links = all('.sidebar a[href^="#"]');
    const spy = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => { const active = a.hash === '#' + entry.target.id; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }), { rootMargin: '-15% 0px -65% 0px' });
    all('.lesson-section[id]').forEach(s => spy.observe(s));
  }
  syncLanguage(); revealHash();
})();
