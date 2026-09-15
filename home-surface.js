/* Perspective projection of z=sin(x)cos(y), with a moving curve and its floor projection. */
(()=>{
 'use strict';
 const canvas=document.getElementById('surfaceScene');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const hero=canvas.closest('.integral-hero'),button=document.getElementById('integralPause'),readout=document.getElementById('integralReadout');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduced.matches,visible=true,raf=0,last=0,clock=0,paint=0,width=0,height=0;
 const f=(x,y)=>Math.sin(x)*Math.cos(y),en=()=>document.documentElement.lang!=='th';
 const count=36,extent=4.2,step=extent*2/count,points=[];
 for(let i=0;i<=count;i++){points[i]=[];for(let j=0;j<=count;j++){const x=-extent+i*step,y=-extent+j*step;points[i][j]={x,y,z:f(x,y)};}}
 function size(){const r=hero.getBoundingClientRect();width=r.width||1440;height=r.height||900;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
 function project(x,y,z,angle){const ca=Math.cos(angle),sa=Math.sin(angle),rx=x*ca-y*sa,ry=x*sa+y*ca;const scale=width<760?Math.max(width/7.2,height/13):Math.min(width/10.6,height/7.7),perspective=1/(1+ry*.022);return{x:width*.53+rx*scale*perspective,y:height*.68+(ry*.44-z*.97)*scale*perspective,depth:ry};}
 function line(vertices,color,widthLine=1){ctx.beginPath();vertices.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=widthLine;ctx.stroke();}
 function draw(){
  if(!width)return;ctx.clearRect(0,0,width,height);const angle=-.48+Math.sin(clock*.00011)*.22,p=(x,y,z)=>project(x,y,z,angle);
  // Ground plane: the orange projection lies directly below the surface curve.
  for(let k=-4;k<=4;k++){line([p(-extent,k,-1.65),p(extent,k,-1.65)],'rgba(135,175,255,.13)',.7);line([p(k,-extent,-1.65),p(k,extent,-1.65)],'rgba(135,175,255,.13)',.7);}
  const projected=points.map(row=>row.map(a=>p(a.x,a.y,a.z))),cells=[];
  for(let i=0;i<count;i++)for(let j=0;j<count;j++){const q=[projected[i][j],projected[i+1][j],projected[i+1][j+1],projected[i][j+1]];cells.push({q,depth:q.reduce((s,a)=>s+a.depth,0)/4,z:(points[i][j].z+points[i+1][j+1].z)/2});}
  cells.sort((a,b)=>b.depth-a.depth);
  for(const {q,z} of cells){const hue=190+(z+1)*65;ctx.beginPath();q.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=`hsla(${hue},85%,57%,.22)`;ctx.fill();ctx.strokeStyle=`hsla(${hue},95%,72%,.68)`;ctx.lineWidth=.65;ctx.stroke();}
  // A fixed parametric path on the surface; the marker travels along it.
  const surface=[],floor=[];for(let i=0;i<=180;i++){const t=i/180*Math.PI*2,x=3.3*Math.cos(t),y=2.4*Math.sin(2*t);surface.push(p(x,y,f(x,y)));floor.push(p(x,y,-1.65));}
  line(floor,'rgba(255,174,71,.55)',1.4);line(surface,'rgba(255,205,108,.22)',7);line(surface,'#ffd27a',2);
  const t=clock*.00036,x=3.3*Math.cos(t),y=2.4*Math.sin(2*t),point=p(x,y,f(x,y)),shadow=p(x,y,-1.65);
  ctx.setLineDash([4,6]);line([point,shadow],'rgba(255,213,137,.55)',1);ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(point.x,point.y,5,0,Math.PI*2);ctx.fillStyle='#fff5d3';ctx.shadowColor='#ffce75';ctx.shadowBlur=15;ctx.fill();ctx.shadowBlur=0;
  const axes=[{a:p(0,0,-1.65),b:p(4.7,0,-1.65),label:'x'},{a:p(0,0,-1.65),b:p(0,4.7,-1.65),label:'y'},{a:p(0,0,-1.65),b:p(0,0,2.15),label:'f(x,y)'}];ctx.font='italic 14px Georgia';ctx.fillStyle='#d6e8ff';for(const axis of axes){line([axis.a,axis.b],'rgba(213,234,255,.5)',1);ctx.fillText(axis.label,axis.b.x+6,axis.b.y-6);}
 }
 function labels(){button.setAttribute('aria-pressed',String(paused));button.textContent=paused?(en()?'Play motion':'เล่นภาพเคลื่อนไหว'):(en()?'Pause motion':'หยุดภาพเคลื่อนไหว');readout.textContent=en()?'3D surface · gold curve and its projection · x, y ∈ [−4.2, 4.2]':'พื้นผิวสามมิติ · เส้นสีทองและภาพฉายด้านล่าง · x, y ∈ [−4.2, 4.2]';}
 function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
 function tick(now){if(paused||!visible||document.hidden){stop();return;}if(last)clock+=Math.min(now-last,80);last=now;if(now-paint>=33){draw();paint=now;}raf=requestAnimationFrame(tick);}
 function start(){if(!raf&&!paused&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
 button.addEventListener('click',()=>{paused=!paused;labels();if(paused)stop();else start();});
 reduced.addEventListener?.('change',e=>{paused=e.matches;labels();stop();start();});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());window.addEventListener('resize',size);
 new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();}).observe(hero);
 size();labels();start();
})();
