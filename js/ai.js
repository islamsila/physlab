/* AI yechuvchi: PDF / rasm / matn -> /api/solve -> tekshirilgan yechim + animatsiya */
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const L=()=>window.LANG||'uz';
const D={
uz:{drop:'Bu yerga tashlang, tanlang yoki Ctrl+V bilan rasm qo‘ying',pick:'Fayl tanlash',text:'Masala matni (xatolarni tuzatishingiz mumkin)',textPh:'Masalani shu yerga yozing yoki yuqorida PDF/rasm yuklang…',book:'Kitob javobi (ixtiyoriy — tekshirish uchun)',bookPh:'masalan: t=10 s; S1=55 m',
 page:'PDF sahifasi rasmini ham yuborish (belgilar/formulalar o‘qilmasa)',solve:'✨ AI bilan yechish',solving:'AI yechmoqda… (10–40 soniya)',resolve:'↻ Qayta yechish (yangi so‘rov)',quota:'Bugun ishlatildi',search:'Masalani qidirish…',problems:'ta masala topildi',none:'Bu PDF dan masalalar ajratilmadi. Matnni qo‘lda kiriting yoki sahifa rasmini yuklang.',
 pdfLoading:'PDF o‘qilmoqda…',given:'Berilgan',find:'Topish kerak',steps:'Yechish bosqichlari',step:'-qadam',subst:'Qiymat qo‘yamiz',answer:'Javob',assumed:'taxmin',topic:'Mavzu',topicBtn:'Shu mavzu formulalari →',statement:'Masala',
 bookOk:'✓ Kitob javobiga mos',bookPart:'~ Kitob javobiga qisman mos',bookBad:'⚠ Kitob javobiga mos kelmadi — masala matnini tekshiring',bookIs:'Kitob javobi',cached:'Saqlangan natija (so‘rov sarflanmadi)',
 ai:'Yechimni AI tuzdi, hisoblarni dastur tekshirdi. Baribir natijani o‘zingiz ham tekshiring.',play:'Davom',pause:'Pauza',restart:'Qayta',speed:'Tezlik',empty:'Masala yuklang',emptyT:'Chapdan PDF, rasm yoki matn kiriting — AI mavzuni aniqlaydi, yechadi va animatsiya yaratadi.',
 stage:'Animatsiya',tooShort:'Masala matni juda qisqa.',pdfErr:'PDF ni o‘qib bo‘lmadi',aiOff:'AI hozircha o‘chirilgan.',noanim:'Animatsiya yaratilmadi',no:'№',sec:'bo‘lim',page_:'sahifa'},
ru:{drop:'Перетащите сюда, выберите или вставьте изображение Ctrl+V',pick:'Выбрать файл',text:'Текст задачи (можно исправить ошибки)',textPh:'Введите задачу или загрузите PDF/изображение выше…',book:'Ответ из книги (необязательно — для проверки)',bookPh:'например: t=10 с; S1=55 м',
 page:'Отправить и изображение страницы PDF (если символы/формулы не читаются)',solve:'✨ Решить с ИИ',solving:'ИИ решает… (10–40 секунд)',resolve:'↻ Решить заново (новый запрос)',quota:'Сегодня использовано',search:'Поиск задачи…',problems:'задач найдено',none:'Из этого PDF не удалось выделить задачи. Введите текст вручную или загрузите изображение страницы.',
 pdfLoading:'Чтение PDF…',given:'Дано',find:'Найти',steps:'Ход решения',step:'-й шаг',subst:'Подставляем значения',answer:'Ответ',assumed:'допущение',topic:'Тема',topicBtn:'Формулы этой темы →',statement:'Задача',
 bookOk:'✓ Совпадает с ответом из книги',bookPart:'~ Частично совпадает с ответом из книги',bookBad:'⚠ Не совпало с ответом из книги — проверьте текст задачи',bookIs:'Ответ из книги',cached:'Сохранённый результат (запрос не потрачен)',
 ai:'Решение составил ИИ, вычисления проверила программа. Всё равно перепроверьте результат.',play:'Пуск',pause:'Пауза',restart:'Заново',speed:'Скорость',empty:'Загрузите задачу',emptyT:'Слева введите PDF, изображение или текст — ИИ определит тему, решит и создаст анимацию.',
 stage:'Анимация',tooShort:'Текст задачи слишком короткий.',pdfErr:'Не удалось прочитать PDF',aiOff:'ИИ временно отключён.',noanim:'Анимация не создана',no:'№',sec:'раздел',page_:'стр.'}};
const d=k=>(D[L()]||D.uz)[k];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtH=x=>esc(Plan.fmtNum(x)).replace(/·10\^(-?\d+)/g,'·10<sup>$1</sup>');
const st={pdfDoc:null,pdfName:'',problems:[],sel:null,image:null,plan:null,run:null,busy:false,animErr:null,step:0,meta:{}};
let eng=null,scrubbing=false;

/* ---------- PDF ---------- */
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('pdf.js yuklanmadi'));document.head.appendChild(s);});}
async function pdfLib(){if(window.pdfjsLib)return window.pdfjsLib;await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';return window.pdfjsLib;}
async function pageLines(page){
  const tc=await page.getTextContent();const rows=[];
  tc.items.forEach(it=>{if(it.str===undefined)return;const y=it.transform[5],x=it.transform[4];let r=rows.find(r=>Math.abs(r.y-y)<2.5);if(!r){r={y,its:[]};rows.push(r);}r.its.push({x,s:it.str,w:it.width||0});});
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>{r.its.sort((a,b)=>a.x-b.x);let s='',px=null;r.its.forEach(i=>{if(px!==null&&i.x-px>1.5)s+=' ';s+=i.s;px=i.x+i.w;});return s.replace(/[\uE000-\uF8FF\uFFFD]/g,'').replace(/\s+/g,' ').trim();}).filter(l=>l&&!/^\d{1,3}$/.test(l));
}
function splitProblems(pages){
  const out=[];let sec='',secTitle='',cur=null,expect=null,needTitle=false;
  const SEC=/^([A-ZА-Я]\s?\d{1,2})$/,START=/^(\d{1,3})\s*[.)]\s*(.*)$/,CAPS=ln=>ln===ln.toUpperCase()&&/[A-ZА-ЯЎҚҒҲ]{4,}/.test(ln);
  const close=()=>{if(!cur)return;let t=cur.lines.reduce((a,l)=>a?(/-$/.test(a)&&/^[a-zа-яўқғҳ]/.test(l)?a.slice(0,-1)+l:a+' '+l):l,'').trim();
    let ans='';const m=/\s(?:J|Javob|Ответ|Ans)\s*[:.]\s*/.exec(' '+t);if(m){const i=m.index+m[0].length-1;ans=t.slice(i).trim();t=t.slice(0,Math.max(0,m.index-1+1)).trim();}
    out.push({id:out.length,no:cur.no,sec:cur.sec,secTitle:cur.secTitle,page:cur.page,text:t,ans});cur=null;};
  for(const pg of pages)for(const ln of pg.lines){
    let m=SEC.exec(ln);
    if(m){close();sec=m[1].replace(/\s/g,'');secTitle='';expect=null;needTitle=true;continue;}
    if(CAPS(ln)&&!START.test(ln)){close();continue;}
    if(needTitle&&!(START.test(ln)&&!/^\d/.test(START.exec(ln)[2]))){if(/^\(\s*\d+\s*(soat|час)/i.test(ln))continue;secTitle=ln;needTitle=false;continue;}
    m=START.exec(ln);
    if(m){const n=+m[1],dig=/^\d/.test(m[2]);if(expect===null?!dig:(n===expect||(n===1&&!dig))){needTitle=false;close();cur={no:n,sec,secTitle,page:pg.n,lines:[m[2]||'']};expect=n+1;continue;}}
    if(cur)cur.lines.push(ln);
  }
  close();return out.filter(p=>p.text.length>12);
}
async function openPdf(file){
  msg(d('pdfLoading'),'note');
  try{
    const lib=await pdfLib();const buf=await file.arrayBuffer();const doc=await lib.getDocument({data:buf}).promise;
    const pages=[];for(let i=1;i<=doc.numPages;i++){pages.push({n:i,lines:await pageLines(await doc.getPage(i))});}
    st.pdfDoc=doc;st.pdfName=file.name;st.problems=splitProblems(pages);st.sel=null;
    $('#pdfBox').hidden=false;$('#pdfName').textContent='📄 '+file.name+' · '+doc.numPages+' bet';renderProblems();$('#aiPageWrap').hidden=false;msg('');
    if(!st.problems.length){msg(d('none'),'warn');const all=pages.flatMap(p=>p.lines).join('\n');$('#aiText').value=all.slice(0,3000);}
  }catch(e){msg(d('pdfErr')+': '+e.message,'warn');}
}
function renderProblems(){
  const q=$('#pdfSearch').value.trim().toLowerCase();let h='',last='',cnt=0;
  st.problems.forEach(p=>{if(q&&!(p.text+' '+p.sec+p.secTitle).toLowerCase().includes(q))return;cnt++;
    if(p.sec!==last){last=p.sec;h+='<div class="psec">'+esc((p.sec||'—')+(p.secTitle?' · '+p.secTitle:''))+'</div>';}
    h+='<div class="pit'+(st.sel&&st.sel.id===p.id?' on':'')+'" data-i="'+p.id+'"><b>'+p.no+'.</b> '+esc(p.text.slice(0,110))+(p.text.length>110?'…':'')+(p.ans?' <i title="'+esc(p.ans)+'">J</i>':'')+'</div>';});
  $('#pdfList').innerHTML=h||'<div class="note" style="padding:8px">—</div>';
  $('#pdfSearch').placeholder=st.problems.length+' '+d('problems')+' · '+d('search');
  $$('#pdfList .pit').forEach(el=>el.onclick=()=>pickProblem(+el.dataset.i));
}
function pickProblem(i){const p=st.problems.find(x=>x.id===i);if(!p)return;st.sel=p;$('#aiText').value=p.text;$('#aiBook').value=p.ans;clearImage();
  st.hint=(p.sec?p.sec+(p.secTitle?' ('+p.secTitle+')':'')+', ':'')+'problem no. '+p.no+', PDF page '+p.page;renderProblems();$('#aiText').scrollIntoView({block:'nearest',behavior:'smooth'});}
function closePdf(){st.pdfDoc=null;st.problems=[];st.sel=null;st.hint='';$('#pdfBox').hidden=true;$('#aiPageWrap').hidden=true;$('#aiPageImg').checked=false;}
/* ---------- rasm ---------- */
function fileToImage(file){return new Promise((res,rej)=>{const im=new Image(),url=URL.createObjectURL(file);im.onload=()=>{const m=1600;let w=im.width,h=im.height;const k=Math.min(1,m/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,w,h);c.drawImage(im,0,0,w,h);const u=cv.toDataURL('image/jpeg',.85);URL.revokeObjectURL(url);res({mime:'image/jpeg',data:u.split(',')[1],preview:u});};im.onerror=()=>rej(new Error('Rasm o‘qilmadi'));im.src=url;});}
async function setImage(file){try{st.image=await fileToImage(file);$('#aiImg').src=st.image.preview;$('#aiImgBox').hidden=false;st.sel=null;st.hint='';msg('');}catch(e){msg(e.message,'warn');}}
function clearImage(){st.image=null;$('#aiImgBox').hidden=true;}
async function pageImage(n){const page=await st.pdfDoc.getPage(n);let scale=1.6,q=.82;
  for(let i=0;i<4;i++){const vp=page.getViewport({scale});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
    const data=cv.toDataURL('image/jpeg',q).split(',')[1];if(data.length<3.0e6)return {mime:'image/jpeg',data};scale*=.75;q-=.07;}return null;}
async function handleFile(f){if(!f)return;
  if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){clearImage();await openPdf(f);}
  else if(/^image\//.test(f.type)){closePdf();await setImage(f);}
  else{const t=await f.text();closePdf();clearImage();$('#aiText').value=t.slice(0,6000);}}
/* ---------- kesh (kvotani tejash) ---------- */
const CK='physlab_ai_cache_v1';
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);};
function cacheGet(k){try{const o=JSON.parse(localStorage.getItem(CK)||'{}');return o[k]||null;}catch(e){return null;}}
function cacheSet(k,v){try{const o=JSON.parse(localStorage.getItem(CK)||'{}');o[k]={plan:v,ts:Date.now()};const ks=Object.keys(o).sort((a,b)=>o[b].ts-o[a].ts);ks.slice(25).forEach(x=>delete o[x]);localStorage.setItem(CK,JSON.stringify(o));}catch(e){}}
/* ---------- yechish ---------- */
function msg(t,cls){const el=$('#aiMsg');el.textContent=t||'';el.className=cls==='note'?'note':'warn';}
function quotaTxt(){const q=window.PLAuth&&PLAuth.quota;$('#aiQuota').textContent=q?d('quota')+': '+q.used+' / '+q.limit:'';}
async function solve(force){
  if(st.busy)return;const text=$('#aiText').value.trim(),book=$('#aiBook').value.trim();
  if(text.length<8&&!st.image){msg(d('tooShort'),'warn');return;}
  if(window.PLAuth&&PLAuth.aiOn===false){msg(d('aiOff'),'warn');return;}
  const key=hash(text+'|'+book+'|'+(st.image?st.image.data.length:0)+'|'+L());
  if(!force){const c=cacheGet(key);if(c){if(show(c.plan,{cached:true,key,book}))return;}}
  st.busy=true;const btn=$('#aiSolve');btn.disabled=true;msg('');const t0=Date.now();btn.textContent=d('solving');
  const tick=setInterval(()=>{btn.textContent=d('solving').replace(/\(.*\)/,'')+' '+Math.round((Date.now()-t0)/1000)+' s';},500);
  try{
    let image=st.image;if(!image&&$('#aiPageImg').checked&&st.sel&&st.pdfDoc)image=await pageImage(st.sel.page);
    const j=await PLAuth.api('/api/solve',{text,bookAnswer:book,hint:st.hint||'',image:image?{mime:image.mime,data:image.data}:null,lang:L()});
    if(j.quota)PLAuth.setQuota(j.quota);cacheSet(key,j.plan);
    if(!show(j.plan,{animError:j.animError,key,book}))msg('AI javobi o‘qilmadi','warn');
  }catch(e){msg(e.message||'Xato','warn');if(e.data&&e.data.quota)PLAuth.setQuota(e.data.quota);}
  finally{clearInterval(tick);st.busy=false;btn.disabled=false;btn.textContent=d('solve');quotaTxt();}
}
function bookNums(s){const out=[];const t=String(s||'').replace(/,/g,'.');
  for(const m of t.matchAll(/(\d+(?:\.\d+)?)\s*[∙·x*×]\s*10\s*\^?\s*\(?\s*([-−]?\d+)\)?/g))out.push(+m[1]*Math.pow(10,+m[2].replace('−','-')));
  for(const m of t.replace(/(\d+(?:\.\d+)?)\s*[∙·x*×]\s*10\s*\^?\s*\(?\s*[-−]?\d+\)?/g,' ').matchAll(/\d+(?:\.\d+)?/g))out.push(+m[0]);return out;}
function bookCheck(run,book){const bn=bookNums(book);if(!bn.length)return null;let hit=0;
  run.answers.forEach(a=>{const v=a.shown;if(bn.some(b=>Math.abs(v-b)<=0.015*Math.max(Math.abs(b),Math.abs(v))+1e-12))hit++;});
  return hit===run.answers.length?'ok':(hit>0?'part':'bad');}
function show(raw,meta){
  let n;try{n=Plan.normalize(raw,{animNames:new Set(Object.keys(ANIM))});}catch(e){return false;}
  if(n.errors.length)return false;const run=Plan.run(n.plan);if(run.errors.length)return false;
  let animErr=meta.animError||null;if(n.sceneErrors.length){animErr=n.sceneErrors[0];n.plan.anim=null;}
  else{const ce=Plan.checkScene(n.plan,run);if(ce.length){animErr=ce[0];n.plan.anim=null;}}
  st.plan=n.plan;st.run=run;st.animErr=animErr;st.step=0;st.meta=meta;render();startAnim();return true;
}
function subst(expr,scope){return expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g,id=>{if(id in SafeExpr.FUNCS)return id;if(typeof scope[id]==='number'){const v=scope[id];return v<0?'('+Plan.fmtNum(v)+')':Plan.fmtNum(v);}return id==='pi'?'π':id;})
  .replace(/\*/g,'·').replace(/\^2(?!\d)/g,'²').replace(/\^3(?!\d)/g,'³');}
function render(){
  const p=st.plan,r=st.run;if(!p){$('#aiSolution').innerHTML='<div class="panel empty"><h2>'+esc(d('empty'))+'</h2><p>'+esc(d('emptyT'))+'</p></div>';return;}
  let h='<div class="panel sol">';
  h+='<div class="box"><div class="tline"><h3 style="margin:0;color:var(--tx);text-transform:none;letter-spacing:0;font-size:17px">'+esc(p.title||'')+'</h3>'
    +(p.topicName?'<span class="badge">🏷 '+esc(p.topicName)+'</span>':'')+(p.topic&&window.PhysLabApp&&TOPICS.find(x=>x.id===p.topic)?'<button class="btn sm" id="aiTopicBtn">'+esc(d('topicBtn'))+'</button>':'')+'</div>'
    +(p.statement?'<div class="note" style="margin-top:8px">'+esc(p.statement)+'</div>':'')+'</div>';
  h+='<div class="box"><h4>'+esc(d('given'))+'</h4><div class="kv">'+r.given.map(g=>{const conv=g.unit!==g.siUnit||Math.abs(g.siValue-g.value)>1e-12*Math.max(1,Math.abs(g.value));
    return '<span'+(g.assumed?' class="as" title="'+esc(g.note||'')+'"':'')+'>'+esc(g.sym)+' = '+fmtH(g.value)+' '+esc(g.unit)+(conv?' <small>→ '+fmtH(g.siValue)+' '+esc(g.siUnit)+'</small>':'')+(g.assumed?' <small>('+esc(d('assumed'))+')</small>':'')+'</span>';}).join('')+'</div></div>';
  h+='<div class="box"><h4>'+esc(d('find'))+'</h4><div class="kv">'+r.answers.map(a=>'<span class="tf">'+esc(a.sym)+' — '+esc(a.name)+'</span>').join('')+'</div></div>';
  h+='<div class="box"><h4>'+esc(d('steps'))+'</h4><div style="display:flex;flex-direction:column;gap:10px">';
  r.steps.forEach((s,i)=>{h+='<div class="step'+(i===st.step?' on':'')+'" data-i="'+i+'"><div class="h"><b>'+(i+1)+d('step')+': '+esc(s.title)+'</b><span>'+esc(s.name)+'</span></div>'
    +(s.eq?'<div class="math m">'+esc(s.eq)+'</div>':'')+(s.explain?'<div class="note">'+esc(s.explain)+'</div>':'')
    +'<div class="note">'+esc(d('subst'))+':</div><div class="math s">'+esc(s.sym)+' = '+esc(subst(s.expr,r.scope))+'</div>'
    +'<div class="math r">'+esc(s.sym)+' = '+fmtH(s.value)+' '+esc(s.unit)+'</div></div>';});
  h+='</div></div>';
  const bc=bookCheck(r,st.meta.book);
  h+='<div class="ans"><h4 style="margin:0 0 6px;color:var(--li);font-size:12px;letter-spacing:1px;text-transform:uppercase">'+esc(d('answer'))+'</h4>'
    +r.answers.map(a=>'<div class="line"><span>'+esc(a.sym)+' =</span><span class="av">'+fmtH(a.shown)+'</span><span>'+esc(a.unit)+'</span><small class="note">'+esc(a.name)+'</small></div>').join('')
    +(bc?'<div class="bchk '+bc+'">'+esc(d(bc==='ok'?'bookOk':bc==='part'?'bookPart':'bookBad'))+'<small> · '+esc(d('bookIs'))+': '+esc(st.meta.book)+'</small></div>':'')+'</div>';
  const notes=[];if(p.notes)notes.push(p.notes);r.warnings.forEach(w=>notes.push('⚠ '+w));if(st.animErr)notes.push('🎬 '+d('noanim')+': '+st.animErr);if(st.meta.cached)notes.push(d('cached'));notes.push(d('ai'));
  h+='<div class="note aif">'+notes.map(esc).join('<br>')+(st.meta.cached?' <button class="btn sm" id="aiRe">'+esc(d('resolve'))+'</button>':'')+'</div></div>';
  $('#aiSolution').innerHTML=h;
  $$('#aiSolution .step').forEach(el=>el.onclick=()=>{st.step=+el.dataset.i;$$('#aiSolution .step').forEach(x=>x.classList.toggle('on',x===el));head();});
  const tb=$('#aiTopicBtn');if(tb)tb.onclick=()=>window.PhysLabApp.openTopic(p.topic);const re=$('#aiRe');if(re)re.onclick=()=>solve(true);
  head();
}
function head(){const p=st.plan,s=p&&st.run.steps[st.step];$('#aiStName').textContent=p?(p.title||d('stage')):d('stage');$('#aiStEq').textContent=s&&s.eq?s.eq:'';}
function startAnim(){
  const a=st.plan&&st.plan.anim;if(!eng)return;
  if(a&&a.kind==='scene'){eng.name='ai_scene';eng.P={scene:a.scene,scope:st.run.scope,onFrame:(f)=>{if(!scrubbing)$('#aiScrub').value=Math.round(f*1000);}};}
  else if(a&&a.kind==='lib'){const P={};a.params.forEach(q=>{try{P[q.k]=typeof q.v==='number'?q.v:SafeExpr.evaluate(String(q.v),st.run.scope);}catch(e){}});eng.name=a.name;eng.P=P;}
  else if(st.plan){eng.name='ai_none';eng.P={msg:st.animErr};}
  else{eng.name='ai_idle';eng.P={};}
  eng.t=0;eng.playing=true;ctrlTxt();
}
function ctrlTxt(){$('#aiPlay').textContent=(eng&&!eng.playing)?'▶ '+d('play'):'⏸ '+d('pause');$('#aiRestart').textContent='↺ '+d('restart');$('#aiLSpeed').textContent=d('speed');}
function applyLang(){
  $('#aiDropT').textContent=d('drop');$('#aiPick').textContent=d('pick');$('#aiLText').textContent=d('text');$('#aiText').placeholder=d('textPh');$('#aiLBook').textContent=d('book');$('#aiBook').placeholder=d('bookPh');
  $('#aiLPage').textContent=d('page');if(!st.busy)$('#aiSolve').textContent=d('solve');$('#pdfSearch').placeholder=d('search');ctrlTxt();quotaTxt();
  if(st.pdfDoc)renderProblems();render();head();
}
function init(){
  eng=new AnimEngine($('#aiCv'));eng.name='ai_idle';
  const drop=$('#aiDrop');
  $('#aiPick').onclick=()=>$('#aiFile').click();$('#aiFile').onchange=e=>{handleFile(e.target.files[0]);e.target.value='';};
  ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
  drop.addEventListener('drop',e=>handleFile(e.dataTransfer.files[0]));
  document.addEventListener('paste',e=>{if(!$('#view-ai').classList.contains('on'))return;const it=[...(e.clipboardData||{}).items||[]].find(i=>i.type.startsWith('image/'));if(it){e.preventDefault();closePdf();setImage(it.getAsFile());}});
  $('#aiImgX').onclick=clearImage;$('#pdfX').onclick=closePdf;$('#pdfSearch').oninput=renderProblems;
  $('#aiSolve').onclick=()=>solve(false);$('#aiText').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();solve(false);}});
  $('#aiText').addEventListener('input',()=>{st.sel&&$('#aiText').value!==st.sel.text&&0;});
  $('#aiPlay').onclick=()=>{eng.toggle();ctrlTxt();};$('#aiRestart').onclick=()=>{eng.restart();ctrlTxt();};$('#aiSpeed').oninput=e=>{eng.speed=+e.target.value;};
  const sc=$('#aiScrub');sc.addEventListener('pointerdown',()=>{scrubbing=true;});sc.addEventListener('pointerup',()=>{scrubbing=false;});
  sc.oninput=()=>{const a=st.plan&&st.plan.anim;if(!a||a.kind!=='scene')return;eng.playing=false;eng.t=sc.value/1000*a.scene.playSeconds;ctrlTxt();};
  new MutationObserver(applyLang).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if(window.PLAuth)PLAuth.onQuota(quotaTxt);window.addEventListener('physlab:ready',quotaTxt);
  window.PLAi={splitProblems,pageLines};
  applyLang();startAnim();
}
document.addEventListener('DOMContentLoaded',init);
})();
