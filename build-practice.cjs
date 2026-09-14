/* Reproducible static output: practice remains readable with JavaScript disabled. */
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const topics = {
  limits: ['Limits', 'ลิมิต'], continuity: ['Continuity', 'ความต่อเนื่อง'],
  derivatives: ['Derivatives', 'อนุพันธ์'], applications: ['Applications of derivatives', 'การประยุกต์อนุพันธ์'],
  integrals: ['Integrals', 'ปริพันธ์'], techniques: ['Integration techniques', 'เทคนิคการอินทิเกรต'],
  ftc: ['Fundamental Theorem & accumulation', 'ทฤษฎีบทมูลฐานและการสะสม'], areas: ['Areas between curves', 'พื้นที่ระหว่างเส้นโค้ง']
};
const levels = { basic: ['Basic', 'พื้นฐาน'], intermediate: ['Intermediate', 'ปานกลาง'], difficult: ['Difficult', 'ยาก'], challenge: ['Challenge / exam', 'ท้าทาย / แนวสอบ'] };
const problems = JSON.parse(fs.readFileSync('content/practice.json', 'utf8'));
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi = pair => ['en','th'].map((lang, i) => `<span class="lang-${lang}" lang="${lang}">${escape(Array.isArray(pair) ? pair[i] : pair[lang])}</span>`).join('');
if (new Set(problems.map(p => p.id)).size !== problems.length) throw Error('Duplicate problem IDs');
for (const p of problems) {
  if (!/^[a-z0-9-]+$/.test(p.id) || !topics[p.topic] || !levels[p.level] || p.steps.length < 3) throw Error(`Invalid problem ${p.id}`);
  for (const field of [p.title,p.question,p.hint,p.answer,...p.steps]) if (!field.en?.trim() || !field.th?.trim()) throw Error(`Missing translation in ${p.id}`);
}
const dom = new JSDOM(fs.readFileSync('practice.html','utf8')), d = dom.window.document;
d.querySelectorAll('main .lesson-section').forEach(s => s.remove());
const options = dict => `<option value="all" data-en="All" data-th="ทั้งหมด">All</option>` + Object.entries(dict).map(([value,pair]) => `<option value="${value}" data-en="${escape(pair[0])}" data-th="${escape(pair[1])}">${escape(pair[0])}</option>`).join('');
d.getElementById('practiceTopic').innerHTML = options(topics);
d.getElementById('practiceLevel').innerHTML = options(levels);
const links = Object.entries(topics).map(([id,label]) => `<a href="#${id}-practice">${bi(label)}</a>`).join('\n');
const sidebar = d.querySelector('.sidebar');
sidebar.innerHTML = sidebar.querySelector('.toc-title').outerHTML + '\n' + links;
d.querySelector('.mobile-toc nav').innerHTML = links;
d.getElementById('practiceProgress').max = problems.length;
for (const [topic,label] of Object.entries(topics)) {
  const group = problems.filter(p => p.topic === topic).sort((a,b) => Object.keys(levels).indexOf(a.level)-Object.keys(levels).indexOf(b.level));
  const cards = group.map(p => `<article class="problem" id="${p.id}" data-topic="${p.topic}" data-level="${p.level}">
<div class="problem-top"><div class="problem-tags"><span class="tag">${bi(levels[p.level])}</span><span class="topic-tag">${bi(label)}</span></div><h3>${bi(p.title)}</h3><p class="problem-question">${bi(p.question)}</p></div>
<details class="hint-details"><summary>${bi(['Hint','คำใบ้'])}</summary><p>${bi(p.hint)}</p></details>
<details class="solution-details"><summary>${bi(['Step-by-step solution','วิธีทำทีละขั้นตอน'])}</summary><ol class="solution-steps">${p.steps.map(s => `<li><p>${bi(s)}</p>${s.tex ? `<div class="equation-block">$$${escape(s.tex)}$$</div>` : ''}</li>`).join('\n')}</ol><div class="final-answer"><strong>${bi(['Final answer','คำตอบสุดท้าย'])}</strong><p>${bi(p.answer)}</p></div></details>
<label class="completion-control"><input type="checkbox" data-complete="${p.id}"> ${bi(['I can solve this independently','ฉันทำข้อนี้ได้ด้วยตัวเอง'])}</label></article>`).join('\n');
  d.querySelector('main').insertAdjacentHTML('beforeend',`<section class="lesson-section" id="${topic}-practice"><h2>${bi(label)}</h2><p class="input-help">${bi([`${group.length} worked problems · progress from basic ideas to exam-style reasoning`,`${group.length} ข้อพร้อมวิธีทำ · เริ่มจากพื้นฐานสู่การให้เหตุผลแบบข้อสอบ`])}</p>${cards}</section>`);
}
// HTML parsing moves trailing document whitespace into the body. Remove only
// structural whitespace so repeated builds do not append blank lines forever.
for (const parent of [d.documentElement,d.body,d.querySelector('main')]) {
  [...parent.childNodes].filter(n=>n.nodeType===3&&!n.textContent.trim()).forEach(n=>n.remove());
}
fs.writeFileSync('practice.html',dom.serialize()+'\n'); dom.window.close();
console.log(`Built ${problems.length} bilingual worked problems across ${Object.keys(topics).length} topics.`);
