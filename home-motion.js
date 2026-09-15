/* A full-viewport midpoint Riemann-sum illustration. No external libraries. */
(()=>{
 'use strict';
 const scene=document.getElementById('integralScene');if(!scene)return;
 const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const f=x=>1+.7*Math.sin(.9*x)+.1*x;
 const exact=6+.7*(1-Math.cos(5.4))/.9+1.8;
 let paused=reduced.matches,frame=0,last=0,elapsed=0,visible=true,n=0,rects=[];
 const en=()=>document.documentElement.lang!=='th';
 const fmt=x=>x.toFixed(5);
 function controls(){const b=$('integralPause');b.setAttribute('aria-pressed',String(paused));b.textContent=paused?(en()?'Play motion':'เล่นภาพเคลื่อนไหว'):(en()?'Pause motion':'หยุดภาพเคลื่อนไหว');}
 function build(count){n=count;$('integralBars').replaceChildren();rects=[];for(let i=0;i<n;i++){const r=document.createElementNS(ns,'rect');$('integralBars').append(r);rects.push(r);}draw(1);}
 function draw(reveal){
  const w=scene.clientWidth||1440,h=scene.clientHeight||900;scene.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const left=w*.035,right=w*.965,base=h-175,scale=Math.min(h*.20,175),xp=x=>left+x/6*(right-left),yp=y=>base-y*scale;
  let d='';for(let i=0;i<=180;i++){const x=i/30;d+=(i?'L':'M')+xp(x).toFixed(2)+' '+yp(f(x)).toFixed(2);}
  $('integralCurve').setAttribute('d',d);$('integralFill').setAttribute('d',d+`L${right} ${base}L${left} ${base}Z`);
  $('integralAxis').setAttribute('d',`M${left} ${base}H${right}M${left} ${base+12}V${base-scale*2.25}`);
  let grid='';for(let i=1;i<12;i++)grid+=`M${left+(right-left)*i/12} ${base}V${base-scale*2.25}`;for(let i=1;i<5;i++)grid+=`M${left} ${base-scale*i*.5}H${right}`;
  $('integralGrid').innerHTML=`<path d="${grid}" fill="none"/>`;
  let sum=0;const dx=6/n;
  rects.forEach((r,i)=>{const height=f((i+.5)*dx);sum+=height*dx;r.setAttribute('x',xp(i*dx));r.setAttribute('y',yp(height));r.setAttribute('width',(right-left)/n);r.setAttribute('height',height*scale);r.setAttribute('opacity',Math.min(1,Math.max(0,reveal*n-i)));});
  $('integralApprox').textContent=fmt(sum);
  $('integralReadout').textContent=en()?`${n} midpoint rectangles · exact ${fmt(exact)} · f(x) = 1 + 0.7 sin(0.9x) + 0.1x`:`สี่เหลี่ยมจุดกึ่งกลาง ${n} แถบ · ค่าจริง ${fmt(exact)} · f(x) = 1 + 0.7 sin(0.9x) + 0.1x`;
 }
 function tick(now){if(paused||!visible||document.hidden){last=0;frame=0;return;}if(last)elapsed+=Math.min(now-last,80);last=now;const phase=(elapsed%16000)/4000,stage=Math.floor(phase),count=[8,16,32,64][stage];if(n!==count)build(count);draw(Math.min(1,(phase-stage)*2.5));frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
 $('integralPause').addEventListener('click',()=>{paused=!paused;controls();if(paused){stop();draw(1);}else start();});
 reduced.addEventListener?.('change',e=>{paused=e.matches;controls();stop();draw(1);start();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
 window.addEventListener('resize',()=>draw(1));
 new MutationObserver(()=>{controls();draw(1);}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();}).observe(scene);
 build(paused?64:8);controls();start();
})();
