/* AI sahna (scene) animatsiyasi: AI tasvirlagan jarayonni universal tarzda chizadi.
   Barcha ifodalar SafeExpr orqali hisoblanadi (kod bajarilmaydi). */
(function(){
const SE=window.SafeExpr;
const PAL=['cy','mg','li','am','vi','rd','bl'];
const cc=c=>c?(window.ACOL[c]||c):null;
const cfn=v=>typeof v==='number'?(()=>v):SE.compile(v).fn;
const PREP=new WeakMap();
function prep(scene,base){
  let p=PREP.get(scene);if(p&&p.base===base)return p;
  const b=Object.create(null);Object.assign(b,base);if(!('t' in base))b.t=0;
  const D=cfn(scene.duration)(b);
  const V={};for(const k of['x0','x1','y0','y1'])V[k]=cfn(scene.view[k])(b);
  const objs=scene.objects.map(o=>{const c={type:o.type,raw:o};
    for(const k in o){if(k==='type')continue;const v=o[k];
      if(k==='pts')c.pts=v.map(q=>[cfn(q[0]),cfn(q[1])]);
      else if(k==='text'&&Array.isArray(v))c.tpl=v.map(x=>typeof x==='string'?x:{f:cfn(x.e),d:x.d});
      else if(typeof v==='number'||(typeof v==='string'&&!(['color','stroke','fill','label','align','unit'].includes(k))))c[k]=cfn(v);
      else c[k]=v;}
    return c;});
  const graphs=scene.graphs.map(g=>{const N=90;const sc=Object.create(null);Object.assign(sc,b);let lo=Infinity,hi=-Infinity;
    const series=g.series.map(s=>{const f=cfn(s.y);const ys=[];for(let i=0;i<=N;i++){sc.ts=D*i/N;if(!('t' in base))sc.t=sc.ts;const y=f(sc);ys.push(y);if(isFinite(y)){lo=Math.min(lo,y);hi=Math.max(hi,y);}}return {ys,color:s.color,label:s.label,f};});
    if(!isFinite(lo)){lo=0;hi=1;}if(lo>0&&lo<(hi-lo)*0.6)lo=0;if(hi<0&&-hi<(hi-lo)*0.6)hi=0;if(hi-lo<1e-9){hi=lo+1;}const pad=(hi-lo)*.08;
    return {g,series,lo:lo-(lo===0?0:pad),hi:hi+pad};});
  const caps=scene.captions.map(c=>({f:cfn(c.from)(b),t:cfn(c.to)(b),text:c.text}));
  p={base,D,V,objs,graphs,caps,aliasT:!('t' in base)};PREP.set(scene,p);return p;
}
function drawGraph(u,c,G,x,y,w,h,ts,D,idx){
  u.rect(x,y,w,h,'rgba(8,13,25,.85)','#334155',8,1);
  const L=x+38,R=x+w-10,T=y+22,B=y+h-22,pw=R-L,ph=B-T,span=G.hi-G.lo;
  const X=tt=>L+pw*tt/D,Y=v=>B-ph*(v-G.lo)/span;
  u.text(G.g.title||'',x+w/2,y+11,u.col.tx,11,'center','700');
  if(G.lo<0&&G.hi>0)u.line(L,Y(0),R,Y(0),'#475569',1,[4,4]);
  u.line(L,T,L,B,'#475569',1);u.line(L,B,R,B,'#475569',1);
  u.text(Solver.fmt(G.hi),L-4,T,u.col.mu,10,'right');u.text(Solver.fmt(G.lo),L-4,B,u.col.mu,10,'right');
  u.text('0',L,B+10,u.col.mu,10);u.text(Solver.fmt(D),R,B+10,u.col.mu,10);u.text(G.g.xlabel,(L+R)/2,B+11,u.col.mu,10);
  if(G.g.ylabel)u.text(G.g.ylabel,x+4,y+11,u.col.mu,10,'left');
  G.series.forEach((s,i)=>{const col=cc(s.color)||cc(PAL[i%PAL.length]);c.beginPath();let st=false;
    s.ys.forEach((v,k)=>{if(!isFinite(v)){st=false;return;}const px=X(D*k/(s.ys.length-1)),py=Y(v);st?c.lineTo(px,py):c.moveTo(px,py);st=true;});
    c.strokeStyle=col;c.lineWidth=2;c.stroke();
    const k=ts/D*(s.ys.length-1),i0=Math.floor(k),i1=Math.min(s.ys.length-1,i0+1),v=s.ys[i0]+(s.ys[i1]-s.ys[i0])*(k-i0);
    if(isFinite(v)){u.circ(X(ts),Y(v),4.5,col);}
    if(s.label)u.text(s.label+(isFinite(v)?' = '+Solver.fmt(v):''),L+6+(i%2)*pw*.5,T+9+Math.floor(i/2)*12,col,10,'left','700');});
  u.line(X(ts),T,X(ts),B,'rgba(255,255,255,.18)',1);
}
window.ANIM.ai_scene=(u,W,H,t,P)=>{
  const c=u.c;const run=P&&P.scope,scene=P&&P.scene;
  if(!scene||!run){u.text('…',W/2,H/2,u.col.mu,16);return;}
  const pr=prep(scene,run);const D=pr.D;
  if(!(D>0)){u.text('duration xato',W/2,H/2,u.col.rd,14);return;}
  const play=scene.playSeconds,cyc=play+1.2,ph=t%cyc,frac=Math.min(1,ph/play),ts=frac*D;
  if(P.onFrame)P.onFrame(frac,ts);
  const S=Object.create(null);Object.assign(S,run);S.ts=ts;if(pr.aliasT)S.t=ts;
  // layout
  const hasG=pr.graphs.length>0;let sx0=0,sy0=0,sw=W,sh=H,gx=0,gy=0,gw=0,gh=0,horiz=false;
  if(hasG){if(W>=640){sw=Math.round(W*.62);gx=sw+6;gy=8;gw=W-gx-8;gh=H-16;}else{sh=Math.round(H*.56);gx=8;gy=sh+4;gw=W-16;gh=H-sh-10;horiz=true;}}
  const ML=34,MR=34,MT=46,MB=44;const pw=sw-ML-MR,ph2=sh-MT-MB;const {x0,x1,y0,y1}=pr.V;
  let kx=pw/(x1-x0),ky=ph2/(y1-y0),offx=0,offy=0;
  if(scene.equal){const k=Math.min(kx,ky);offx=(pw-(x1-x0)*k)/2;offy=(ph2-(y1-y0)*k)/2;kx=ky=k;}
  const X=x=>sx0+ML+offx+(x-x0)*kx,Y=y=>sy0+MT+ph2-offy-(y-y0)*ky;
  c.save();c.beginPath();c.rect(sx0,sy0,sw,sh);c.clip();
  let errs=0,ci=0;
  for(const o of pr.objs){
    try{
      const fr=o.from?o.from(S):0,to=o.to?o.to(S):Infinity;if(ts<fr-1e-9||ts>to+1e-9)continue;
      const col=cc(o.color)||cc(PAL[(ci++)%PAL.length]);
      switch(o.type){
        case 'dot':{const x=X(o.x(S)),y=Y(o.y(S)),r=o.r?o.r(S):7;u.glow(col,10);u.circ(x,y,r,col);u.noglow();if(o.label)u.text(o.label,x,y-r-9,col,12);break;}
        case 'box':{const x=X(o.x(S)),y=Y(o.y(S)),w=o.w?o.w(S):44,h=o.h?o.h(S):24,a=o.angle?-o.angle(S)*Math.PI/180:0;c.save();c.translate(x,y);c.rotate(a);u.rect(-w/2,-h/2,w,h,col,null,5);c.restore();
          if(o.label)u.text(o.label,x,y-h/2-10,col,12);break;}
        case 'line':{u.line(X(o.x1(S)),Y(o.y1(S)),X(o.x2(S)),Y(o.y2(S)),col,o.width?o.width(S):2,o.dash?[6,5]:null);break;}
        case 'arrow':{const x=X(o.x(S)),y=Y(o.y(S));u.arrow(x,y,x+o.dx(S),y-o.dy(S),col,o.width?o.width(S):3);if(o.label)u.text(o.label,x+o.dx(S)/2,y-o.dy(S)/2-12,col,12);break;}
        case 'text':{const s=o.tpl.map(p=>typeof p==='string'?p:Plan.fmtNum(p.f(S),p.d)).join('');u.text(s,X(o.x(S)),Y(o.y(S)),col,o.size?o.size(S):14,o.align==='left'||o.align==='right'?o.align:'center','700');break;}
        case 'hud':{const s=o.tpl.map(p=>typeof p==='string'?p:Plan.fmtNum(p.f(S),p.d)).join('');const hx=sx0+o.sx(S)*sw,hy=sy0+o.sy(S)*sh;u.text(s,hx,hy,col,o.size?o.size(S):13,o.sx(S)>.7?'right':(o.sx(S)<.3?'left':'center'),'700');break;}
        case 'trail':{const sv=S.ts;c.beginPath();const n=Math.max(2,Math.round(70*frac)+2);for(let i=0;i<=n;i++){S.ts=ts*i/n;if(pr.aliasT)S.t=S.ts;const x=X(o.x(S)),y=Y(o.y(S));i?c.lineTo(x,y):c.moveTo(x,y);}
          S.ts=sv;if(pr.aliasT)S.t=sv;c.strokeStyle=col;c.lineWidth=o.width?o.width(S):2;c.globalAlpha=.6;c.stroke();c.globalAlpha=1;break;}
        case 'ground':{const y=Y(o.y(S)),a=o.x0?X(o.x0(S)):sx0,b=o.x1?X(o.x1(S)):sx0+sw;u.line(a,y,b,y,col||'#64748b',3);c.strokeStyle='rgba(148,163,184,.35)';c.lineWidth=1;c.beginPath();for(let x=a;x<b;x+=14){c.moveTo(x,y);c.lineTo(x-8,y+9);}c.stroke();break;}
        case 'ruler':{const y=Y(o.y(S)),a=o.x0(S),b=o.x1(S),st=o.step(S);if(!(st>0)||(b-a)/st>40)break;u.line(X(a),y,X(b),y,'#64748b',2);
          for(let v=a;v<=b+st*1e-6;v+=st){const x=X(v);u.line(x,y-4,x,y+4,'#94a3b8',1.5);u.text(Solver.fmt(v),x,y+16,u.col.mu,10);}if(o.unit)u.text(o.unit,X(b)+14,y+16,u.col.mu,10,'left');break;}
        case 'circle':{const x=X(o.x(S)),y=Y(o.y(S)),r=o.r(S)*Math.min(kx,ky);c.beginPath();c.arc(x,y,Math.max(0,r),0,6.2832);if(o.fill){c.globalAlpha=.2;c.fillStyle=cc(o.fill);c.fill();c.globalAlpha=1;}
          c.strokeStyle=cc(o.stroke)||col;c.lineWidth=o.width?o.width(S):2;c.stroke();break;}
        case 'rect':{const x=X(o.x(S)),y=Y(o.y(S)),w=o.w(S)*kx,h=o.h(S)*ky;c.beginPath();c.rect(x,y-h,w,h);if(o.fill){c.globalAlpha=.25;c.fillStyle=cc(o.fill);c.fill();c.globalAlpha=1;}c.strokeStyle=cc(o.stroke)||col;c.lineWidth=2;c.stroke();break;}
        case 'poly':{c.beginPath();o.pts.forEach((q,i)=>{const x=X(q[0](S)),y=Y(q[1](S));i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();if(o.fill){c.globalAlpha=.25;c.fillStyle=cc(o.fill);c.fill();c.globalAlpha=1;}c.strokeStyle=cc(o.stroke)||col;c.lineWidth=2;c.stroke();break;}
        case 'zigzag':{const ax=X(o.x1(S)),ay=Y(o.y1(S)),bx=X(o.x2(S)),by=Y(o.y2(S)),L=Math.hypot(bx-ax,by-ay);if(L<4)break;const n=Math.max(2,Math.round(o.coils?o.coils(S):8)),amp=o.amp?o.amp(S):8,ux=(bx-ax)/L,uy=(by-ay)/L,nx=-uy,ny=ux;
          c.beginPath();c.moveTo(ax,ay);const lead=Math.min(14,L*.12);c.lineTo(ax+ux*lead,ay+uy*lead);for(let i=0;i<n*2;i++){const f=lead+(L-2*lead)*(i+.5)/(n*2),sg=i%2?1:-1;c.lineTo(ax+ux*f+nx*amp*sg,ay+uy*f+ny*amp*sg);}c.lineTo(bx-ux*lead,by-uy*lead);c.lineTo(bx,by);c.strokeStyle=col;c.lineWidth=o.width?o.width(S):2;c.stroke();break;}
      }
    }catch(e){errs++;}
  }
  // captions + time chip
  let cap=null;for(const k of pr.caps)if(ts>=k.f-1e-9&&ts<=k.t+1e-9)cap=k;
  if(cap)u.chip(cap.text,sx0+sw/2,sy0+sh-18,u.col.am);
  u.chip('t = '+Solver.fmt(ts)+' s',sx0+sw-52,sy0+16,u.col.cy);
  if(errs)u.text('⚠ '+errs+' obyekt chizilmadi',sx0+10,sy0+sh-8,u.col.rd,10,'left');
  c.restore();
  if(hasG){const n=pr.graphs.length;pr.graphs.forEach((G,i)=>{if(horiz){const w=(gw-(n-1)*6)/n;drawGraph(u,c,G,gx+i*(w+6),gy,w,gh,ts,D,i);}else{const h=(gh-(n-1)*6)/n;drawGraph(u,c,G,gx,gy+i*(h+6),gw,h,ts,D,i);}});}
};
})();
(function(){
window.ANIM.ai_idle=(u,W,H,t,P)=>{u.text(u.tr('Masalani yuklang yoki yozing — animatsiya shu yerda chiqadi','Загрузите или введите задачу — анимация появится здесь'),W/2,H/2,u.col.mu,15);
  const k=(t*.6)%1;u.circ(W/2-60+120*k,H/2+40,6,u.col.cy);u.line(W/2-60,H/2+40,W/2+60,H/2+40,'#334155',2);};
window.ANIM.ai_none=(u,W,H,t,P)=>{u.text(u.tr('Bu masala uchun animatsiya yaratilmadi','Для этой задачи анимация не создана'),W/2,H/2-10,u.col.mu,15);
  if(P&&P.msg)u.text(String(P.msg).slice(0,100),W/2,H/2+16,u.col.rd,11);};
})();
