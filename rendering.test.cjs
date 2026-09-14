const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const pages=['index','limits','derivatives','integrals','practice'];
for(const page of pages){
  test(`MathJax renders all ${page} equations without TeX errors`,async()=>{
    const vc=new VirtualConsole(), errors=[];vc.on('jsdomError',e=>errors.push(e.message));
    const dom=new JSDOM(fs.readFileSync(page+'.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
    for(const script of dom.window.document.querySelectorAll('script:not([src])'))dom.window.eval(script.textContent);
    dom.window.eval(fs.readFileSync('vendor/mathjax.js','utf8'));
    await dom.window.MathJax.startup.promise;
    assert.ok(dom.window.document.querySelectorAll('mjx-container').length>0);
    assert.deepEqual([...dom.window.document.querySelectorAll('[data-mml-node="merror"]')].map(x=>x.textContent),[]);
    assert.deepEqual(errors,[]);dom.window.close();
  });
}
for(const page of pages){
  test(`axe accessibility structure: ${page}`,async()=>{
    const dom=new JSDOM(fs.readFileSync(page+'.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;
    // Avoid unimplemented layout/canvas operations; contrast has a separate palette test.
    w.eval(fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8'));
    const results=await w.axe.run(w.document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']},rules:{'color-contrast':{enabled:false}}});
    assert.equal(results.violations.length,0,JSON.stringify(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));w.close();
  });
}
function luminance(hex){const rgb=hex.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('text palette satisfies WCAG AA contrast in light and dark themes',()=>{
  const css=fs.readFileSync('styles.css','utf8');
  for(const block of [css.match(/:root\s*\{([^}]+)/)[1],css.match(/html\[data-theme="dark"\]\s*\{([^}]+)/)[1]]){
    const vars=Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(m=>[m[1],m[2]]));
    for(const foreground of ['ink','muted','accent','accent2','error'])for(const background of ['bg','paper','soft'])assert.ok(contrast(vars[foreground],vars[background])>=4.5,`${foreground}/${background}: ${contrast(vars[foreground],vars[background])}`);
    assert.ok(contrast(vars.paper,vars.accent)>=4.5,'primary button contrast');
  }
});
test('responsive, reduced-motion and no-JS affordances are retained',()=>{
  const css=fs.readFileSync('styles.css','utf8');assert.match(css,/max-width: 900px/);assert.match(css,/max-width: 620px/);assert.match(css,/prefers-reduced-motion: reduce/);
  assert.ok(!/\.reveal\s*\{[^}]*opacity:\s*0/.test(css));
  for(const page of pages){const d=new JSDOM(fs.readFileSync(page+'.html','utf8')).window.document;assert.ok(d.querySelector('.mobile-nav summary'));if(page!=='index')assert.ok(d.querySelector('.mobile-toc summary'));}
});
