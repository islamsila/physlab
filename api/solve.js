'use strict';
/* 1-BOSQICH: masalani YECHISH (animatsiyasiz — tez va aniq). Animatsiya alohida /api/anim da tayyorlanadi,
   shunda har bir bosqich o'z vaqtiga ega (Vercel: 60 s) va animatsiya xatosi yechimni buzmaydi. */
const crypto=require('crypto');
const {send,body,ip}=require('./_lib/http');
const {verify,touch,reserve,refund,markSolve}=require('./_lib/user');
const {getSettings}=require('./_lib/settings');
const {db}=require('./_lib/firebase');
const {generate,parseJson,GeminiError}=require('./_lib/gemini');
const {buildSolveSystem}=require('./_lib/prompt');
const Plan=require('../js/plan.js');
const MIMES=new Set(['image/png','image/jpeg','image/webp']);
const RANK={ok:2,part:1,bad:0};

function validate(raw){
  if(raw&&raw.error)return {userError:String(raw.message||'Bu masala emas').slice(0,300)};
  let n;try{n=Plan.normalize(raw,{animNames:new Set()});}catch(e){return {fatal:[e.message]};}
  const fatal=[...n.errors];let run=null;
  if(!fatal.length){run=Plan.run(n.plan);fatal.push(...run.errors);}
  return {fatal,plan:n.plan,run};
}
function userText({text,bookAnswer,hint,lang,hasImage}){
  let s='LANGUAGE: '+(lang==='ru'?'ru':'uz')+'\n';
  if(hint)s+='SOURCE/HINT: '+hint+'\n';
  if(text)s+='PROBLEM TEXT (may be damaged by PDF extraction):\n<<<\n'+text+'\n>>>\n';
  if(hasImage)s+='The attached image contains the problem'+(text?' (and/or its page). Solve the problem described by the text/hint.':'. Solve the problem shown in it.')+'\n';
  if(bookAnswer)s+='REFERENCE ANSWER FROM THE BOOK (may also be damaged): '+bookAnswer+'\n';
  return s+'Return the JSON object.';
}
async function logIt(d){try{await db().collection('logs').add(d);}catch(e){}}
const bookState=(v,book)=>(v&&v.run&&!v.fatal.length&&book)?Plan.bookCheck(v.run,book):null;

module.exports=async(req,res)=>{
  if(req.method!=='POST')return send(res,405,{error:'method'});
  const t0=Date.now(),deadline=t0+56000;let u=null,reserved=false,model='',cip='';
  try{
    u=await verify(req);const st=await getSettings();cip=ip(req);
    const {user}=await touch(u,cip);
    if(user.blocked)return send(res,403,{error:'blocked',message:'Hisobingiz administrator tomonidan bloklangan.'});
    if(st.maintenance)return send(res,503,{error:'maintenance',message:st.maintenanceMessage});
    if(!st.aiEnabled)return send(res,403,{error:'ai_off',message:'AI yechuvchi hozircha administrator tomonidan o‘chirilgan.'});
    const b=body(req);
    const text=String(b.text||'').replace(/\u0000/g,'').trim().slice(0,6000),bookAnswer=String(b.bookAnswer||'').trim().slice(0,400),hint=String(b.hint||'').trim().slice(0,160);
    let image=null;if(b.image&&typeof b.image==='object'){const m=String(b.image.mime||''),d=String(b.image.data||'');
      if(!MIMES.has(m)||!/^[A-Za-z0-9+/=]+$/.test(d)||d.length>3.3e6)return send(res,400,{error:'image',message:'Rasm formati yoki hajmi noto‘g‘ri (PNG/JPG/WEBP, ≤ 2.4 MB).'});image={mime:m,data:d};}
    if(text.length<8&&!image)return send(res,400,{error:'empty',message:'Masala matni juda qisqa.'});
    const q=await reserve(u.uid,cip);
    if(!q.ok){const msgs={blocked:'Hisobingiz bloklangan.',limit:'Bugungi AI so‘rovlar limiti tugadi ('+q.limit+' ta). Ertaga qayta urinib ko‘ring.',global:'Bugun umumiy AI limiti tugadi. Ertaga qayta urinib ko‘ring.',ip:'Shu tarmoqdan bugungi so‘rovlar limiti tugadi. Ertaga qayta urinib ko‘ring.'};
      return send(res,429,{error:q.reason,message:msgs[q.reason]||'Limit',quota:{used:q.used,limit:q.limit}});}
    reserved=true;
    const system=buildSolveSystem(b.lang==='ru'?'ru':'uz');
    const parts=[{text:userText({text,bookAnswer,hint,lang:b.lang,hasImage:!!image})}];if(image)parts.push({inlineData:{mimeType:image.mime,data:image.data}});
    const base=[{role:'user',parts}];
    const gen=(contents,models)=>generate({models:models||st.models,system,contents,deadline,thinking:st.thinkSolve,maxTokens:12000,perCall:48000});
    let out=await gen(base);model=out.model;
    let raw=null,v=null,parseErr=null;
    const attempt=o=>{let r,x;try{r=parseJson(o.text);if(r&&typeof r==='object')delete r.anim;x=validate(r);}catch(e){return {err:e.message};}return {raw:r,v:x};};
    let a=attempt(out);raw=a.raw;v=a.v;parseErr=a.err||null;
    if(v&&v.userError){await refund(u.uid,cip);reserved=false;await logIt({uid:u.uid,email:u.email,name:user.name||u.name,ts:Date.now(),ok:false,model,ms:Date.now()-t0,q:text.slice(0,300),error:'not_physics'});
      return send(res,422,{error:'not_physics',message:v.userError});}
    /* yaroqsiz javob -> xatolarni AI ga ko'rsatib, bir marta qayta so'raymiz */
    if(parseErr||v.fatal.length){
      const problems=parseErr?['JSON o‘qib bo‘lmadi: '+parseErr]:v.fatal.slice(0,14);
      if(deadline-Date.now()>14000){
        const c2=[...base,{role:'model',parts:[{text:out.text.slice(0,14000)}]},{role:'user',parts:[{text:'The app rejected your JSON:\n- '+problems.join('\n- ')+'\nFix every problem and return the FULL corrected JSON object only.'}]}];
        try{out=await gen(c2,[model,...st.models.filter(m=>m!==model)]);model=out.model;a=attempt(out);raw=a.raw;v=a.v;parseErr=a.err||null;}catch(e){if(!(e instanceof GeminiError))parseErr=e.message;else throw e;}
      }
    }
    if(parseErr||!v||v.fatal.length)throw new GeminiError('AI yechimi tekshiruvdan o‘tmadi: '+((v&&v.fatal[0])||parseErr||'noma’lum'),502,'badplan');
    /* kitob javobi berilgan va mos kelmasa — AI ga javobni ko'rsatib, qayta o'ylashni so'raymiz (vaqt bo'lsa) */
    let bk=bookState(v,bookAnswer);
    if(bookAnswer&&bk==='bad'&&deadline-Date.now()>20000){   // 'part' (kitobda faqat bitta javob berilgan bo'lishi mumkin) — qayta so'ramaymiz
      const mine=v.run.answers.map(x=>(x.sym||x.id)+' = '+Plan.fmtNum(x.shown)+' '+(x.unit||'')).join('; ');
      const c3=[...base,{role:'model',parts:[{text:out.text.slice(0,14000)}]},{role:'user',parts:[{text:'Your answers ('+mine+') do NOT match the book reference answer: '+bookAnswer+'.\nRe-read the problem. Typical causes: a symbol or number lost in PDF extraction, a wrong law for this situation, a unit conversion, different constants (g, π), or a misread sub-question. Re-solve carefully. If after re-checking you are sure your solution is right, keep it and explain the difference in "notes". Return the FULL JSON object only.'}]}];
      try{const o2=await gen(c3,[model,...st.models.filter(m=>m!==model)]);const a2=attempt(o2);
        if(a2.v&&!a2.v.userError&&!a2.v.fatal.length){const bk2=bookState(a2.v,bookAnswer);if((RANK[bk2]||0)>=(RANK[bk]||0)){raw=a2.raw;v=a2.v;bk=bk2;model=o2.model;}}}catch(e){/* birinchi yechim qoladi */}
    }
    const solveId=crypto.randomBytes(9).toString('base64url');
    await markSolve(u.uid,solveId,crypto.createHash('sha256').update(Plan.planKey(v.plan)).digest('hex'));
    await logIt({uid:u.uid,email:u.email,name:user.name||u.name,ts:Date.now(),ok:true,model,ms:Date.now()-t0,topic:v.plan.topic||'',title:v.plan.title,q:text.slice(0,300),hasImage:!!image,book:bk||null});
    reserved=false;
    send(res,200,{plan:raw,solveId,bookCheck:bk,model,quota:{used:q.used,limit:q.limit}});
  }catch(e){
    if(reserved)await refund(u.uid,cip);
    if(u&&e instanceof GeminiError)await logIt({uid:u.uid,email:u.email,name:u.name,ts:Date.now(),ok:false,model,ms:Date.now()-t0,error:String(e.message).slice(0,200)});
    const status=e.status&&e.status<600?(e instanceof GeminiError&&e.status===429?503:e.status):500;
    const msg=e instanceof GeminiError?(e.code==='rate'?'AI hozir band (bepul limit). Bir daqiqadan so‘ng qayta urining.':e.message):(e.status?e.message:'Server xatosi: '+e.message);
    send(res,status===401?401:status,{error:e.code||'server',message:msg});
  }
};
