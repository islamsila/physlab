'use strict';
const {send,body,ip,dayKey,sameOrigin}=require('../_lib/http');
const {db,auth,FieldValue}=require('../_lib/firebase');
const A=require('../_lib/admin');
const {getSettings,saveSettings}=require('../_lib/settings');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pick=(d,ks)=>{const o={};ks.forEach(k=>{if(d[k]!==undefined)o[k]=d[k];});return o;};

async function login(req,res){
  const b=body(req);const addr=ip(req);
  const a=await A.reserveAttempt(addr);
  if(a.locked)return send(res,429,{error:'locked',retryAfterSec:a.retryAfterSec,message:'3 marta xato kiritildi. Xavfsizlik uchun kirish vaqtincha yopildi.'});
  const ok=await A.verifyCredentials(b.username,b.password);
  if(ok){await A.clearFailures();return send(res,200,{ok:true},{'set-cookie':await A.newCookie()});}
  await sleep(700);
  const f=await A.recordFailure(addr);
  if(f.locked)return send(res,429,{error:'locked',retryAfterSec:f.retryAfterSec,message:'3 marta xato kiritildi. Xavfsizlik uchun kirish 1 soatga yopildi.'});
  send(res,401,{error:'bad_credentials',attemptsLeft:f.attemptsLeft,message:'Login yoki parol noto‘g‘ri. Qolgan urinishlar: '+f.attemptsLeft});
}
async function lockStatus(req,res){ // login oynasi ochilganda blok holatini ko'rsatish uchun
  const s=await db().collection('config').doc('adminLock').get();const d=s.data()||{};const now=Date.now();
  if(d.lockedUntil&&d.lockedUntil>now)return send(res,200,{locked:true,retryAfterSec:Math.ceil((d.lockedUntil-now)/1000)});
  send(res,200,{locked:false,attemptsLeft:A.MAX_FAILS-(d.fails||0)});
}
async function stats(){
  const U=db().collection('users'),now=Date.now(),day=dayKey();
  const cnt=async q=>(await q.count().get()).data().count;
  const days=[];for(let i=13;i>=0;i--)days.push(dayKey(now-i*86400e3));
  const [total,blocked,online,a24,a7,dailySnap,top,recent,today]=await Promise.all([
    cnt(U),cnt(U.where('blocked','==',true)),cnt(U.where('lastSeen','>=',now-6*60e3)),cnt(U.where('lastSeen','>=',now-24*3600e3)),cnt(U.where('lastSeen','>=',now-7*86400e3)),
    db().getAll(...days.map(d=>db().collection('stats').doc('d_'+d))),
    U.orderBy('aiTotal','desc').limit(5).get(),U.orderBy('createdAt','desc').limit(8).get(),db().collection('stats').doc('total').get()]);
  const daily=dailySnap.map((s,i)=>({day:days[i],ai:(s.exists&&s.data().ai)||0,fail:(s.exists&&s.data().fail)||0,active:(s.exists&&s.data().active)||0}));
  const f=d=>({uid:d.id,email:d.get('email'),name:d.get('name'),photo:d.get('photo'),aiTotal:d.get('aiTotal')||0,createdAt:d.get('createdAt')});
  return {totalUsers:total,blocked,online,active24h:a24,active7d:a7,aiToday:daily[daily.length-1].ai,aiTotal:(today.exists&&today.data().ai)||0,failToday:daily[daily.length-1].fail,daily,top:top.docs.map(f).filter(x=>x.aiTotal>0),recent:recent.docs.map(f),day};
}
async function users(){
  const s=await db().collection('users').orderBy('lastSeen','desc').limit(1000).get();const day=dayKey();const st=await getSettings();
  return s.docs.map(d=>{const u=d.data();return {uid:d.id,...pick(u,['email','name','photo','createdAt','lastSeen','loginCount','aiTotal','blocked','dailyLimit','lastIp']),
    aiToday:u.aiDay===day?(u.aiToday||0):0,limit:typeof u.dailyLimit==='number'?u.dailyLimit:st.dailyLimit};});
}
async function userUpdate(b){
  const uid=String(b.uid||'');if(!/^[A-Za-z0-9_-]{6,128}$/.test(uid))throw Object.assign(new Error('uid noto‘g‘ri'),{status:400});
  const ref=db().collection('users').doc(uid);const upd={};
  if('blocked' in b){upd.blocked=!!b.blocked;try{await auth().updateUser(uid,{disabled:!!b.blocked});if(b.blocked)await auth().revokeRefreshTokens(uid);}catch(e){}}
  if('dailyLimit' in b){if(b.dailyLimit===null||b.dailyLimit==='')upd.dailyLimit=FieldValue.delete();else{const n=Math.floor(+b.dailyLimit);if(!(n>=0&&n<=10000))throw Object.assign(new Error('Limit 0..10000'),{status:400});upd.dailyLimit=n;}}
  if(b.resetToday)upd.aiToday=0;
  if(!Object.keys(upd).length)return;await ref.set(upd,{merge:true});
}
async function userDelete(b){
  const uid=String(b.uid||'');if(!/^[A-Za-z0-9_-]{6,128}$/.test(uid))throw Object.assign(new Error('uid noto‘g‘ri'),{status:400});
  await db().collection('users').doc(uid).delete();try{await auth().deleteUser(uid);}catch(e){}
  await db().collection('stats').doc('total').set({users:FieldValue.increment(-1)},{merge:true});
}
async function logs(b){
  const n=Math.min(300,Math.max(10,Math.floor(+b.limit||100)));const s=await db().collection('logs').orderBy('ts','desc').limit(n).get();
  return s.docs.map(d=>({id:d.id,...d.data()}));
}
async function logsClear(){let n=0;for(;;){const s=await db().collection('logs').limit(400).get();if(s.empty)break;const bt=db().batch();s.docs.forEach(d=>bt.delete(d.ref));await bt.commit();n+=s.size;if(n>20000)break;}return n;}

module.exports=async(req,res)=>{
  const action=String(req.query&&req.query.action||'');
  try{
    if(req.method!=='POST')return send(res,405,{error:'method'});
    if(!sameOrigin(req)||req.headers['x-requested-with']!=='physlab')return send(res,403,{error:'csrf',message:'Ruxsat yo‘q'});
    if(action==='login')return await login(req,res);
    if(action==='lock')return await lockStatus(req,res);
    const sess=await A.readSession(req);
    if(!sess)return send(res,401,{error:'unauth',message:'Avval tizimga kiring'});
    const b=body(req);
    switch(action){
      case 'session':return send(res,200,{ok:true,username:sess.u});
      case 'logout':return send(res,200,{ok:true},{'set-cookie':A.clearCookie()});
      case 'stats':return send(res,200,await stats());
      case 'users':return send(res,200,{users:await users()});
      case 'userUpdate':await userUpdate(b);return send(res,200,{ok:true});
      case 'userDelete':await userDelete(b);return send(res,200,{ok:true});
      case 'logs':return send(res,200,{logs:await logs(b)});
      case 'logsClear':return send(res,200,{ok:true,deleted:await logsClear()});
      case 'settings':return send(res,200,{settings:await getSettings(true),keys:require('../_lib/gemini').keys().length});
      case 'settingsSave':return send(res,200,{settings:await saveSettings(b)});
      case 'password':{
        const np=String(b.newPassword||'');if(np.length<10)return send(res,400,{error:'weak',message:'Yangi parol kamida 10 belgidan iborat bo‘lsin.'});
        await sleep(600);if(!(await A.verifyCredentials(process.env.ADMIN_USERNAME||'admin',b.currentPassword)))return send(res,401,{error:'bad_credentials',message:'Joriy parol noto‘g‘ri.'});
        await A.setPassword(np);return send(res,200,{ok:true},{'set-cookie':await A.newCookie()});}
      default:return send(res,404,{error:'unknown',message:'Noma’lum amal'});
    }
  }catch(e){send(res,e.status||500,{error:'server',message:e.status?e.message:'Server xatosi: '+e.message});}
};
