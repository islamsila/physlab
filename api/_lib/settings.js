'use strict';
const {db}=require('./firebase');
const LEVELS=['minimal','low','medium','high'];
const DEFAULTS={aiEnabled:true,maintenance:false,registrationOpen:true,dailyLimit:10,globalDailyCap:0,ipDailyLimit:100,
  models:['gemini-3.8-flash','gemini-3.7-flash','gemini-3.6-flash','gemini-3.5-flash-lite'],
  thinkSolve:'medium',thinkAnim:'low',   // Gemini "o'ylash" darajasi: yechim uchun chuqurroq, animatsiya uchun yengil
  maintenanceMessage:'Sayt vaqtincha texnik ishlar uchun yopilgan.'};
let cache=null,at=0;
async function getSettings(force){
  if(!force&&cache&&Date.now()-at<15000)return cache;
  const s=await db().collection('config').doc('settings').get();
  cache=Object.assign({},DEFAULTS,s.exists?s.data():{});at=Date.now();return cache;
}
function clean(p){
  const o={};
  if('aiEnabled' in p)o.aiEnabled=!!p.aiEnabled;if('maintenance' in p)o.maintenance=!!p.maintenance;if('registrationOpen' in p)o.registrationOpen=!!p.registrationOpen;
  if('dailyLimit' in p){const n=Math.floor(+p.dailyLimit);if(!(n>=0&&n<=10000))throw new Error('Kunlik limit 0..10000');o.dailyLimit=n;}
  if('globalDailyCap' in p){const n=Math.floor(+p.globalDailyCap);if(!(n>=0&&n<=1000000))throw new Error('Umumiy limit noto‘g‘ri');o.globalDailyCap=n;}
  if('ipDailyLimit' in p){const n=Math.floor(+p.ipDailyLimit);if(!(n>=0&&n<=100000))throw new Error('IP limiti 0..100000');o.ipDailyLimit=n;}
  if('models' in p){const m=(Array.isArray(p.models)?p.models:String(p.models).split(/[\s,]+/)).map(x=>String(x).trim()).filter(Boolean);
    if(!m.length||m.length>6||m.some(x=>!/^[a-zA-Z0-9._-]{3,60}$/.test(x)))throw new Error('Model nomlari noto‘g‘ri');o.models=m;}
  for(const k of ['thinkSolve','thinkAnim'])if(k in p){if(!LEVELS.includes(p[k]))throw new Error('Thinking darajasi: '+LEVELS.join('/'));o[k]=p[k];}
  if('maintenanceMessage' in p)o.maintenanceMessage=String(p.maintenanceMessage||'').slice(0,300);
  return o;
}
async function saveSettings(p){const o=clean(p);await db().collection('config').doc('settings').set(o,{merge:true});cache=null;return getSettings(true);}
module.exports={getSettings,saveSettings,DEFAULTS,LEVELS};
