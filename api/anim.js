'use strict';
/* 2-BOSQICH: tayyor yechimga ANIMATSIYA yaratadi. Kvota sarflamaydi, lekin faqat yaqinda yechilgan masala uchun
   (solveId + yechim izi mos bo'lsa), har yechimga 2 ta urinish. Shu tarzda bu endpoint "umumiy AI proksi"ga aylanmaydi. */
const crypto=require('crypto');
const {send,body,ip}=require('./_lib/http');
const {verify,reserveAnim}=require('./_lib/user');
const {getSettings}=require('./_lib/settings');
const {db}=require('./_lib/firebase');
const {generate,parseJson,GeminiError}=require('./_lib/gemini');
const {buildAnimSystem,animUserText}=require('./_lib/prompt');
const catalog=require('./_lib/catalog.json');
const Plan=require('../js/plan.js');
const ANIMS=new Set(catalog.anims.map(a=>a.name));

function checkAnim(base,rawAnim){
  const cand=Object.assign({},base,{anim:rawAnim});let n;
  try{n=Plan.normalize(cand,{animNames:ANIMS});}catch(e){return {errors:[e.message]};}
  if(n.errors.length)return {errors:n.errors};
  if(!n.plan.anim)return {errors:n.sceneErrors.length?n.sceneErrors:['animatsiya bo‘sh']};
  if(n.sceneErrors.length)return {errors:n.sceneErrors};
  const run=Plan.run(n.plan);const ce=Plan.checkScene(n.plan,run);
  return ce.length?{errors:ce}:{anim:rawAnim};
}
async function logIt(d){try{await db().collection('logs').add(d);}catch(e){}}

module.exports=async(req,res)=>{
  if(req.method!=='POST')return send(res,405,{error:'method'});
  const t0=Date.now(),deadline=t0+56000;let u=null,model='',title='';
  try{
    u=await verify(req);const st=await getSettings();
    if(st.maintenance)return send(res,503,{error:'maintenance',message:st.maintenanceMessage});
    if(!st.aiEnabled)return send(res,403,{error:'ai_off',message:'AI yechuvchi hozircha administrator tomonidan o‘chirilgan.'});
    const b=body(req);const raw=b.plan;
    if(!raw||typeof raw!=='object')return send(res,400,{error:'plan',message:'Yechim yuborilmadi.'});
    let n;try{n=Plan.normalize(Object.assign({},raw,{anim:null}),{animNames:ANIMS});}catch(e){return send(res,400,{error:'plan',message:'Yechim noto‘g‘ri.'});}
    if(n.errors.length)return send(res,400,{error:'plan',message:'Yechim noto‘g‘ri.'});
    const run=Plan.run(n.plan);if(run.errors.length)return send(res,400,{error:'plan',message:'Yechim hisoblanmadi.'});
    title=n.plan.title;
    const hash=crypto.createHash('sha256').update(Plan.planKey(n.plan)).digest('hex');
    const r=await reserveAnim(u.uid,String(b.solveId||''),hash);
    if(!r.ok)return send(res,r.reason==='blocked'?403:429,{error:'anim_'+r.reason,message:r.reason==='left'?'Animatsiya uchun urinishlar tugadi.':(r.reason==='blocked'?'Hisobingiz bloklangan.':'Animatsiya faqat yangi yechilgan masala uchun yaratiladi.')});
    const lang=b.lang==='ru'?'ru':'uz';const system=buildAnimSystem(lang);
    const base=Object.assign({},raw);delete base.anim;
    const base0=[{role:'user',parts:[{text:animUserText(n.plan,run,lang)}]}];
    const gen=(contents,models)=>generate({models:models||st.models,system,contents,deadline,thinking:st.thinkAnim,maxTokens:16000,perCall:48000});
    let out=await gen(base0);model=out.model;
    let res1=null,err=null;
    const tryOne=o=>{let j;try{j=parseJson(o.text);}catch(e){return {errors:['JSON o‘qib bo‘lmadi: '+e.message]};}
      if(!j||typeof j!=='object')return {errors:['JSON obyekt emas']};if(j.anim===null||j.anim===undefined)return {none:true};return checkAnim(base,j.anim);};
    res1=tryOne(out);
    if(res1.errors&&deadline-Date.now()>14000){
      const c2=[...base0,{role:'model',parts:[{text:out.text.slice(0,14000)}]},{role:'user',parts:[{text:'The app rejected your animation:\n- '+res1.errors.slice(0,12).join('\n- ')+'\nFix every problem (only use ids that exist in the solved problem; keep all numbers finite for ts in 0..duration) and return the FULL corrected {"anim": ...} JSON only.'}]}];
      try{out=await gen(c2,[model,...st.models.filter(m=>m!==model)]);model=out.model;res1=tryOne(out);}catch(e){if(!(e instanceof GeminiError))res1={errors:[e.message]};else throw e;}
    }
    if(res1.anim)return send(res,200,{anim:res1.anim,model,left:r.left});
    const msg=res1.none?'Bu masala uchun animatsiya yaratilmadi.':'Animatsiya tekshiruvdan o‘tmadi: '+String((res1.errors||[])[0]||'').slice(0,160);
    await logIt({uid:u.uid,email:u.email,name:u.name,ts:Date.now(),ok:false,model,ms:Date.now()-t0,title,error:'anim: '+msg.slice(0,160)});
    send(res,200,{anim:null,animError:msg,model,left:r.left});
  }catch(e){
    if(u&&e instanceof GeminiError)await logIt({uid:u.uid,email:u.email,name:u.name,ts:Date.now(),ok:false,model,ms:Date.now()-t0,title,error:'anim: '+String(e.message).slice(0,160)});
    const status=e.status&&e.status<600?(e instanceof GeminiError&&e.status===429?503:e.status):500;
    const msg=e instanceof GeminiError?(e.code==='rate'?'AI hozir band (bepul limit). Birozdan so‘ng qayta urining.':e.message):(e.status?e.message:'Server xatosi: '+e.message);
    send(res,status===401?401:status,{error:e.code||'server',message:msg});
  }
};
