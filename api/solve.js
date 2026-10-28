'use strict';
const {send,body,ip}=require('./_lib/http');
const {verify,touch,reserve,refund}=require('./_lib/user');
const {getSettings}=require('./_lib/settings');
const {db}=require('./_lib/firebase');
const {generate,parseJson,GeminiError}=require('./_lib/gemini');
const {buildSystem}=require('./_lib/prompt');
const catalog=require('./_lib/catalog.json');
const Plan=require('../js/plan.js');
const ANIMS=new Set(catalog.anims.map(a=>a.name));
const MIMES=new Set(['image/png','image/jpeg','image/webp']);

function validate(raw){
  if(raw&&raw.error)return {userError:String(raw.message||'Bu masala emas').slice(0,300)};
  let n;try{n=Plan.normalize(raw,{animNames:ANIMS});}catch(e){return {fatal:[e.message],scene:[]};}
  const fatal=[...n.errors],scene=[...n.sceneErrors];
  if(!fatal.length){const run=Plan.run(n.plan);fatal.push(...run.errors);if(!fatal.length&&n.plan.anim)scene.push(...Plan.checkScene(n.plan,run));}
  return {fatal,scene,plan:n.plan};
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

module.exports=async(req,res)=>{
  if(req.method!=='POST')return send(res,405,{error:'method'});
  const t0=Date.now(),deadline=t0+56000;let u=null,reserved=false,model='';
  try{
    u=await verify(req);const st=await getSettings();
    const {user}=await touch(u,ip(req));
    if(user.blocked)return send(res,403,{error:'blocked',message:'Hisobingiz administrator tomonidan bloklangan.'});
    if(st.maintenance)return send(res,503,{error:'maintenance',message:st.maintenanceMessage});
    if(!st.aiEnabled)return send(res,403,{error:'ai_off',message:'AI yechuvchi hozircha administrator tomonidan o‘chirilgan.'});
    const b=body(req);
    const text=String(b.text||'').replace(/\u0000/g,'').trim().slice(0,6000),bookAnswer=String(b.bookAnswer||'').trim().slice(0,400),hint=String(b.hint||'').trim().slice(0,160);
    let image=null;if(b.image&&typeof b.image==='object'){const m=String(b.image.mime||''),d=String(b.image.data||'');
      if(!MIMES.has(m)||!/^[A-Za-z0-9+/=]+$/.test(d)||d.length>3.3e6)return send(res,400,{error:'image',message:'Rasm formati yoki hajmi noto‘g‘ri (PNG/JPG/WEBP, ≤ 2.4 MB).'});image={mime:m,data:d};}
    if(text.length<8&&!image)return send(res,400,{error:'empty',message:'Masala matni juda qisqa.'});
    const q=await reserve(u.uid);
    if(!q.ok){const msgs={blocked:'Hisobingiz bloklangan.',limit:'Bugungi AI so‘rovlar limiti tugadi ('+q.limit+' ta). Ertaga qayta urinib ko‘ring.',global:'Bugun umumiy AI limiti tugadi. Ertaga qayta urinib ko‘ring.'};
      return send(res,429,{error:q.reason,message:msgs[q.reason]||'Limit',quota:{used:q.used,limit:q.limit}});}
    reserved=true;
    const system=buildSystem(b.lang==='ru'?'ru':'uz');
    const parts=[{text:userText({text,bookAnswer,hint,lang:b.lang,hasImage:!!image})}];if(image)parts.push({inlineData:{mimeType:image.mime,data:image.data}});
    let contents=[{role:'user',parts}];
    let out=await generate({models:st.models,system,contents,deadline});model=out.model;
    let raw=null,v=null,parseErr=null;
    try{raw=parseJson(out.text);v=validate(raw);}catch(e){parseErr=e.message;}
    if(v&&v.userError){await refund(u.uid);reserved=false;await logIt({uid:u.uid,email:u.email,name:u.name,ts:Date.now(),ok:false,model,ms:Date.now()-t0,q:text.slice(0,300),error:'not_physics'});
      return send(res,422,{error:'not_physics',message:v.userError});}
    if(parseErr||v.fatal.length||v.scene.length){
      const problems=parseErr?['JSON o‘qib bo‘lmadi: '+parseErr]:[...v.fatal,...v.scene].slice(0,14);
      if(deadline-Date.now()>14000){
        contents=[...contents,{role:'model',parts:[{text:out.text.slice(0,14000)}]},{role:'user',parts:[{text:'The app rejected your JSON:\n- '+problems.join('\n- ')+'\nFix every problem and return the FULL corrected JSON object only.'}]}];
        try{out=await generate({models:[model,...st.models.filter(m=>m!==model)],system,contents,deadline});model=out.model;raw=parseJson(out.text);v=validate(raw);parseErr=null;}catch(e){if(!(e instanceof GeminiError))parseErr=e.message;else throw e;}
      }
    }
    if(parseErr||!v||v.fatal.length)throw new GeminiError('AI yechimi tekshiruvdan o‘tmadi: '+((v&&v.fatal[0])||parseErr||'noma’lum'),502,'badplan');
    let animError=null;if(v.scene.length){animError=v.scene[0];raw.anim=null;}
    if(raw.anim===undefined)raw.anim=null;
    await logIt({uid:u.uid,email:u.email,name:u.name,ts:Date.now(),ok:true,model,ms:Date.now()-t0,topic:v.plan.topic||'',title:v.plan.title,q:text.slice(0,300),hasImage:!!image,animError:animError||null});
    reserved=false;
    send(res,200,{plan:raw,animError,model,quota:{used:q.used,limit:q.limit}});
  }catch(e){
    if(reserved)await refund(u.uid);
    if(u&&e instanceof GeminiError)await logIt({uid:u.uid,email:u.email,name:u.name,ts:Date.now(),ok:false,model,ms:Date.now()-t0,error:String(e.message).slice(0,200)});
    const status=e.status&&e.status<600?(e instanceof GeminiError&&e.status===429?503:e.status):500;
    const msg=e instanceof GeminiError?(e.code==='rate'?'AI hozir band (bepul limit). Bir daqiqadan so‘ng qayta urining.':e.message):(e.status?e.message:'Server xatosi: '+e.message);
    send(res,status===401?401:status,{error:e.code||'server',message:msg});
  }
};
