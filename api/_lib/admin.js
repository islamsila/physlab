'use strict';
const crypto=require('crypto');
const {db}=require('./firebase');
const MAX_FAILS=3,LOCK_MS=3600e3,SESSION_MS=8*3600e3,COOKIE='pl_admin';
const b64=b=>Buffer.from(b).toString('base64url');
const secret=()=>{const s=process.env.SESSION_SECRET||'';if(s.length<16)throw new Error('SESSION_SECRET (kamida 16 belgi) sozlanmagan');return s;};
const eq=(a,b)=>{const x=crypto.createHash('sha256').update(String(a)).digest(),y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y);};
/* ---- parol xeshi ---- */
function hashPassword(pw){const salt=crypto.randomBytes(16);const h=crypto.scryptSync(pw,salt,32,{N:16384,r:8,p:1});return 'scrypt$16384$'+b64(salt)+'$'+b64(h);}
function checkHash(pw,stored){try{const [alg,N,s,h]=String(stored).split('$');if(alg!=='scrypt')return false;const want=Buffer.from(h,'base64url');
  const got=crypto.scryptSync(pw,Buffer.from(s,'base64url'),want.length,{N:+N,r:8,p:1});return crypto.timingSafeEqual(got,want);}catch(e){return false;}}
async function adminCfg(){const s=await db().collection('config').doc('admin').get();return s.exists?s.data():{};}
async function verifyCredentials(username,password){
  const cfg=await adminCfg();const user=process.env.ADMIN_USERNAME||'admin';
  const okUser=eq(String(username||''),user);let okPass=false;
  const stored=cfg.hash||process.env.ADMIN_PASSWORD_HASH;
  if(stored)okPass=checkHash(String(password||''),stored);
  else if(process.env.ADMIN_PASSWORD)okPass=eq(String(password||''),process.env.ADMIN_PASSWORD);
  return okUser&&okPass;
}
/* ---- blok (3 xato = 1 soat) ----
   Urinish tekshiruvdan OLDIN band qilinadi: parallel so'rovlar bilan ham 3 tadan ortiq taxmin qilib bo'lmaydi. */
async function reserveAttempt(ip){
  const ref=db().collection('config').doc('adminLock');
  return db().runTransaction(async tx=>{
    const s=await tx.get(ref);const d=s.exists?s.data():{};const now=Date.now();
    if(d.lockedUntil&&d.lockedUntil>now)return {locked:true,retryAfterSec:Math.ceil((d.lockedUntil-now)/1000)};
    let fails=d.lockedUntil&&d.lockedUntil<=now?0:(d.fails||0);
    if(fails>=MAX_FAILS){tx.set(ref,{fails:0,lockedUntil:now+LOCK_MS,lastIp:ip},{merge:true});return {locked:true,retryAfterSec:LOCK_MS/1000};}
    fails+=1;tx.set(ref,{fails,lockedUntil:0,lastTry:now,lastIp:ip},{merge:true});
    return {locked:false,fails};
  });
}
async function recordFailure(ip){
  const ref=db().collection('config').doc('adminLock');
  return db().runTransaction(async tx=>{
    const s=await tx.get(ref);const d=s.data()||{};const now=Date.now();
    if(d.lockedUntil&&d.lockedUntil>now)return {locked:true,retryAfterSec:Math.ceil((d.lockedUntil-now)/1000)};
    if((d.fails||0)>=MAX_FAILS){tx.set(ref,{fails:0,lockedUntil:now+LOCK_MS,lastIp:ip,lastLockAt:now},{merge:true});return {locked:true,retryAfterSec:LOCK_MS/1000};}
    return {locked:false,attemptsLeft:MAX_FAILS-(d.fails||0)};
  });
}
async function clearFailures(){await db().collection('config').doc('adminLock').set({fails:0,lockedUntil:0},{merge:true});}
/* ---- sessiya cookie ---- */
function sign(p){const body=b64(JSON.stringify(p));return body+'.'+crypto.createHmac('sha256',secret()).update(body).digest('base64url');}
async function newCookie(){const cfg=await adminCfg();const exp=Date.now()+SESSION_MS;
  const v=sign({u:process.env.ADMIN_USERNAME||'admin',exp,sv:cfg.sessVer||1});
  return COOKIE+'='+v+'; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age='+Math.floor(SESSION_MS/1000);}
const clearCookie=()=>COOKIE+'=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0';
async function readSession(req){
  const m=new RegExp('(?:^|;\\s*)'+COOKIE+'=([^;]+)').exec(req.headers.cookie||'');if(!m)return null;
  const [body,sig]=m[1].split('.');if(!body||!sig)return null;
  const want=crypto.createHmac('sha256',secret()).update(body).digest('base64url');
  if(sig.length!==want.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(want)))return null;
  let p;try{p=JSON.parse(Buffer.from(body,'base64url').toString());}catch(e){return null;}
  if(!p||p.exp<Date.now())return null;const cfg=await adminCfg();if((cfg.sessVer||1)!==p.sv)return null;return p;
}
async function setPassword(newPw){const cfg=await adminCfg();await db().collection('config').doc('admin').set({hash:hashPassword(newPw),sessVer:(cfg.sessVer||1)+1,changedAt:Date.now()},{merge:true});}
module.exports={hashPassword,verifyCredentials,reserveAttempt,recordFailure,clearFailures,newCookie,clearCookie,readSession,setPassword,MAX_FAILS};
