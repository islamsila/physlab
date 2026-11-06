/* Animation engine: canvas, utilities, registry */
window.ANIM = {};
window.LANG = window.LANG || 'uz';
(function(){
const COL={cy:'#22d3ee',mg:'#f472b6',li:'#a3e635',am:'#fbbf24',vi:'#a78bfa',rd:'#fb7185',tx:'#e2e8f0',mu:'#94a3b8',dk:'#0b1220',pn:'#162036',bl:'#60a5fa'};
function makeUtils(c){
  const u={c,col:COL};
  u.cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  u.mix=(a,b,t)=>a+(b-a)*t;
  u.ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  u.f=x=>Solver.fmt(x);
  u.tr=(uz,ru)=>window.LANG==='ru'?ru:uz;
  u.g=(P,k,d)=>(P&&P[k]!==undefined&&isFinite(P[k]))?P[k]:d;
  u.glow=(col,b)=>{c.shadowColor=col;c.shadowBlur=b===undefined?14:b;};
  u.noglow=()=>{c.shadowBlur=0;c.shadowColor='transparent';};
  u.line=(x1,y1,x2,y2,col,w,dash)=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=col||COL.mu;c.lineWidth=w||2;c.setLineDash(dash||[]);c.stroke();c.setLineDash([]);};
  u.circ=(x,y,r,fill,stroke,w)=>{c.beginPath();c.arc(x,y,Math.max(0,r),0,6.2832);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w||2;c.stroke();}};
  u.rect=(x,y,w,h,fill,stroke,r,lw)=>{c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r||0);else c.rect(x,y,w,h);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}};
  u.text=(s,x,y,col,size,al,wt)=>{c.fillStyle=col||COL.tx;c.font=(wt||'600')+' '+(size||14)+'px Inter,system-ui,sans-serif';c.textAlign=al||'center';c.textBaseline='middle';c.fillText(s,x,y);};
  u.arrow=(x1,y1,x2,y2,col,w)=>{const a=Math.atan2(y2-y1,x2-x1),L=Math.hypot(x2-x1,y2-y1);if(L<2)return;w=w||3;const hs=Math.min(12,L*.5)+w;
    c.strokeStyle=col;c.fillStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2-Math.cos(a)*hs*.6,y2-Math.sin(a)*hs*.6);c.stroke();
    c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-hs*Math.cos(a-.4),y2-hs*Math.sin(a-.4));c.lineTo(x2-hs*Math.cos(a+.4),y2-hs*Math.sin(a+.4));c.closePath();c.fill();};
  u.poly=(pts,fill,stroke,w)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w||2;c.stroke();}};
  u.bg=(W,H)=>{const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0e1729');g.addColorStop(1,'#080d19');c.fillStyle=g;c.fillRect(0,0,W,H);
    c.strokeStyle='rgba(120,150,200,.07)';c.lineWidth=1;c.beginPath();for(let x=0;x<W;x+=40){c.moveTo(x,0);c.lineTo(x,H);}for(let y=0;y<H;y+=40){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();};
  u.floor=(W,y)=>{u.rect(0,y,W,300,'#111b30');u.line(0,y,W,y,'#334155',2);};
  u.label=(s,x,y,col)=>{u.text(s,x,y,col||COL.tx,14,'center','700');};
  u.chip=(s,x,y,col)=>{c.font='700 13px Inter,system-ui,sans-serif';const w=c.measureText(s).width+16;u.rect(x-w/2,y-12,w,24,'rgba(15,23,42,.85)',col||COL.cy,8,1.5);u.text(s,x,y,col||COL.cy,13);};
  u.rnd=(i)=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  u.sym=(k)=>VARS[k]?VARS[k][0]:k;
  u.fv=(P,k,d)=>{const v=u.g(P,k,d);return u.sym(k)+' = '+u.f(v)+' '+(VARS[k]?VARS[k][1]:'');};
  u.graph=(x,y,w,h,fn,t0,t1,ymin,ymax,col,cursor,label)=>{u.rect(x,y,w,h,'rgba(8,13,25,.8)','#334155',8,1);
    const mid=y+h*(ymax/(ymax-ymin));if(ymin<0)u.line(x,mid,x+w,mid,'#334155',1,[4,4]);
    c.beginPath();for(let i=0;i<=120;i++){const tt=t0+(t1-t0)*i/120;const px=x+w*i/120,py=y+h*(1-(fn(tt)-ymin)/(ymax-ymin));i?c.lineTo(px,py):c.moveTo(px,py);}
    c.strokeStyle=col||COL.cy;c.lineWidth=2;c.stroke();
    if(cursor!==undefined){const cx=x+w*(cursor-t0)/(t1-t0),cy=y+h*(1-(fn(cursor)-ymin)/(ymax-ymin));u.circ(cx,cy,5,col||COL.cy);u.line(cx,y,cx,y+h,'rgba(255,255,255,.15)',1);}
    if(label)u.text(label,x+8,y+12,COL.mu,11,'left');};
  return u;
}
class Engine{
  constructor(canvas){this.cv=canvas;this.ctx=canvas.getContext('2d');this.u=makeUtils(this.ctx);this.name=null;this.P={};this.t=0;this.speed=1;this.playing=true;this.last=0;this.dpr=1;
    this.resize=this.resize.bind(this);this.loop=this.loop.bind(this);
    if(window.ResizeObserver)new ResizeObserver(this.resize).observe(canvas.parentElement||canvas);
    window.addEventListener('resize',this.resize);this.resize();requestAnimationFrame(this.loop);}
  resize(){const r=(this.cv.parentElement||this.cv).getBoundingClientRect();const w=Math.max(280,r.width),h=Math.max(220,r.height);this.dpr=Math.min(2,window.devicePixelRatio||1);
    this.cv.width=w*this.dpr;this.cv.height=h*this.dpr;this.cv.style.width=w+'px';this.cv.style.height=h+'px';this.W=w;this.H=h;}
  set(name,P){this.name=name;this.P=P||{};this.t=0;}
  restart(){this.t=0;this.playing=true;}
  toggle(){this.playing=!this.playing;return this.playing;}
  loop(ts){const dt=this.last?Math.min(.05,(ts-this.last)/1000):0;this.last=ts;if(this.playing)this.t+=dt*this.speed;this.draw();requestAnimationFrame(this.loop);}
  draw(){const c=this.ctx,u=this.u,W=this.W,H=this.H;c.setTransform(this.dpr,0,0,this.dpr,0,0);u.bg(W,H);
    const fn=window.ANIM[this.name]||window.ANIM.generic;
    try{c.save();fn(u,W,H,this.t,this.P);c.restore();u.noglow();}catch(e){c.restore();u.text('anim error: '+e.message,W/2,H/2,'#fb7185',13);}}
}
window.AnimEngine=Engine; window.makeUtils=makeUtils; window.ACOL=COL;
})();
