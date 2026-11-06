'use strict';
const {send,body,ip}=require('./_lib/http');
const {verify,touch,quotaOf}=require('./_lib/user');
const {getSettings}=require('./_lib/settings');
const {db}=require('./_lib/firebase');
/* Ism-familya tekshiruvi: kamida 2 ta so'z, faqat harflar (’ ' - . ruxsat) */
function cleanName(s){
  s=String(s||'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();
  if(s.length<5||s.length>60)return '';
  if(!/^[\p{L}\p{M}'\u2018\u2019\u02bb\u02bc`.\- ]+$/u.test(s))return '';
  const w=s.split(' ').filter(x=>x.replace(/[^\p{L}]/gu,'').length>=2);
  return w.length>=2?s:'';
}
/* Sessiya boshlanishi va yurak urishi (heartbeat). Foydalanuvchini bazaga yozadi.
   {setName:"Ism Familya"} yuborilsa, ism-familya saqlanadi. */
module.exports=async(req,res)=>{
  if(req.method!=='POST')return send(res,405,{error:'method'});
  try{
    const u=await verify(req);const st=await getSettings();const b=body(req);
    const {user}=await touch(u,ip(req));
    if(user.blocked)return send(res,403,{error:'blocked',message:'Hisobingiz administrator tomonidan bloklangan.'});
    if(st.maintenance)return send(res,503,{error:'maintenance',message:st.maintenanceMessage});
    if(typeof b.setName==='string'){
      const nm=cleanName(b.setName);
      if(!nm)return send(res,400,{error:'name',message:'Ism va familiyangizni to‘liq yozing (kamida 2 ta so‘z, faqat harflar).'});
      await db().collection('users').doc(u.uid).set({fullName:nm,name:nm},{merge:true});user.fullName=nm;
    }
    send(res,200,{user:{uid:u.uid,email:u.email,name:user.fullName||u.name,fullName:user.fullName||'',photo:u.picture},quota:await quotaOf(user),ai:st.aiEnabled});
  }catch(e){send(res,e.status||500,{error:e.code||'server',message:e.status?e.message:'Server xatosi: '+e.message});}
};
