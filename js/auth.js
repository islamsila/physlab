/* Google orqali kirish (Firebase Auth) + server bilan aloqa. */
const FB='https://www.gstatic.com/firebasejs/10.14.1/';
const $=s=>document.querySelector(s);
const T={uz:{signin:'Google bilan kirish',wait:'Tekshirilmoqda…',blocked:'Hisobingiz bloklangan',other:'Boshqa akkaunt bilan kirish',popup:'Kirish oynasi yopildi yoki bloklandi. Qayta urinib ko‘ring.',setup:'Sayt hali sozlanmagan (administratorga murojaat qiling).'},
         ru:{signin:'Войти через Google',wait:'Проверка…',blocked:'Аккаунт заблокирован',other:'Войти другим аккаунтом',popup:'Окно входа закрыто или заблокировано. Попробуйте ещё раз.',setup:'Сайт ещё не настроен (обратитесь к администратору).'}};
const tr=k=>(T[window.LANG]||T.uz)[k];
let fb=null,auth=null,user=null,hb=null;const listeners=[];
const PLAuth={
  get user(){return user;},quota:null,
  async token(){return user?await user.getIdToken():null;},
  async api(path,body){
    const tk=await PLAuth.token();
    const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+tk},body:JSON.stringify(body||{})});
    let j={};try{j=await r.json();}catch(e){}
    if(!r.ok){const e=new Error(j.message||('Xato '+r.status));e.status=r.status;e.code=j.error;e.data=j;throw e;}
    return j;
  },
  onQuota(cb){listeners.push(cb);},
  setQuota(q){PLAuth.quota=q;listeners.forEach(f=>f(q));const el=$('#ubQuota');if(el&&q)el.textContent='AI '+q.used+'/'+q.limit;},
  signOut(){return fb&&fb.signOut(auth);}
};
window.PLAuth=PLAuth;
const gate=(show,msg,opt)=>{document.body.classList.toggle('locked',show);$('#gate').style.display=show?'':'none';
  $('#gMsg').textContent=msg||'';$('#gBtn').hidden=!!(opt&&opt.hideBtn);$('#gOut').hidden=!(opt&&opt.showOut);$('#gOut').textContent=tr('other');$('#gBtnT').textContent=tr('signin');};
async function session(){
  try{
    const j=await PLAuth.api('/api/me');PLAuth.setQuota(j.quota);PLAuth.aiOn=j.ai;
    $('#ubName').textContent=(j.user.name||j.user.email||'').split(' ')[0];const ph=$('#ubPhoto');if(j.user.photo){ph.src=j.user.photo;ph.style.display='';}else ph.style.display='none';
    $('#userbar').hidden=false;gate(false);
    clearInterval(hb);hb=setInterval(()=>{if(!document.hidden&&user)PLAuth.api('/api/me').then(j=>PLAuth.setQuota(j.quota)).catch(e=>{if(e.status===403||e.status===401||e.status===503)location.reload();});},5*60e3);
    window.dispatchEvent(new Event('physlab:ready'));
  }catch(e){
    $('#userbar').hidden=true;
    gate(true,e.message,{hideBtn:e.code==='blocked'||e.code==='closed'||e.code==='maintenance',showOut:true});
  }
}
async function boot(){
  $('#gBtnT').textContent=tr('signin');
  let cfg;
  try{const r=await fetch('/api/config');cfg=await r.json();if(!r.ok)throw new Error(cfg.message||tr('setup'));}
  catch(e){gate(true,e.message||tr('setup'),{hideBtn:true});return;}
  const [appM,authM]=await Promise.all([import(FB+'firebase-app.js'),import(FB+'firebase-auth.js')]);
  fb=authM;const app=appM.initializeApp(cfg.firebase);auth=authM.getAuth(app);
  authM.onAuthStateChanged(auth,async u=>{user=u;
    if(!u){$('#userbar').hidden=true;clearInterval(hb);gate(true,'');return;}
    gate(true,tr('wait'),{hideBtn:true});await session();});
  $('#gBtn').onclick=async()=>{
    $('#gMsg').textContent='';const prov=new authM.GoogleAuthProvider();prov.setCustomParameters({prompt:'select_account'});
    try{await authM.signInWithPopup(auth,prov);}
    catch(e){if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'){try{await authM.signInWithRedirect(auth,prov);return;}catch(_){}}
      if(e.code==='auth/user-disabled')$('#gMsg').textContent=tr('blocked');else if(e.code!=='auth/cancelled-popup-request')$('#gMsg').textContent=tr('popup')+(e.code?' ('+e.code+')':'');}
  };
  $('#gOut').onclick=async()=>{await authM.signOut(auth);};
  $('#ubOut').onclick=async()=>{await authM.signOut(auth);};
}
boot();
