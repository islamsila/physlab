'use strict';
const {send}=require('./_lib/http');
/* Firebase web config — maxfiy emas (public). */
module.exports=(req,res)=>{
  const c={apiKey:process.env.FIREBASE_WEB_API_KEY,authDomain:process.env.FIREBASE_AUTH_DOMAIN||(process.env.FIREBASE_PROJECT_ID?process.env.FIREBASE_PROJECT_ID+'.firebaseapp.com':''),
    projectId:process.env.FIREBASE_PROJECT_ID,appId:process.env.FIREBASE_APP_ID};
  if(!c.apiKey||!c.projectId)return send(res,500,{error:'setup',message:'Server sozlanmagan: FIREBASE_WEB_API_KEY va FIREBASE_PROJECT_ID kiriting.'});
  send(res,200,{firebase:c});
};
