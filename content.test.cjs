const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const M=require('../learning-models.js');
const data=require('../content/practice.json');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('all eight topics have a complete difficulty progression and bilingual guided solutions',()=>{
  assert.equal(data.length,60);assert.equal(new Set(data.map(p=>p.id)).size,60);
  const topics=['limits','continuity','derivatives','applications','integrals','techniques','ftc','areas'];
  for(const topic of topics)for(const level of ['basic','intermediate','difficult','challenge'])assert.ok(data.some(p=>p.topic===topic&&p.level===level),`${topic}/${level}`);
  const d=new JSDOM(fs.readFileSync('practice.html','utf8')).window.document;
  for(const p of data){
    const el=d.getElementById(p.id);assert.ok(el,p.id);
    for(const field of ['title','question','hint','answer'])for(const lang of ['en','th'])assert.ok(p[field][lang].trim().length>2,`${p.id} ${field}/${lang}`);
    assert.ok(p.steps.length >= (['difficult','challenge'].includes(p.level)&&!p.id.match(/-\d+$/)?4:3),p.id);
    assert.equal(el.querySelectorAll('.solution-steps > li').length,p.steps.length);
    assert.ok(el.querySelector('.hint-details + .solution-details'),`${p.id}: hint precedes answer`);
    assert.ok(!el.querySelector('details[open]'),`${p.id}: answers start collapsed`);
    assert.ok(el.querySelector('.solution-details .final-answer'),`${p.id}: final answer is inside solution`);
    assert.ok(el.querySelector(`[data-complete="${p.id}"]`),`${p.id}: explicit completion`);
  }
});
test('every anchor from the current GitHub website is preserved',()=>{
  for(const [file,ids] of Object.entries(require('./pre-upgrade-anchors.json'))){
    const d=new JSDOM(fs.readFileSync(file,'utf8')).window.document;
    for(const id of ids)assert.ok(d.getElementById(id),`${file}#${id} was removed`);
  }
});
test('all new lessons and exercises have a bilingual search result',()=>{
  const vm=require('node:vm'),ctx={window:{}};vm.runInNewContext(fs.readFileSync('search-index.js','utf8'),ctx);
  const index=ctx.window.SEARCH_INDEX;
  assert.equal(new Set(index.map(r=>r.url)).size,index.length);
  for(const p of data){const r=index.find(r=>r.url===`practice.html#${p.id}`);assert.ok(r,p.id);assert.equal(r.en,p.title.en);assert.equal(r.th,p.title.th);}
  for(const id of ['trig-substitution','between-curves-lab','accumulation-lab'])assert.ok(index.some(r=>r.url===`integrals.html#${id}`));
});
test('geometric area splits crossing lobes rather than canceling them',()=>{
  const full=M.between('crossing',-1,1);near(full.area,.5);near(full.signed,0);assert.equal(full.parts.length,2);
  near(M.between('crossing',-1,0).area,.25);near(M.between('crossing',0,1).area,.25);
  const reverse=M.between('crossing',0,-1);near(reverse.signed,.25);near(reverse.area,.25);
  near(M.between('parabola',-1,3).area,32/3);
  near(M.between('parabola',2,2).area,0);
});
test('area laboratory remains monotone as its upper bound advances',()=>{
  for(const [name,r] of Object.entries(M.regions)){
    let previous=0;
    for(let n=0;n<=100;n++){const value=M.between(name,r.lo,r.lo+(r.hi-r.lo)*n/100).area;assert.ok(value>=previous-1e-12);previous=value;}
  }
});
test('accumulation has the expected area and derivative on both sides of its join',()=>{
  near(M.accumulation(0),0);near(M.accumulation(1),.5);near(M.accumulation(3),2.5);
  for(const x of [.2,.8,1.2,2.9])near((M.accumulation(x+1e-5)-M.accumulation(x-1e-5))/2e-5,Math.abs(x-1));
  // At the join A is C¹ but not C²; the finite difference has an O(h) error.
  for(const h of [.01,.001,.0001]){
    near((M.accumulation(1+h)-M.accumulation(1))/h,h/2);
    near((M.accumulation(1)-M.accumulation(1-h))/h,h/2);
  }
  assert.ok(M.accumulation(.99)<M.accumulation(1)&&M.accumulation(1)<M.accumulation(1.01));
});
test('quartic markers distinguish extrema and inflections',()=>{
  for(const x of [-Math.SQRT2,Math.SQRT2]){near(M.quarticD(x),0);near(M.quartic(x),-4);assert.ok(M.quarticDD(x)>0);}
  near(M.quarticD(0),0);assert.ok(M.quarticDD(0)<0);
  for(const x of [-Math.sqrt(2/3),Math.sqrt(2/3)]){near(M.quarticDD(x),0);near(M.quartic(x),-20/9);assert.ok(M.quarticDD(x-.01)*M.quarticDD(x+.01)<0);}
});
test('no malformed derivative primes or interpreted TeX escape characters remain',()=>{
  for(const file of ['index.html','limits.html','derivatives.html','integrals.html','practice.html','content/practice.json']){
    const source=fs.readFileSync(file,'utf8');
    assert.ok(!source.includes('prime^{'),file);
    assert.ok(!source.includes("^{'}"),file);
    assert.ok(!/[\x08\x0b\x0c]/.test(source),`${file}: interpreted escape`);
    assert.ok(!/\t(?:heta|an)/.test(source),`${file}: damaged trigonometric TeX`);
  }
});
