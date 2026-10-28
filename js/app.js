/* PhysLab Solver — UI */
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const S={topic:'auto',rows:[],finds:[],consts:{},res:null,step:0,live:false};
try{const l=localStorage.getItem('physlab_lang');if(l==='ru'||l==='uz')window.LANG=l;}catch(e){}
const L=()=>window.LANG;
const nm=o=>o[L()]||o.uz;                       // name in current language
const vn=k=>VARS[k]?(L()==='ru'?VARS[k][3]:VARS[k][2]):(CONSTS[k]?CONSTS[k][L()]:k);
const vs=k=>VARS[k]?VARS[k][0]:(CONSTS[k]?CONSTS[k].sym:k);
const vu=k=>VARS[k]?VARS[k][1]:(CONSTS[k]?CONSTS[k].unit:'');
/* ---------- topic variable sets ---------- */
const TV={};
TOPICS.forEach(tp=>TV[tp.id]=new Set());
FORMULAS.forEach(f=>{const s=TV[f.topic];for(const k in f.solve){s.add(k);Solver.compile(f.solve[k]).ids.forEach(i=>{if(VARS[i])s.add(i);});}});
const topicOf=id=>TOPICS.find(x=>x.id===id);
/* ---------- units ---------- */
const CYR={'м':'m','с':'s','кг':'kg','г':'g','см':'cm','мм':'mm','км':'km','мин':'min','ч':'h','Н':'N','Дж':'J','Вт':'W','Па':'Pa','А':'A','В':'V','Ом':'Ω','Кл':'C','Ф':'F','Гн':'H','Гц':'Hz','К':'K','Тл':'T','кН':'kN','кДж':'kJ','кВт':'kW','л':'l','мс':'ms'};
const ohm=u=>u.replace(/ohm|Om/i,'Ω');
function unitList(key){return UNITS[vu(key)]||[[vu(key),1]];}
function findUnit(key,lab){if(!lab)return null;lab=CYR[lab]||ohm(lab);const L_=unitList(key);return L_.find(u=>u[0]===lab)||L_.find(u=>u[0].toLowerCase()===lab.toLowerCase())||null;}
function toSI(key,val,ul){const u=findUnit(key,ul)||unitList(key)[0];return val*u[1]+(u[2]||0);}
function fromSI(key,x,ul){const u=findUnit(key,ul)||unitList(key)[0];return (x-(u[2]||0))/u[1];}
/* ---------- alias parsing ---------- */
const SUB={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','ₙ':'n','ᵢ':'i'};
const GR={'υ':'v','ν':'nu','ρ':'rho','η':'eta','μ':'mu','ω':'omega','α':'alpha','β':'beta','γ':'gam','λ':'lam','φ':'phi','ε':'eps','ℰ':'emf','Δ':'d','τ':'tau','Φ':'Phi','Γ':'K','θ':'tm','π':'pi','Ω':'Om','‘':'','’':'','′':'',"'":'','_':'',' ':'','⟨':'','⟩':''};
const norm=s=>[...s].map(c=>SUB[c]||(GR[c]!==undefined?GR[c]:c)).join('');
const SYMIDX={};Object.keys(VARS).forEach(k=>{const n=norm(VARS[k][0]);(SYMIDX[n]=SYMIDX[n]||[]).push(k);(SYMIDX[k]=SYMIDX[k]||[]);if(!SYMIDX[k].includes(k))SYMIDX[k].push(k);});
const SYMLOW={};Object.keys(SYMIDX).forEach(n=>{const l=n.toLowerCase();(SYMLOW[l]=SYMLOW[l]||[]).push(...SYMIDX[n]);});
const TOPIC_ALIAS={t10_osc:{v:'vmax',a:'amax',A:'Am',w:'omega',x:'x'},t11_quant:{c:'cl'},t10_proj:{L:'Lr',H:'hmax',h:'hmax',a:'alpha'}};
const CONST_ALIAS={pi:'pi','π':'pi',g:'g',G:'G',hP:'hP',Rg:'Rg',cl:'cl',eps0:'eps0',kB:'kB',bW:'bW',me:'me',mp:'mp',mn:'mn'};
function resolve(tok,topic){
  const tv=topic!=='auto'?TV[topic]:null;
  if(topic!=='auto'&&TOPIC_ALIAS[topic]&&TOPIC_ALIAS[topic][tok])return {key:TOPIC_ALIAS[topic][tok]};
  let c=SYMIDX[norm(tok)]||[];if(!c.length)c=SYMLOW[norm(tok).toLowerCase()]||[];
  c=[...new Set(c)];
  if(tv){const inT=c.filter(k=>tv.has(k));if(inT.length)return {key:inT[0]};}
  if(c.length&&!(tok in CONST_ALIAS))return {key:c[0]};
  if(CONST_ALIAS[tok]||CONST_ALIAS[norm(tok)])return {con:CONST_ALIAS[tok]||CONST_ALIAS[norm(tok)]};
  if(tok==='c'&&CONSTS.cl)return {con:'cl'};
  if(c.length)return {key:c[0]};
  return null;
}
const NUM=/^([-+]?\d*[.,]?\d+(?:[eE][-+]?\d+)?)(?:[·*×x]10\^?\(?([-+]?\d+)\)?)?(.*)$/;
function parseNum(s){const m=NUM.exec(s.replace(/\s/g,''));if(!m)return null;let v=parseFloat(m[1].replace(',','.'));if(m[2])v*=Math.pow(10,+m[2]);return {v,unit:(m[3]||'').replace(/\.$/,'')};}
function parseText(txt,topic){
  const out={given:[],finds:[],consts:{},unknown:[],topic};
  let s=txt.replace(/\s*=\s*/g,'=').replace(/\s*-\s*\?/g,'?').replace(/\s*=\s*\?/g,'?').replace(/,\s+/g,' ').replace(/[;\n]/g,' ').replace(/\s*:\s*/g,': ').trim();
  const toks=s.split(/\s+/).filter(Boolean);
  const raw=[];let findMode=false;
  for(let i=0;i<toks.length;i++){let tk=toks[i];
    if(/^(topish:?|найти:?|find:?|nayti:?)$/i.test(tk)){findMode=true;continue;}
    if(/^[^=]+\?$/.test(tk)){raw.push({t:'f',s:tk.replace(/\?$/,'')});continue;}
    const m=/^([^=]+)=(.+)$/.exec(tk);
    if(m){let num=m[2];const p0=parseNum(num);if(!p0){raw.push({t:'?',s:tk});continue;}
      let unit=p0.unit;if(!unit&&toks[i+1]&&!/=|\?$/.test(toks[i+1])&&/^[^\d=]/.test(toks[i+1])&&toks[i+1].length<=8&&!/^(topish|найти|find|nayti)/i.test(toks[i+1])){
        const guess=toks[i+1];if(isUnitLike(guess)){unit=guess;i++;}}
      raw.push({t:'g',s:m[1],v:p0.v,u:unit});continue;}
    if(findMode)raw.push({t:'f',s:tk});else raw.push({t:'?',s:tk});
  }
  // auto topic
  let tp=topic;
  if(tp==='auto'){let best=null,bs=-1;TOPICS.forEach(t=>{let sc=0;raw.forEach(r=>{if(r.t==='?')return;const c=SYMIDX[norm(r.s)]||SYMLOW[norm(r.s).toLowerCase()]||[];if(c.some(k=>TV[t.id].has(k)))sc++;else if(TOPIC_ALIAS[t.id]&&TOPIC_ALIAS[t.id][r.s])sc+=1.2;});
      // bonus when the find variable is directly solvable in this topic
      if(sc>bs){bs=sc;best=t.id;}});tp=best;}
  out.topic=tp;
  raw.forEach(r=>{if(r.t==='?'){out.unknown.push(r.s);return;}
    const rs=resolve(r.s,tp);if(!rs){out.unknown.push(r.s);return;}
    if(r.t==='f'){if(rs.key)out.finds.push(rs.key);else if(rs.con)out.finds.push(rs.con);return;}
    if(rs.con){out.consts[rs.con]=r.v;return;}
    out.given.push({key:rs.key,val:r.v,unit:(findUnit(rs.key,r.u)?findUnit(rs.key,r.u)[0]:unitList(rs.key)[0][0])});});
  return out;
}
const ALLU=new Set();Object.values(UNITS).forEach(a=>a.forEach(u=>ALLU.add(u[0].toLowerCase())));Object.keys(CYR).forEach(k=>ALLU.add(k.toLowerCase()));ALLU.add('ohm');
const isUnitLike=g=>ALLU.has(g.toLowerCase().replace(/\.$/,''));
/* ---------- defaults for templates ---------- */
const DV={alpha:30,phi0:0,mu:.3,n1:1,n2:1.5,n21:1.5,n:1.5,eps:2,ifr:3,Zp:6,An:12,Nneu:6,N1:100,N2:50,Ncnt:10,kt:2,Mmol:.032,Tk:300,Tk1:300,Tk2:450,TH:500,TC:300,rho:1000,lamm:5e-7,rhol:1000,eta:75,Wf:60,Wt:80,Fo:.1,d:.25,f:.2,m:2,
  Am:.05,omega:1.5,T:4,t:5,N0:800,Thalf:10,Nn:100,nu:6e14,Eph:4e-19,Aw:4e-19,En1:-2.18e-18,En2:-5.45e-19,q:.001,q1:2e-6,q2:-3e-6,r:.3,emf:12,rin:1,ke:3.3e-7,lamd:.1,B:.5,lp:1,ks:100,dl:.1,g:10,
  rhoe:1.7e-8,lw:10,S:1e-6,Rr:6,R1:10,R2:20,U:12,I:2,v:10,v0:5,vsq:250000,m0:5e-26,nc:2.4e25,p:1e5,p1:1e5,p2:2e5,V:.002,V1:.002,V2:.001,Q:1000,cs:4200,cs1:4200,cs2:900,t1:20,t2:80,tm:30,
  dt:60,lam0:5e-7,lam:2,Thalf_:10,qf:4.4e7,lamf:3.4e5,Lv:2.3e6,Mnuc:1.99e-26,dm:1e-28,Ebond:9e-12,Ekr:1e-14,v1:3e8*.6,v2:3e8*.0,Lind:.001,C:1e-6,Vb:.001,h:2,hmax:5,s:50,x:.02,
  d1:1,d2:2,F1:20,F2:10,W:100,Np:50,F:20,a:2,P:50,Pe:24,tau0:1,l0:1,m0r:1e-27,mr:2e-27,Famp:1,FL:1e-14,Phi:.01,dPhi:.1,dtt:2,dI:1,N:5,t_:5};
function defVal(key,topic){const T11=topic&&topic.startsWith('t11');
  if(key==='lam')return T11?5e-7:2;if(key==='nu'&&T11)return 1e15;if(key==='v'&&T11)return 1.8e8;if(key==='v1'&&T11)return 1.5e8;if(key==='v2'&&T11)return 1.5e8;if(key==='nu'&&topic==='t10_osc')return 2;if(key==='T'&&topic==='t11_emw')return 2e-5;
  if(key==='v1'&&topic==='t9_optics')return 3e8;if(key==='v2'&&topic==='t9_optics')return 2e8;if(key==='v'&&topic==='t9_optics')return 2e8;
  if(key in DV)return DV[key];const u=vu(key);const UD={'m':2,'s':4,'kg':2,'m/s':10,'N':20,'J':100,'W':100,'Pa':1e5,'m²':.01,'m³':.002,'A':2,'V':12,'Ω':6,'C':.001,'F':1e-6,'H':.001,'Hz':2,'K':300,'°C':20,'J/kg':3e5,'J/(kg·K)':4200,'°':30,'%':60,'m/s²':2,'T':.5,'kg/m³':1000};return UD[u]!==undefined?UD[u]:2;}
/* ---------- rendering helpers ---------- */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const fmt=Solver.fmt;
function fmtHtml(x){return esc(fmt(x)).replace(/·10\^(-?\d+)/g,'·10<sup>$1</sup>');}
function pretty(expr){expr=expr.replace(/rad\(([^()]*)\)/g,'$1').replace(/deg\(/g,'(').replace(/\b([A-Za-z_]\w*)\*\1\b/g,'$1^2');return expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g,id=>{if(id==='sqrt')return '√';if(['abs','sin','cos','asin','acos','exp','ln','log2','rad','deg'].includes(id))return id==='rad'||id==='deg'?'':id;return vs(id);}).replace(/\*/g,'·').replace(/\^2/g,'²').replace(/\^3/g,'³').replace(/\(\(([^()]*)\)\)/g,'($1)');}
const RUU={m:'м',s:'с',kg:'кг',N:'Н',J:'Дж',W:'Вт',Pa:'Па',A:'А',V:'В',C:'Кл',F:'Ф',H:'Гн',Hz:'Гц',K:'К',T:'Тл',mol:'моль',dpt:'дптр',Wb:'Вб',rad:'рад'};
const uu=x=>L()==='ru'?String(x).replace(/[A-Za-z]+/g,w=>RUU[w]||w):x;
function varOptions(topic,sel){const keys=topic==='auto'?Object.keys(VARS):[...TV[topic]].sort((a,b)=>Object.keys(VARS).indexOf(a)-Object.keys(VARS).indexOf(b));
  const sorted=keys.filter(k=>VARS[k]);return '<option value="">'+esc(t('choose'))+'</option>'+sorted.map(k=>`<option value="${k}"${k===sel?' selected':''}>${esc(VARS[k][0])} — ${esc(vn(k))}</option>`).join('');}
/* ---------- input panel ---------- */
function renderTopics(){const el=$('#topic');let h=`<option value="auto">${esc(t('topicAuto'))}</option>`;[6,7,8,9,10,11].forEach(g=>{h+=`<optgroup label="${g}${t('grade')}">`+TOPICS.filter(x=>x.g===g).map(x=>`<option value="${x.id}">${esc(nm(x))}</option>`).join('')+'</optgroup>';});el.innerHTML=h;el.value=S.topic;}
function renderRows(){const el=$('#givenRows');el.innerHTML=S.rows.map((r,i)=>{const ul=r.key?unitList(r.key):[['',1]];
  return `<div class="row" data-i="${i}"><select class="k">${varOptions(S.topic,r.key)}</select><input class="v" type="number" step="any" value="${r.val===''?'':r.val}" placeholder="${esc(t('value'))}"><select class="u">${ul.map(u=>`<option${u[0]===r.unit?' selected':''}>${esc(u[0])}</option>`).join('')}</select><button class="x" title="×">✕</button></div>`;}).join('');
  $$('#givenRows .row').forEach(row=>{const i=+row.dataset.i;
    row.querySelector('.k').onchange=e=>{S.rows[i].key=e.target.value;S.rows[i].unit=e.target.value?unitList(e.target.value)[0][0]:'';renderRows();};
    row.querySelector('.v').oninput=e=>{S.rows[i].val=e.target.value===''?'':+e.target.value;liveSolve();};
    row.querySelector('.u').onchange=e=>{S.rows[i].unit=e.target.value;liveSolve();};
    row.querySelector('.x').onclick=()=>{S.rows.splice(i,1);renderRows();liveSolve();};});}
function renderFinds(){$('#findChips').innerHTML=S.finds.map((k,i)=>`<span class="chip">${esc(vs(k))} <small style="color:var(--mu);font-weight:500">${esc(vn(k))}</small><button data-i="${i}">✕</button></span>`).join('');
  $$('#findChips button').forEach(b=>b.onclick=()=>{S.finds.splice(+b.dataset.i,1);renderFinds();liveSolve();});
  const sel=$('#findSel');sel.innerHTML=varOptions(S.topic,'').replace(esc(t('choose')),esc(t('addFind')));sel.value='';}
function renderConsts(){const el=$('#consts');el.innerHTML=Object.keys(CONSTS).map(k=>{const c=CONSTS[k];const v=k in S.consts?S.consts[k]:c.val;return `<div class="crow"><span>${esc(c.sym)}</span><input type="number" step="any" data-k="${k}" value="${v}"><em>${esc(c.unit)}</em></div>`;}).join('');
  $$('#consts input').forEach(inp=>inp.oninput=()=>{const v=parseFloat(inp.value);if(isFinite(v))S.consts[inp.dataset.k]=v;else delete S.consts[inp.dataset.k];liveSolve();});}
function renderExamples(){const ex=[['t10_osc','A=0,05 m; T=4 s; pi=3; topish: v a'],['t6_motion','s=120 m; t=8 s; v-?'],['t7_kin','v0=0; a=2 m/s²; t=5 s; s-? v-?'],['t7_circ','R=0,5 m; T=2 s; pi=3,14; v-? an-?'],['t10_proj','v0=20 m/s; alpha=30; hmax-? Lr-? tk-?'],
  ['t8_ohm','U=12 V; R=4 Ω; I-? P-?'],['t8_heat','m=2 kg; c=4200; t1=20; t2=80; Q-?'],['t8_series','R1=10 Ω; R2=20 Ω; U=60 V; I-? U1-? U2-?'],['t8_parallel','R1=10; R2=15; U=30; Rp-? I-?'],['t7_dyn','m=5 kg; mu=0,2; g=10; F-?'],['t7_fluid','rho=1000; h=2 m; g=10; p-?'],
  ['t10_cons','m1=2; v1=4; m2=1; v2=0; u1-?'],['t10_mkn','p1=1e5 Pa; V1=2 l; V2=1 l; p2-?'],['t10_osc','l=1 m; g=9,8; pi=3,14; T-?'],['t9_optics','alpha=45; n21=1,5; beta-?'],['t6_lens','d=0,25 m; f=0,2 m; Fo-?'],['t11_quant','lam=500 nm; E-? p-?'],['t11_nuc','N0=800; T=10 s; t=30 s; N-?'],['t11_rel','m0=1e-27; v=1,8e8; m-?']];
  $('#examples').innerHTML=`<option value="">${esc(t('pickExample'))}</option>`+ex.map((e,i)=>`<option value="${i}">${esc(nm(topicOf(e[0])))} — ${esc(e[1])}</option>`).join('');$('#examples').onchange=ev=>{if(ev.target.value==='')return;const e=ex[+ev.target.value];S.topic=e[0];renderTopics();$('#quick').value=e[1];applyParse();ev.target.value='';};}
function applyParse(){const r=parseText($('#quick').value,S.topic);if(S.topic==='auto'&&r.topic){S.topic=r.topic;$('#topic').value=r.topic;}
  S.rows=r.given.map(g=>({key:g.key,val:g.val,unit:g.unit}));S.finds=[...new Set(r.finds)];Object.keys(r.consts).forEach(k=>S.consts[k]=r.consts[k]);
  renderRows();renderFinds();renderConsts();$('#warns').textContent=r.unknown.length?t('warnUnknown')+': '+r.unknown.join(', '):'';solve(true);}
/* ---------- solving ---------- */
function collect(){const given={};S.rows.forEach(r=>{if(r.key&&r.val!==''&&isFinite(r.val))given[r.key]=toSI(r.key,+r.val,r.unit);});return given;}
function solve(setLive){
  const given=collect();const cons={};Object.keys(S.consts).forEach(k=>cons[k]=S.consts[k]);
  S.live=true;
  if(!S.finds.length){S.res=null;renderSolution();return;}
  const res=Solver.solve(given,S.finds,{topic:S.topic==='auto'?null:S.topic,consts:cons});res.given=given;S.res=res;const n=(res.steps||[]).length;if(n!==S.lastN||S.step>=n)S.step=Math.max(0,n-1);S.lastN=n;renderSolution();}
let lt=null;function liveSolve(){if(!S.live)return;clearTimeout(lt);lt=setTimeout(()=>solve(),120);}
function suggest(res,given){
  const gk=new Set([...Object.keys(given),...Object.keys(CONSTS)]);const out=[];
  S.finds.filter(f=>res.missing.includes(f)).forEach(fk=>{let best=null;
    FORMULAS.forEach(f=>{if(!f.solve[fk])return;const need=Solver.compile(f.solve[fk]).ids.filter(i=>!(i in res.known));const sc=need.length+(S.topic!=='auto'&&f.topic!==S.topic?.5:0);if(!best||sc<best.sc)best={f,need,sc};});
    out.push({fk,best});});return out;}
function renderSolution(){const el=$('#solution');const res=S.res;
  if(!res){el.innerHTML=`<div class="panel empty"><h2>${esc(t('emptyTitle'))}</h2><p>${esc(t('emptyText'))}</p></div>`;if(!S.finds.length)setAnim(null,{});return;}
  if(!res.ok){const sg=suggest(res,res.given);
    el.innerHTML=`<div class="err"><b>${esc(t('notEnough'))}</b><ul>`+sg.map(s=>s.best?`<li>${esc(vs(s.fk))} (${esc(vn(s.fk))}): <b>${esc(nm(s.best.f))}</b> — <span class="math">${esc(s.best.f.eq)}</span><br>${esc(t('needMore'))}: ${s.best.need.map(n=>`<b>${esc(vs(n))}</b> (${esc(vn(n))})`).join(', ')}</li>`:`<li>${esc(vs(s.fk))}: ${esc(t('noFormula'))}</li>`).join('')+'</ul></div>';
    // still animate the nearest formula with known values
    const f0=sg.find(s=>s.best);setAnim(f0?f0.best.f:null,res.known);return;}
  const kv=S.rows.filter(r=>r.key&&r.val!=='').map(r=>{const si=res.given[r.key];const conv=Math.abs(si-r.val)>1e-12*Math.max(1,Math.abs(si))||(r.unit!==vu(r.key));return `<span>${esc(vs(r.key))} = ${fmtHtml(+r.val)} ${esc(uu(r.unit))}${conv?` <small>→ ${fmtHtml(si)} ${esc(uu(vu(r.key)))}</small>`:''}</span>`;}).join('');
  const consUsed=[];res.steps.forEach(st=>st.inputs.forEach(i=>{if(CONSTS[i]&&!(i in res.given)&&!consUsed.includes(i))consUsed.push(i);}));
  const ckv=consUsed.map(k=>`<span>${esc(CONSTS[k].sym)} = ${fmtHtml(res.consts[k])} <small>${esc(uu(CONSTS[k].unit))}</small></span>`).join('');
  let h='<div class="panel sol">';
  h+=`<div class="box"><h4>${esc(t('dado'))}</h4><div class="kv">${kv}${ckv}</div></div>`;
  h+=`<div class="box"><h4>${esc(t('toFind'))}</h4><div class="kv">${S.finds.map(k=>`<span class="tf">${esc(vs(k))} — ${esc(vn(k))}</span>`).join('')}</div></div>`;
  h+=`<div class="box"><h4>${esc(t('steps'))}</h4><div style="display:flex;flex-direction:column;gap:10px">`;
  res.steps.forEach((st,i)=>{const k=st.key;h+=`<div class="step${i===S.step?' on':''}" data-i="${i}"><div class="h"><b>${L()==='ru'?'Шаг '+(i+1):(i+1)+'-qadam'}: ${esc(nm(st.formula))}</b><span>${esc(vn(k))}</span></div>
    <div class="math m">${esc(st.formula.eq)}</div>
    <div class="note">${esc(t('express'))}:</div><div class="math">${esc(vs(k))} = ${esc(pretty(st.expr))}</div>
    <div class="note">${esc(t('substitute'))}:</div><div class="math s">${esc(vs(k))} = ${esc(st.subst)}</div>
    <div class="math r">${esc(vs(k))} = ${fmtHtml(st.value)} ${esc(uu(vu(k)))}</div></div>`;});
  h+='</div></div>';
  h+=`<div class="ans"><h4 style="margin:0 0 6px;color:var(--li);font-size:12px;letter-spacing:1px;text-transform:uppercase">${esc(t('answer'))}</h4>`+res.results.map((r,i)=>`<div class="line"><span>${esc(vs(r.key))} =</span><span class="av" data-i="${i}">${fmtHtml(r.value)}</span>${unitList(r.key).length>1||vu(r.key)?`<select data-i="${i}">${unitList(r.key).map(u=>`<option value="${esc(u[0])}">${esc(uu(u[0]))}</option>`).join('')}</select>`:''}<small class="note">${esc(vn(r.key))}</small></div>`).join('')+'</div></div>';
  el.innerHTML=h;
  $$('#solution .step').forEach(d=>d.onclick=()=>{S.step=+d.dataset.i;$$('#solution .step').forEach(x=>x.classList.toggle('on',x===d));setAnim(res.steps[S.step].formula,res.known);});
  $$('#solution .ans select').forEach(sel=>sel.onchange=()=>{const i=+sel.dataset.i;const r=res.results[i];$$('#solution .av')[i].innerHTML=fmtHtml(fromSI(r.key,r.value,sel.value));});
  $$('#solution .ans select').forEach(sel=>{const r=res.results[+sel.dataset.i];const first=unitList(r.key)[0][0];sel.value=first;});
  const stp=res.steps[S.step]||res.steps[res.steps.length-1];setAnim(stp?stp.formula:null,res.known);
}
/* ---------- stage ---------- */
let eng=null,curAnim=null;
function setAnim(f,params){if(!eng)return;const name=f?f.anim:null;$('#stName').textContent=f?nm(f):t('stage');$('#stEq').textContent=f?f.eq:'';
  const P=Object.assign({},params||{});eng.name=name;eng.P=P;if(curAnim!==name){eng.t=0;curAnim=name;}}
function renderStage(){$('#bPlay').textContent=(eng&&!eng.playing)?'▶ '+t('play'):'⏸ '+t('pause');$('#bRestart').textContent='↺ '+t('restart');$('#lSpeed').textContent=t('speed');}
/* ---------- library ---------- */
function renderLib(){const q=$('#fsearch').value.trim().toLowerCase(),gr=$('#fgrade').value;let h='';let cnt=0;
  TOPICS.forEach(tp=>{if(gr&&String(tp.g)!==gr)return;const fs=FORMULAS.filter(f=>f.topic===tp.id&&(!q||(nm(f)+' '+f.eq+' '+nm(tp)).toLowerCase().includes(q)));if(!fs.length)return;cnt+=fs.length;
    h+=`<div class="tcard"><h2>${esc(nm(tp))}<small>${tp.g}${esc(t('grade'))}</small></h2><div class="fgrid">`+fs.map(f=>`<div class="fc" data-id="${f.id}"><div class="n">${esc(nm(f))}</div><div class="e">${esc(f.eq)}</div><div class="go">▶ ${esc(t('open'))}</div></div>`).join('')+'</div></div>';});
  $('#flib').innerHTML=h||`<div class="empty">—</div>`;$$('#flib .fc').forEach(c=>c.onclick=()=>openFormula(c.dataset.id));}
function openFormula(id){const f=FORMULAS.find(x=>x.id===id);if(!f)return;S.topic=f.topic;const targets=Object.keys(f.solve);const tgt=targets[0];
  const ids=[...new Set(Solver.compile(f.solve[tgt]).ids.filter(i=>VARS[i]))];
  S.rows=ids.map(k=>({key:k,val:defVal(k,f.topic),unit:unitList(k)[0][0]}));S.finds=[tgt];S.step=0;$('#quick').value='';renderTopics();renderRows();renderFinds();renderConsts();showView('solver');solve();window.scrollTo({top:0,behavior:'smooth'});}
function renderGrades(){$('#fgrade').innerHTML=`<option value="">${esc(t('allGrades'))}</option>`+[6,7,8,9,10,11].map(g=>`<option value="${g}">${g}${esc(t('grade'))}</option>`).join('');$('#fsearch').placeholder=t('searchFormula');}
function renderHelp(){$('#view-help').innerHTML=`<div class="panel"><h2 style="margin-top:0">${esc(t('helpTitle'))}</h2><p>${esc(t('help1'))}</p><p>${esc(t('help2'))}</p><p><code>A=0,05 m; T=4 s; pi=3; topish: v a</code> &nbsp; <code>m=2 kg; v=3 m/s; Ek-?</code> &nbsp; <code>lam=500 nm; E-?</code></p><p>${esc(t('help3'))}</p><p>${esc(t('help4'))}</p><p class="note">${FORMULAS.length} ${esc(t('formulasCount'))} · ${TOPICS.length} ${L()==='ru'?'тем':'mavzu'} · ${new Set(FORMULAS.map(f=>f.anim)).size} ${L()==='ru'?'анимаций':'animatsiya'}</p></div>`;}
function showView(v){$$('.view').forEach(x=>x.classList.toggle('on',x.id==='view-'+v));$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));}
/* ---------- i18n apply ---------- */
function applyLang(){document.documentElement.lang=L();$$('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===L()));
  $('#appSub').textContent=t('appSub');$('#tabSolve').textContent=t('tabSolve');if($('#tabAI'))$('#tabAI').textContent=t('tabAI');$('#tabLib').textContent=t('tabLib');$('#tabHelp').textContent=t('tabHelp');
  $('#lTopic').textContent=t('topic');$('#lQuick').textContent=t('quick');$('#quick').placeholder=t('quickHint');$('#bParse').textContent=t('parse');$('#hGiven').textContent=t('given');$('#bAddGiven').textContent=t('addGiven');$('#hFind').textContent=t('find');$('#hConsts').textContent=t('consts');
  $('#bSolve').textContent=t('solve');$('#bClear').textContent=t('clear');$('#liveNote').textContent=t('live');$('#footer').textContent=t('footer');
  renderTopics();renderRows();renderFinds();renderConsts();renderExamples();renderGrades();renderLib();renderHelp();renderStage();renderSolution();}
/* ---------- init ---------- */
function init(){
  eng=new AnimEngine($('#cv'));
  $$('nav button').forEach(b=>b.onclick=()=>showView(b.dataset.v));
  $$('.lang button').forEach(b=>b.onclick=()=>{window.LANG=b.dataset.l;try{localStorage.setItem('physlab_lang',window.LANG);}catch(e){}applyLang();});
  $('#topic').onchange=e=>{S.topic=e.target.value;renderRows();renderFinds();liveSolve();};
  $('#bAddGiven').onclick=()=>{S.rows.push({key:'',val:'',unit:''});renderRows();};
  $('#findSel').onchange=e=>{const k=e.target.value;if(k&&!S.finds.includes(k)){S.finds.push(k);renderFinds();liveSolve();}e.target.value='';};
  $('#bParse').onclick=applyParse;
  $('#bSolve').onclick=()=>{if($('#quick').value.trim()&&!S.rows.length&&!S.finds.length)applyParse();else solve();};
  $('#quick').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();applyParse();}});
  $('#bClear').onclick=()=>{S.rows=[];S.finds=[];S.res=null;S.live=false;$('#quick').value='';$('#warns').textContent='';renderRows();renderFinds();renderSolution();};
  $('#bPlay').onclick=()=>{eng.toggle();renderStage();};$('#bRestart').onclick=()=>{eng.restart();renderStage();};$('#speed').oninput=e=>{eng.speed=+e.target.value;};
  $('#fsearch').oninput=renderLib;$('#fgrade').onchange=renderLib;
  applyLang();
  // initial example: user's problem
  S.topic='t10_osc';$('#quick').value='A=0,05 m; T=4 s; pi=3; topish: v a';renderTopics();applyParse();
}
window.PhysLabApp={openTopic:id=>{if(!TOPICS.find(x=>x.id===id))return;S.topic=id;renderTopics();renderRows();renderFinds();showView('solver');}};
document.addEventListener('DOMContentLoaded',init);
})();
