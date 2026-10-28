/* Plan — AI qaytargan «yechim rejasi» ni tekshiradi (normalize), hisoblaydi (run) va
   animatsiya sahnasini (scene) tekshiradi. Brauzer va Node da bir xil kod ishlaydi:
   server ham, brauzer ham AYNAN SHU kod bilan tekshiradi. */
(function(root){
'use strict';
const SE=root.SafeExpr||(typeof require!=='undefined'?require('./safeexpr.js'):null);
const RESERVED=new Set([...Object.keys(SE.FUNCS),'ts','val']);
const COLORS=new Set(['cy','mg','li','am','vi','rd','bl','tx','mu']);
const col=(v,d)=>{if(typeof v!=='string')return d;v=v.trim();return(COLORS.has(v)||/^#[0-9a-fA-F]{3,8}$/.test(v))?v:d;};
const str=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max||200):'';
const idOk=s=>typeof s==='string'&&/^[A-Za-z_][A-Za-z0-9_]{0,23}$/.test(s)&&!RESERVED.has(s);
const fin=x=>typeof x==='number'&&isFinite(x);
const SPEC={
  dot:{req:['x','y'],num:['x','y','r'],col:['color'],txt:['label']},
  box:{req:['x','y'],num:['x','y','w','h','angle'],col:['color'],txt:['label']},
  line:{req:['x1','y1','x2','y2'],num:['x1','y1','x2','y2','width'],col:['color'],flag:['dash']},
  arrow:{req:['x','y','dx','dy'],num:['x','y','dx','dy','width'],col:['color'],txt:['label']},
  text:{req:['x','y','text'],num:['x','y','size'],col:['color'],tpl:['text'],txt:['align']},
  hud:{req:['sx','sy','text'],num:['sx','sy','size'],col:['color'],tpl:['text']},
  trail:{req:['x','y'],num:['x','y','width'],col:['color']},
  ground:{req:['y'],num:['y','x0','x1'],col:['color']},
  ruler:{req:['y','x0','x1','step'],num:['y','x0','x1','step'],col:['color'],txt:['unit']},
  circle:{req:['x','y','r'],num:['x','y','r','width'],col:['stroke','fill']},
  rect:{req:['x','y','w','h'],num:['x','y','w','h'],col:['stroke','fill']},
  poly:{req:['pts'],num:[],col:['stroke','fill']},
  zigzag:{req:['x1','y1','x2','y2'],num:['x1','y1','x2','y2','coils','amp','width'],col:['color']}
};
function parseTemplate(s){const parts=[];let last=0;const re=/\{([^{}|]+)(?:\|(\d))?\}/g;let m;
  while((m=re.exec(s))){if(m.index>last)parts.push(s.slice(last,m.index));parts.push({e:m[1].trim(),d:m[2]===undefined?null:+m[2]});last=m.index+m[0].length;}
  if(last<s.length)parts.push(s.slice(last));return parts;}
function fmtNum(x,d){if(!isFinite(x))return '—';if(d!==null&&d!==undefined)return x.toFixed(d);if(x===0)return '0';const a=Math.abs(x);
  if(a>=1e6||a<1e-3){let[m,e]=x.toExponential(3).split('e');m=m.replace(/\.?0+$/,'');return m+'·10^'+(+e);}return parseFloat(x.toPrecision(5)).toString();}
function renderTemplate(parts,scope){let o='';for(const p of parts){if(typeof p==='string')o+=p;else{let v=NaN;try{v=SE.evaluate(p.e,scope);}catch(e){}o+=fmtNum(v,p.d);}}return o;}

/* ---------- normalize ---------- */
function normalize(raw,opts){
  opts=opts||{};const E=[],SEr=[];
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('JSON obyekt emas');
  const plan={title:str(raw.title,140),topic:str(raw.topic,40)||null,topicName:str(raw.topicName,140),statement:str(raw.statement,3000),notes:str(raw.notes,600),
    given:[],steps:[],answers:[],anim:null};
  const known=new Set();
  const chkExpr=(src,allowed,where,errs)=>{
    if(typeof src==='number'){if(!fin(src))errs.push(where+': son cheksiz');return src;}
    if(typeof src!=='string'||!src.trim()){errs.push(where+': ifoda bo‘sh');return null;}
    try{const ids=SE.compile(src).ids;for(const i of ids){if(i==='pi')continue;if(!allowed.has(i)){errs.push(where+': «'+i+'» noma’lum (avval e’lon qilinmagan)');return null;}}return src.trim();}
    catch(e){errs.push(where+': '+e.message+' («'+String(src).slice(0,60)+'»)');return null;}};
  if(!Array.isArray(raw.given))E.push('given massiv emas');
  (Array.isArray(raw.given)?raw.given:[]).slice(0,30).forEach((g,i)=>{const w='given['+i+']';
    if(!g||!idOk(g.id)){E.push(w+': id noto‘g‘ri (lotin harf/raqam/_ , zahiralangan nom emas)');return;}
    if(known.has(g.id)){E.push(w+': id takror: '+g.id);return;}
    const value=typeof g.value==='string'?parseFloat(g.value.replace(',','.')):g.value;
    if(!fin(value)){E.push(w+': value son emas');return;}
    const si=chkExpr(g.si===undefined||g.si===null||g.si===''?value:g.si,known,w+'.si',E);if(si===null)return;
    plan.given.push({id:g.id,sym:str(g.sym,24)||g.id,name:str(g.name,100),value,unit:str(g.unit,24),si:String(si),siUnit:str(g.siUnit,24),assumed:!!g.assumed,note:str(g.note,200)});known.add(g.id);});
  if(!Array.isArray(raw.steps)||!raw.steps.length)E.push('steps bo‘sh');
  (Array.isArray(raw.steps)?raw.steps:[]).slice(0,25).forEach((s,i)=>{const w='steps['+i+']';
    if(!s||!idOk(s.id)){E.push(w+': id noto‘g‘ri');return;}
    if(known.has(s.id)){E.push(w+': id takror yoki given bilan to‘qnashadi: '+s.id);return;}
    const ex=chkExpr(s.expr,known,w+'.expr',E);if(ex===null)return;
    const claim=typeof s.value==='string'?parseFloat(s.value):s.value;
    plan.steps.push({id:s.id,title:str(s.title,140),explain:str(s.explain,500),eq:str(s.eq,200),sym:str(s.sym,24)||s.id,name:str(s.name,100),unit:str(s.unit,24),expr:ex,claim:fin(claim)?claim:null});known.add(s.id);});
  if(!Array.isArray(raw.answers)||!raw.answers.length)E.push('answers bo‘sh');
  (Array.isArray(raw.answers)?raw.answers:[]).slice(0,12).forEach((a,i)=>{const w='answers['+i+']';
    if(!a||typeof a.id!=='string'||!known.has(a.id)){E.push(w+': id given/steps ichida yo‘q: '+(a&&a.id));return;}
    let show=null;if(a.show!==undefined&&a.show!==null&&a.show!==''){const al=new Set([...known,'val']);show=chkExpr(a.show,al,w+'.show',E);}
    plan.answers.push({id:a.id,sym:str(a.sym,24)||a.id,name:str(a.name,100),unit:str(a.unit,24),show});});
  // anim
  const an=raw.anim;
  if(an&&typeof an==='object'){
    if(an.kind==='lib'){
      const names=opts.animNames||(root.ANIM?new Set(Object.keys(root.ANIM)):null);const name=str(an.name,40);
      if(!/^[a-z0-9_]+$/.test(name)||(names&&!names.has(name)))SEr.push('anim.name noma’lum: '+name);
      else{const params=[];(Array.isArray(an.params)?an.params:[]).slice(0,30).forEach((p,i)=>{if(!p||!/^[A-Za-z0-9_]{1,12}$/.test(p.k||''))return;
        const v=chkExpr(p.v,known,'anim.params['+i+']',SEr);if(v!==null)params.push({k:p.k,v});});
        if(!SEr.length)plan.anim={kind:'lib',name,params};}
    }else if(an.kind==='scene'&&an.scene){const sc=normScene(an.scene,known,SEr);if(sc)plan.anim={kind:'scene',scene:sc};}
  }
  return {plan,errors:E,sceneErrors:SEr};
}
function normScene(sc,known,errs){
  if(!sc||typeof sc!=='object'){errs.push('scene obyekt emas');return null;}
  const stat=new Set(known),dyn=new Set([...known,'ts']);if(!known.has('t'))dyn.add('t');
  const ne=(v,al,w,optional)=>{if(v===undefined||v===null){return null;}
    if(typeof v==='number')return fin(v)?v:(errs.push(w+': son cheksiz'),null);
    if(typeof v!=='string'){errs.push(w+': son yoki ifoda bo‘lishi kerak');return null;}
    try{const ids=SE.compile(v).ids;for(const i of ids){if(i==='pi')continue;if(!al.has(i)){errs.push(w+': «'+i+'» noma’lum');return null;}}return v.trim();}
    catch(e){errs.push(w+': '+e.message+' («'+v.slice(0,50)+'»)');return null;}};
  const out={duration:ne(sc.duration,stat,'scene.duration'),playSeconds:fin(sc.playSeconds)?Math.min(20,Math.max(4,sc.playSeconds)):9,equal:!!sc.equal,view:null,objects:[],graphs:[],captions:[]};
  if(out.duration===null){errs.push('scene.duration yo‘q');return null;}
  const v=sc.view||{};const view={};for(const k of['x0','x1','y0','y1']){view[k]=ne(v[k],stat,'scene.view.'+k);if(view[k]===null){errs.push('scene.view.'+k+' yo‘q');return null;}}out.view=view;
  (Array.isArray(sc.objects)?sc.objects:[]).slice(0,70).forEach((o,i)=>{if(!o||!SPEC[o.type])return;const sp=SPEC[o.type],w='objects['+i+']('+o.type+')';const c={type:o.type};let bad=false;
    for(const f of sp.num){if(o[f]===undefined||o[f]===null)continue;const r=ne(o[f],dyn,w+'.'+f);if(r===null)bad=true;else c[f]=r;}
    for(const f of sp.req){if(f==='pts'||(sp.tpl&&sp.tpl.includes(f)))continue;if(c[f]===undefined){errs.push(w+': «'+f+'» maydoni yo‘q');bad=true;}}
    for(const f of(sp.col||[]))c[f]=col(o[f],f==='fill'?null:undefined);
    for(const f of(sp.txt||[]))if(typeof o[f]==='string')c[f]=str(o[f],60);
    for(const f of(sp.flag||[]))c[f]=!!o[f];
    for(const f of(sp.tpl||[])){const s=str(o[f],160);if(!s){errs.push(w+': «'+f+'» bo‘sh');bad=true;continue;}const parts=parseTemplate(s);
      for(const p of parts){if(typeof p==='string')continue;const r=ne(p.e,dyn,w+'.'+f+' {'+p.e+'}');if(r===null)bad=true;}c[f]=parts;}
    if(o.type==='poly'){const pts=[];(Array.isArray(o.pts)?o.pts:[]).slice(0,24).forEach((p,j)=>{if(!Array.isArray(p)||p.length<2)return;const a=ne(p[0],dyn,w+'.pts['+j+'][0]'),b=ne(p[1],dyn,w+'.pts['+j+'][1]');if(a===null||b===null)bad=true;else pts.push([a,b]);});
      if(pts.length<3){errs.push(w+': pts kamida 3 nuqta');bad=true;}c.pts=pts;}
    if(o.from!==undefined){const r=ne(o.from,dyn,w+'.from');if(r!==null)c.from=r;}if(o.to!==undefined){const r=ne(o.to,dyn,w+'.to');if(r!==null)c.to=r;}
    if(!bad)out.objects.push(c);});
  if(!out.objects.length){errs.push('scene.objects bo‘sh yoki yaroqsiz');return null;}
  (Array.isArray(sc.graphs)?sc.graphs:[]).slice(0,3).forEach((g,i)=>{if(!g||!Array.isArray(g.series))return;const w='graphs['+i+']';const series=[];
    g.series.slice(0,4).forEach((s,j)=>{const y=ne(s&&s.y,dyn,w+'.series['+j+'].y');if(y!==null)series.push({y,color:col(s.color,'cy'),label:str(s.label,30)});});
    if(series.length)out.graphs.push({title:str(g.title,50),xlabel:str(g.xlabel,20)||'t, s',ylabel:str(g.ylabel,24),series});});
  (Array.isArray(sc.captions)?sc.captions:[]).slice(0,14).forEach((c,i)=>{if(!c||typeof c.text!=='string')return;const f=ne(c.from,stat,'captions['+i+'].from'),t=ne(c.to,stat,'captions['+i+'].to');
    if(f!==null&&t!==null)out.captions.push({from:f,to:t,text:str(c.text,160)});});
  return out;
}

/* ---------- run ---------- */
function run(plan){
  const scope=Object.create(null);scope.pi=Math.PI;const warnings=[],errors=[];
  const given=plan.given.map(g=>{let si=NaN;try{si=SE.evaluate(g.si,scope);}catch(e){}if(!fin(si))errors.push('«'+g.id+'» SI qiymati hisoblanmadi');scope[g.id]=si;return Object.assign({},g,{siValue:si});});
  const steps=plan.steps.map(s=>{let v=NaN;try{v=SE.evaluate(s.expr,scope);}catch(e){}
    if(!fin(v))errors.push('«'+s.id+'» = '+s.expr+' hisoblanmadi');
    else if(s.claim!==null&&Math.abs(v-s.claim)>0.03*Math.max(Math.abs(v),Math.abs(s.claim))+1e-12)warnings.push('«'+s.sym+'»: AI '+fmtNum(s.claim)+' degan, dastur '+fmtNum(v)+' hisobladi — dastur natijasi ishlatildi');
    scope[s.id]=v;return Object.assign({},s,{value:v});});
  const answers=plan.answers.map(a=>{const si=scope[a.id];let shown=si;
    if(a.show){const sc2=Object.assign(Object.create(null),scope);sc2.val=si;try{shown=SE.evaluate(a.show,sc2);}catch(e){shown=NaN;}}
    return Object.assign({},a,{si,shown});});
  return {scope,given,steps,answers,warnings,errors};
}
/* animatsiya ifodalarini bir necha vaqt nuqtasida sinab ko‘radi (NaN bo‘lsa — xato) */
function checkScene(plan,r){
  const out=[];if(!plan.anim)return out;const sc0=Object.create(null);Object.assign(sc0,r.scope);if(!('t' in sc0))sc0.t=0;
  const test=(src,sc,w)=>{if(typeof src==='number')return;let v;try{v=SE.evaluate(src,sc);}catch(e){v=NaN;}if(!fin(v))out.push(w+': «'+src+'» ts='+fmtNum(sc.ts)+' da hisoblanmadi');};
  if(plan.anim.kind==='lib'){plan.anim.params.forEach(p=>test(p.v,sc0,'anim.params.'+p.k));return out;}
  const s=plan.anim.scene;let D;try{D=SE.evaluate(s.duration,sc0);}catch(e){D=NaN;}
  if(!fin(D)||D<=0){out.push('scene.duration musbat son emas ('+fmtNum(D)+')');return out;}
  for(const k of['x0','x1','y0','y1'])test(s.view[k],sc0,'view.'+k);
  const x0=SE.evaluate(s.view.x0,sc0),x1=SE.evaluate(s.view.x1,sc0),y0=SE.evaluate(s.view.y0,sc0),y1=SE.evaluate(s.view.y1,sc0);
  if(!(x1>x0)||!(y1>y0))out.push('view: x1>x0 va y1>y0 bo‘lishi kerak');
  for(const f of[0,0.5,1]){const sc=Object.assign(Object.create(null),sc0);sc.ts=D*f;if(!('t' in r.scope))sc.t=sc.ts;
    s.objects.forEach((o,i)=>{const w='objects['+i+'] '+o.type;for(const k of Object.keys(o)){const v=o[k];if(k==='type'||k==='from'||k==='to')continue;
      const sp=SPEC[o.type];if((sp.col||[]).includes(k)||(sp.txt||[]).includes(k))continue;
      if(typeof v==='string')test(v,sc,w+'.'+k);
      else if(typeof v==='number')continue;else if(Array.isArray(v)){if(k==='pts')v.forEach((p,j)=>{test(p[0],sc,w+'.pts'+j);test(p[1],sc,w+'.pts'+j);});else v.forEach(p=>{if(typeof p!=='string'&&p&&p.e)test(p.e,sc,w+'.'+k);});}}});
    s.graphs.forEach((g,i)=>g.series.forEach((se,j)=>test(se.y,sc,'graphs['+i+'].series['+j+']')));}
  return out.slice(0,12);
}
const api={normalize,run,checkScene,parseTemplate,renderTemplate,fmtNum,COLORS};
root.Plan=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
