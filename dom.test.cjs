const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { Worker: Thread } = require('node:worker_threads');
const pages = ['index','limits','derivatives','integrals','practice'];
function load(name, { lang='en', theme='light', deniedStorage=false, workerClass, fastTimeout=false, canvasWidth=600 } = {}) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(fs.readFileSync(`${name}.html`, 'utf8'), { url: `http://localhost/${name}.html`, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false });
  if (deniedStorage) Object.defineProperty(w, 'localStorage', { get() { throw new Error('denied'); } });
  else { w.localStorage.setItem('calc-lang', lang); w.localStorage.setItem('calc-theme', theme); }
  const ctx = new Proxy({}, { get: (_, key) => key === 'measureText' ? () => ({ width: 30 }) : (...args) => {for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),`${name}: nonfinite ${String(key)}`);}, set: () => true });
  w.HTMLCanvasElement.prototype.getContext = () => ctx;
  w.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({width:canvasWidth});
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  w.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new w.Event('close')); };
  w.Worker = class {
    constructor(filename) {
      this.thread = new Thread(`const {parentPort}=require('node:worker_threads');const fs=require('node:fs');const vm=require('node:vm');const ctx=vm.createContext({console});ctx.self=ctx;ctx.importScripts=(...files)=>files.forEach(file=>vm.runInContext(fs.readFileSync(file,'utf8'),ctx));ctx.postMessage=data=>parentPort.postMessage(data);vm.runInContext(fs.readFileSync(${JSON.stringify(filename)},'utf8'),ctx);parentPort.on('message',data=>ctx.onmessage({data}));`, { eval: true });
      this.thread.on('message', data => this.onmessage?.({ data })); this.thread.on('error', error => this.onerror?.(error));
    }
    postMessage(data) { this.thread.postMessage(data); }
    terminate() { this.thread.terminate(); }
  };
  if(workerClass)w.Worker=workerClass;
  if(fastTimeout){const timer=w.setTimeout.bind(w);w.setTimeout=(fn,delay)=>timer(fn,delay===8000?20:delay);}
  for (const script of ['theme.js','vendor/math.js','math-core.js','learning-models.js','search-index.js','app.js']) w.eval(fs.readFileSync(script,'utf8'));
  return { dom, w, d: w.document, errors, close: () => w.close() };
}
for (const page of pages) for (const lang of ['en','th']) {
  test(`initialize ${page} in ${lang} with no runtime errors`, () => {
    const s = load(page, {lang,theme:'dark'});
    assert.equal(s.d.documentElement.lang, lang); assert.equal(s.d.documentElement.dataset.theme,'dark');
    assert.equal(s.d.querySelectorAll('main').length, 1);
    assert.equal(s.d.querySelectorAll('.top-nav [aria-current="page"]').length,1);
    assert.deepEqual(s.errors, []); s.close();
  });
}
test('blocked storage does not break navigation, language or graphs', () => { const s=load('index',{deniedStorage:true}); s.d.querySelector('[data-lang-toggle]').click(); assert.equal(s.d.documentElement.lang,'th'); assert.ok(s.d.getElementById('graphStatus').textContent.includes('f(0)')); assert.deepEqual(s.errors,[]);s.close(); });
test('search indexes body text and Thai, and restores opener focus', () => {
  const s=load('limits'), open=s.d.querySelector('[data-search-open]');open.click();assert.ok(s.d.getElementById('searchOverlay').open);
  const input=s.d.getElementById('searchInput');input.value='เอปไซลอน';input.dispatchEvent(new s.w.Event('input'));
  assert.ok(s.d.querySelector('#searchResults a[href="limits.html#epsilon-delta"]'));
  input.value='<script>alert(1)</script>';input.dispatchEvent(new s.w.Event('input'));assert.equal(s.d.querySelectorAll('#searchResults script').length,0);
  s.d.getElementById('searchClose').click();assert.equal(s.d.activeElement,open);s.close();
});
test('language switching preserves query and localizes controls', () => { const s=load('integrals');s.d.querySelector('[data-search-open]').click();s.d.getElementById('searchInput').value='riemann';s.d.querySelector('[data-lang-toggle]').click();assert.equal(s.d.getElementById('searchInput').value,'riemann');assert.equal(s.d.getElementById('riemannMethod').selectedOptions[0].textContent,'จุดกึ่งกลาง');s.close(); });
test('all practice questions filter and explicit completion persists', () => {
  const s=load('practice');assert.equal(s.d.querySelectorAll('.problem').length,60);
  const topic=s.d.getElementById('practiceTopic');topic.value='limits';topic.dispatchEvent(new s.w.Event('change'));
  assert.equal(s.d.querySelectorAll('.problem:not([hidden])').length,14);
  s.d.querySelector('[data-complete="limits-1"]').click();assert.ok(JSON.parse(s.w.localStorage.getItem('calc-completed-v3')).includes('limits-1'));
  s.d.getElementById('hideCompleted').click();assert.equal(s.d.querySelectorAll('.problem:not([hidden])').length,13);
  assert.equal(s.d.getElementById('practiceProgress').value,1);s.close();
});
test('all graph demos change their accessible numeric output', () => {
  for (const [name,input,value,status] of [['limits','limitDistance','4','limitStats'],['derivatives','xSlider','2','tangentStats'],['integrals','nSlider','100','riemannStats'],['integrals','areaBound','0','areaStats'],['derivatives','curvePoint','1','curveStats'],['integrals','betweenFraction','.5','betweenStats'],['integrals','accumulationPoint','1','accumulationStats']]) {
    const s=load(name), before=s.d.getElementById(status).textContent;const slider=s.d.getElementById(input);slider.value=value;slider.dispatchEvent(new s.w.Event('input'));
    assert.notEqual(s.d.getElementById(status).textContent,before);assert.deepEqual(s.errors,[]);s.close();
  }
});
async function waitFor(fn) { const until=Date.now()+9000;while(!fn()){ if(Date.now()>until)throw Error('timeout waiting for calculator'); await new Promise(r=>setTimeout(r,25)); } }
for (const [page,expr,expected] of [['derivatives','x^2','2'],['integrals','x^2','Numerical definite integral']]) {
  test(`real calculator worker completes: ${page}`,async()=>{
    const s=load(page);s.d.getElementById(page==='derivatives'?'derivExpr':'intExpr').value=expr;
    s.d.getElementById('calculatorForm').dispatchEvent(new s.w.Event('submit',{cancelable:true}));
    const out=s.d.getElementById(page==='derivatives'?'derivOut':'intOut');await waitFor(()=>out.getAttribute('aria-busy')==='false');
    assert.ok(out.textContent.includes(expected),out.textContent);assert.ok(!out.querySelector('.error'));assert.deepEqual(s.errors,[]);s.close();
  });
}
test('calculator reports singular interval and clears stale results on edits',async()=>{
  const s=load('integrals');s.d.getElementById('intExpr').value='1/x';s.d.getElementById('intA').value='-1';s.d.getElementById('intB').value='1';
  s.d.getElementById('calculatorForm').dispatchEvent(new s.w.Event('submit',{cancelable:true}));const out=s.d.getElementById('intOut');await waitFor(()=>out.getAttribute('aria-busy')==='false');
  assert.match(out.textContent,/singularity/);assert.ok(!out.querySelector('.numeric-answer'));
  s.d.getElementById('intExpr').dispatchEvent(new s.w.Event('input'));assert.match(out.textContent,/Inputs changed/);s.close();
});
test('a symbolic timeout preserves completed numerical analysis',async()=>{
  let worker;
  class WaitingWorker{constructor(){worker=this;}postMessage(){}terminate(){}}
  const s=load('integrals',{workerClass:WaitingWorker,fastTimeout:true});
  s.d.getElementById('calculatorForm').dispatchEvent(new s.w.Event('submit',{cancelable:true}));
  worker.onmessage({data:{partial:true,result:{numeric:{value:1/3,a:0,b:1,error:0}}}});
  assert.match(s.d.getElementById('intOut').textContent,/Looking for an antiderivative/);
  await waitFor(()=>s.d.getElementById('intOut').getAttribute('aria-busy')==='false');
  assert.match(s.d.getElementById('intOut').textContent,/Symbolic calculation timed out/);
  assert.match(s.d.querySelector('.numeric-answer').textContent,/0.333333333/);s.close();
});
test('a canceled worker cannot overwrite the result of a newer request',()=>{
  const workers=[];
  class ControlledWorker{constructor(){workers.push(this);}postMessage(){}terminate(){}}
  const s=load('derivatives',{workerClass:ControlledWorker}),form=s.d.getElementById('calculatorForm'),input=s.d.getElementById('derivExpr'),out=s.d.getElementById('derivOut');
  form.dispatchEvent(new s.w.Event('submit',{cancelable:true}));
  input.value='x^3';input.dispatchEvent(new s.w.Event('input'));
  form.dispatchEvent(new s.w.Event('submit',{cancelable:true}));
  workers[0].onmessage({data:{error:'symbolic'}});
  assert.equal(out.getAttribute('aria-busy'),'true');assert.ok(!out.querySelector('.error'));
  workers[1].onmessage({data:{result:{order:1,tex:'3x^2',expression:'3*x^2'}}});
  assert.equal(out.getAttribute('aria-busy'),'false');assert.match(out.textContent,/3x\^2/);s.close();
});
test('new graph presets and dark/language switching update their readable explanations',()=>{
  const s=load('limits');const menu=s.d.getElementById('limitFunction');
  menu.value='pole';menu.dispatchEvent(new s.w.Event('input'));assert.match(s.d.getElementById('limitStats').textContent,/−∞/);
  menu.value='oscillating';menu.dispatchEvent(new s.w.Event('input'));assert.match(s.d.getElementById('limitStats').textContent,/squeeze/);
  s.d.querySelector('[data-theme-toggle]').click();assert.equal(s.d.documentElement.dataset.theme,'dark');
  s.d.querySelector('[data-lang-toggle]').click();assert.equal(menu.value,'oscillating');assert.match(menu.selectedOptions[0].textContent,/ทฤษฎีบทบีบ/);
  assert.deepEqual(s.errors,[]);s.close();
});
test('all graph projections remain finite at narrow, tablet and desktop canvas widths',()=>{
  for(const canvasWidth of [224,540,1000])for(const page of ['index','limits','derivatives','integrals']){
    const s=load(page,{canvasWidth});assert.deepEqual(s.errors,[]);for(const c of s.d.querySelectorAll('canvas'))assert.ok(c.width>0&&c.height>0);s.close();
  }
});
test('static links, anchors, labels, translations and local assets',()=>{
  const docs=Object.fromEntries(pages.map(p=>[p+'.html',new JSDOM(fs.readFileSync(p+'.html','utf8')).window.document]));
  for(const [file,d] of Object.entries(docs)){
    const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,`${file}: duplicate IDs`);
    for(const a of d.querySelectorAll('a[href]')){
      const url=new URL(a.getAttribute('href'),'https://example.test/'+file);if(url.origin!=='https://example.test')continue;
      const target=docs[url.pathname.slice(1)];assert.ok(target,`${file}: missing ${url.pathname}`);
      if(url.hash)assert.ok(target.getElementById(decodeURIComponent(url.hash.slice(1))),`${file}: missing ${url.hash}`);
    }
    for(const el of d.querySelectorAll('script[src],link[rel="stylesheet"],link[rel="icon"]')){const src=el.getAttribute('src')||el.getAttribute('href');if(!src.startsWith('http')){const local=src.split(/[?#]/,1)[0];assert.ok(fs.existsSync(local),`${file}: missing ${local}`);}}
    for(const input of d.querySelectorAll('input,select,canvas,button')){
      const accessible=input.getAttribute('aria-label')||input.textContent.trim()||input.closest('label')||input.id&&d.querySelector(`label[for="${input.id}"]`);
      assert.ok(accessible,`${file}: unlabeled ${input.outerHTML}`);
    }
    for(const el of d.querySelectorAll('.lang-en'))assert.ok(el.parentElement.querySelector('.lang-th'),`${file}: missing Thai counterpart`);
    for(const id of require('./legacy-anchors.json')[file])assert.ok(d.getElementById(id),`${file}: removed original anchor ${id}`);
  }
});
test('deployment guard prevents bilingual flashes and stale critical assets',()=>{
  for(const page of pages){
    const d=new JSDOM(fs.readFileSync(`${page}.html`,'utf8')).window.document;
    const guard=d.getElementById('critical-language-styles');
    assert.ok(guard?.textContent.includes('.lang-th{display:none!important}'),`${page}: missing critical language guard`);
    assert.match(d.querySelector('link[href^="styles.css"]').getAttribute('href'),/\?v=3\.1\.0$/);
    const mathjax=d.querySelector('script[src^="vendor/mathjax.js"]');
    assert.match(mathjax.getAttribute('onerror'),/cdn\.jsdelivr\.net\/npm\/mathjax@3\.2\.2/);
  }
});
