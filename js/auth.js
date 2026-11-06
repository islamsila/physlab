/* Kirish: Google emas — ISM va FAMILYA yoziladi (Firebase "Anonymous" kirish + ism-familya serverga saqlanadi).
   Server bilan aloqa: har so'rovga Firebase ID token qo'shiladi (api/_lib/user.js tekshiradi). */
const FB='https://www.gstatic.com/firebasejs/10.14.1/';
const $=s=>document.querySelector(s);
const T={uz:{wait:'Tekshirilmoqda…',blocked:'Hisobingiz bloklangan',setup:'Sayt hali sozlanmagan (administratorga murojaat qiling).',anonOff:'Kirish yoqilmagan: administrator Firebase → Authentication → Sign-in method → Anonymous ni yoqishi kerak.',net:'Ulanib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.',
  nameTitle:'Ism va familiyangizni yozing',fn:'Ism',ln:'Familya',go:'Kirish',nameErr:'Ism va familiyani to‘liq yozing (kamida 2 harfdan).',foot:'Ism-familyangiz administratorga ko‘rinadi.'},
         ru:{wait:'Проверка…',blocked:'Аккаунт заблокирован',setup:'Сайт ещё не настроен (обратитесь к администратору).',anonOff:'Вход не включён: администратору нужно включить Anonymous в Firebase → Authentication → Sign-in method.',net:'Не удалось подключиться. Проверьте интернет и повторите.',
  nameTitle:'Введите имя и фамилию',fn:'Имя',ln:'Фамилия',go:'Войти',nameErr:'Введите имя и фамилию полностью (от 2 букв).',foot:'Имя и фамилия видны администратору.'}};
const tr=k=>(T[window.LANG]||T.uz)[k];
let fb=null,auth=null,user=null,hb=null,pendingName=null;const listeners=[];
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
  setQuota(q){PLAuth.quota=q;listeners.forEach(f=>f(q));const el=$('#ubQuota');if(el&&q)el.textContent='AI '+q.used+'/'+q.limit;}
};
window.PLAuth=PLAuth;
const GT0=($('#gateText')||{}).textContent||'';
const gate=(show,msg,opt)=>{document.body.classList.toggle('locked',show);$('#gate').style.display=show?'':'none';
  $('#gMsg').textContent=msg||'';$('#gFoot').textContent=tr('foot');
  const nm=!!(opt&&opt.name);$('#gateText').textContent=nm?tr('nameTitle'):GT0;if(!nm){const b=$('#gName');if(b)b.remove();}};
/* Ism-familya oynasi. onSubmit("Ism Familya") muvaffaqiyatli tugasa oyna yopiladi, xato bersa xabar ko'rsatiladi. */
function nameBox(init,onSubmit){
  gate(true,'',{name:true});
  let box=$('#gName');if(box)box.remove();
  box=document.createElement('div');box.id='gName';box.style.cssText='display:grid;gap:10px;margin:0 0 14px;text-align:left';
  const st='width:100%;box-sizing:border-box;background:#0b1324;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:12px 14px;color:inherit;font:inherit;outline:none';
  box.innerHTML='<input id="gFn" autocomplete="given-name" maxlength="30" style="'+st+'"><input id="gLn" autocomplete="family-name" maxlength="30" style="'+st+'"><button class="gbtn" id="gGo" type="button"></button>';
  $('#gMsg').before(box);
  const fn=$('#gFn'),ln=$('#gLn'),go=$('#gGo');fn.placeholder=tr('fn');ln.placeholder=tr('ln');go.textContent=tr('go');
  const parts=String(init||'').trim().split(/\s+/).filter(Boolean);fn.value=parts[0]||'';ln.value=parts.slice(1).join(' ');
  let busy=false;
  const submit=async()=>{
    if(busy)return;const a=fn.value.trim(),b=ln.value.trim();
    if(a.length<2||b.length<2){$('#gMsg').textContent=tr('nameErr');return;}
    busy=true;go.disabled=true;$('#gMsg').textContent='';
    try{await onSubmit(a+' '+b);box.remove();}
    catch(e){$('#gMsg').textContent=e.message;busy=false;go.disabled=false;}
  };
  go.onclick=submit;[fn,ln].forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')submit();}));
  (fn.value?ln:fn).focus();
}
/* Hisob bor, lekin ism-familya hali yozilmagan (yoki server rad etgan). Muvaffaqiyatli bo'lsa /api/me javobini qaytaradi. */
function askName(j,msg){
  return new Promise(resolve=>{
    nameBox((j&&j.user&&j.user.name)||'',async nm=>{const r=await PLAuth.api('/api/me',{setName:nm});resolve(r);});
    if(msg)$('#gMsg').textContent=msg;
  });
}
async function session(){
  try{
    const first=pendingName;pendingName=null;let j;
    try{j=await PLAuth.api('/api/me',first?{setName:first}:{});}
    catch(e){if(e.code==='name'&&first)j=await askName({user:{name:first}},e.message);else throw e;}
    if(!j.user.fullName)j=await askName(j);
    PLAuth.setQuota(j.quota);PLAuth.aiOn=j.ai;
    $('#ubName').textContent=(j.user.fullName||j.user.name||'').split(' ')[0];
    $('#userbar').hidden=false;gate(false);
    clearInterval(hb);hb=setInterval(()=>{if(!document.hidden&&user)PLAuth.api('/api/me').then(j=>PLAuth.setQuota(j.quota)).catch(e=>{if(e.status===403||e.status===401||e.status===503)location.reload();});},5*60e3);
    window.dispatchEvent(new Event('physlab:ready'));
  }catch(e){
    $('#userbar').hidden=true;
    gate(true,e.code==='blocked'?tr('blocked'):e.message);
  }
}
async function boot(){
  gate(true,'');
  let cfg;
  try{const r=await fetch('/api/config');cfg=await r.json();if(!r.ok)throw new Error(cfg.message||tr('setup'));}
  catch(e){gate(true,e.message||tr('setup'));return;}
  let appM,authM;
  try{[appM,authM]=await Promise.all([import(FB+'firebase-app.js'),import(FB+'firebase-auth.js')]);}
  catch(e){gate(true,tr('net'));return;}
  fb=authM;const app=appM.initializeApp(cfg.firebase);auth=authM.getAuth(app);
  authM.onAuthStateChanged(auth,async u=>{user=u;
    if(!u){
      $('#userbar').hidden=true;clearInterval(hb);
      nameBox('',async nm=>{
        pendingName=nm;
        try{await authM.signInAnonymously(auth);}
        catch(e){pendingName=null;
          if(e.code==='auth/admin-restricted-operation'||e.code==='auth/operation-not-allowed')throw new Error(tr('anonOff'));
          if(e.code==='auth/network-request-failed')throw new Error(tr('net'));
          throw new Error(tr('net')+' ('+(e.code||'?')+')');}
      });
      return;}
    gate(true,tr('wait'));await session();});
}
boot();
