'use strict';
const {send,body,ip}=require('./_lib/http');
const {verify,touch,quotaOf}=require('./_lib/user');
const {getSettings}=require('./_lib/settings');
/* Sessiya boshlanishi va yurak urishi (heartbeat). Foydalanuvchini bazaga yozadi. */
module.exports=async(req,res)=>{
  if(req.method!=='POST')return send(res,405,{error:'method'});
  try{
    const u=await verify(req);const st=await getSettings();
    const {user}=await touch(u,ip(req));
    if(user.blocked)return send(res,403,{error:'blocked',message:'Hisobingiz administrator tomonidan bloklangan.'});
    if(st.maintenance)return send(res,503,{error:'maintenance',message:st.maintenanceMessage});
    send(res,200,{user:{uid:u.uid,email:u.email,name:u.name,photo:u.picture},quota:await quotaOf(user),ai:st.aiEnabled});
  }catch(e){send(res,e.status||500,{error:e.code||'server',message:e.status?e.message:'Server xatosi: '+e.message});}
};
