'use strict';
const {db,auth,FieldValue}=require('./firebase');
const {dayKey}=require('./http');
const {getSettings}=require('./settings');
/* Authorization: Bearer <Firebase ID token> -> {uid,email,name,picture} */
async function verify(req){
  const h=String(req.headers.authorization||'');const m=/^Bearer\s+(.+)$/.exec(h);
  if(!m)throw Object.assign(new Error('Kirish talab qilinadi'),{status:401,code:'auth'});
  try{const d=await auth().verifyIdToken(m[1]);return {uid:d.uid,email:d.email||'',name:d.name||'',picture:d.picture||'',verified:d.email_verified!==false};}
  catch(e){throw Object.assign(new Error('Sessiya yaroqsiz. Qayta kiring.'),{status:401,code:'auth'});}
}
/* Foydalanuvchini yaratadi/yangilaydi. Qaytaradi: {user, isNew} */
async function touch(u,ip){
  const st=await getSettings();const ref=db().collection('users').doc(u.uid);const day=dayKey();let isNew=false,res;
  await db().runTransaction(async tx=>{
    const s=await tx.get(ref);const d=s.exists?s.data():null;
    if(!d&&!st.registrationOpen)throw Object.assign(new Error('Yangi foydalanuvchilarni qabul qilish vaqtincha yopilgan.'),{status:403,code:'closed'});
    const now=Date.now();const newSession=!d||!d.lastSeen||now-d.lastSeen>30*60e3;
    const upd={email:u.email,name:u.name,photo:u.picture,lastSeen:now};
    if(!d){upd.createdAt=now;upd.loginCount=1;upd.aiTotal=0;upd.aiToday=0;upd.aiDay=day;upd.blocked=false;isNew=true;}
    else if(newSession)upd.loginCount=(d.loginCount||0)+1;
    if(newSession&&ip)upd.lastIp=ip;
    if(!d||d.lastDay!==day){upd.lastDay=day;tx.set(db().collection('stats').doc('d_'+day),{day,active:FieldValue.increment(1)},{merge:true});}
    if(!d)tx.set(db().collection('stats').doc('total'),{users:FieldValue.increment(1)},{merge:true});
    tx.set(ref,upd,{merge:true});res=Object.assign({},d||{},upd);
  });
  return {user:res,isNew};
}
/* Kunlik kvotani band qiladi (tranzaksiya) */
async function reserve(uid){
  const st=await getSettings();const day=dayKey();const ref=db().collection('users').doc(uid),sref=db().collection('stats').doc('d_'+day);
  return db().runTransaction(async tx=>{
    const [s,ss]=await Promise.all([tx.get(ref),tx.get(sref)]);const u=s.data()||{};
    if(u.blocked)return {ok:false,reason:'blocked'};
    const used=(u.aiDay===day?u.aiToday:0)||0;const lim=typeof u.dailyLimit==='number'?u.dailyLimit:st.dailyLimit;
    if(used>=lim)return {ok:false,reason:'limit',used,limit:lim};
    const g=(ss.exists?ss.data().ai:0)||0;if(st.globalDailyCap>0&&g>=st.globalDailyCap)return {ok:false,reason:'global'};
    tx.set(ref,{aiDay:day,aiToday:used+1,aiTotal:(u.aiTotal||0)+1,lastAi:Date.now()},{merge:true});
    tx.set(sref,{day,ai:FieldValue.increment(1)},{merge:true});tx.set(db().collection('stats').doc('total'),{ai:FieldValue.increment(1)},{merge:true});
    return {ok:true,used:used+1,limit:lim};
  });
}
async function refund(uid){
  const day=dayKey();const ref=db().collection('users').doc(uid);
  try{await db().runTransaction(async tx=>{const s=await tx.get(ref);const u=s.data()||{};if(u.aiDay!==day||!u.aiToday)return;
    tx.set(ref,{aiToday:u.aiToday-1,aiTotal:Math.max(0,(u.aiTotal||1)-1)},{merge:true});
    tx.set(db().collection('stats').doc('d_'+day),{ai:FieldValue.increment(-1),fail:FieldValue.increment(1)},{merge:true});
    tx.set(db().collection('stats').doc('total'),{ai:FieldValue.increment(-1)},{merge:true});});}catch(e){}
}
async function quotaOf(u){const st=await getSettings();const day=dayKey();const used=(u.aiDay===day?u.aiToday:0)||0;return {used,limit:typeof u.dailyLimit==='number'?u.dailyLimit:st.dailyLimit};}
module.exports={verify,touch,reserve,refund,quotaOf};
