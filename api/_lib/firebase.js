'use strict';
const admin=require('firebase-admin');
let app;
function init(){
  if(app)return app;
  const pid=process.env.FIREBASE_PROJECT_ID,email=process.env.FIREBASE_CLIENT_EMAIL;let key=process.env.FIREBASE_PRIVATE_KEY||'';
  if(!pid||!email||!key)throw new Error('FIREBASE_* muhit o‘zgaruvchilari kiritilmagan');
  key=key.replace(/\\n/g,'\n').replace(/^"|"$/g,'');
  app=admin.apps.length?admin.app():admin.initializeApp({credential:admin.credential.cert({projectId:pid,clientEmail:email,privateKey:key})});
  return app;
}
exports.db=()=>{init();return admin.firestore();};
exports.auth=()=>{init();return admin.auth();};
exports.FieldValue=admin.firestore.FieldValue;
