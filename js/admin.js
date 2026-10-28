(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let usersCache=[],lockTimer=null;
async function api(action,body){
  const r=await fetch('/api/admin/'+action,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-requested-with':'physlab'},body:JSON.stringify(body||{})});
  let j={};try{j=await r.json();}catch(e){}
  if(r.status===401&&action!=='login'){showLogin();throw new Error('Sessiya tugadi');}
  if(!r.ok){const e=new Error(j.message||('Xato '+r.status));e.data=j;e.status=r.status;throw e;}
  return j;
}
function toast(t,err){const el=$('#toast');el.textContent=t;el.className='toast show'+(err?' err':'');clearTimeout(toast.t);toast.t=setTimeout(()=>el.className='toast',2800);}
const ago=ms=>{if(!ms)return '—';const s=Math.max(0,(Date.now()-ms)/1000);if(s<90)return 'hozir';if(s<3600)return Math.round(s/60)+' daq oldin';if(s<86400)return Math.round(s/3600)+' soat oldin';return Math.round(s/86400)+' kun oldin';};
const dt=ms=>ms?new Date(ms).toLocaleString('uz-UZ',{timeZone:'Asia/Tashkent',hour12:false,day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
const av=u=>u.photo?'<img src="'+esc(u.photo)+'" referrerpolicy="no-referrer" alt="">':'<i>'+esc((u.name||u.email||'?')[0].toUpperCase())+'</i>';
/* ---------- login ---------- */
function fmtT(s){s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return [h,m,x].map(v=>String(v).padStart(2,'0')).join(':');}
function setLocked(sec){clearInterval(lockTimer);const box=$('#lLock'),dis=v=>{$('#lBtn').disabled=v;$('#lUser').disabled=v;$('#lPass').disabled=v;};
  if(!(sec>0)){box.hidden=true;dis(false);return;}let left=sec;dis(true);box.hidden=false;
  const tick=()=>{box.innerHTML='Kirish vaqtincha yopilgan.<br>Qayta urinish mumkin bo‘lishiga:<b>'+fmtT(left)+'</b>';if(left--<=0){clearInterval(lockTimer);setLocked(0);$('#lMsg').textContent='';}};tick();lockTimer=setInterval(tick,1000);}
function showLogin(){$('#app').hidden=true;$('#loginView').style.display='grid';$('#lPass').value='';
  api('lock').then(j=>{if(j.locked)setLocked(j.retryAfterSec);else if(j.attemptsLeft<3)$('#lMsg').textContent='Qolgan urinishlar: '+j.attemptsLeft;}).catch(()=>{});}
$('#loginForm').onsubmit=async e=>{e.preventDefault();$('#lMsg').textContent='';$('#lBtn').disabled=true;
  try{await api('login',{username:$('#lUser').value.trim(),password:$('#lPass').value});$('#lPass').value='';enter();}
  catch(err){$('#lMsg').textContent=err.message;if(err.data&&err.data.error==='locked')setLocked(err.data.retryAfterSec);$('#lPass').value='';}
  finally{if($('#lLock').hidden)$('#lBtn').disabled=false;}};
async function enter(){const s=await api('session');$('#loginView').style.display='none';$('#app').hidden=false;$('#who').textContent=s.username;tab('dash');}
$('#outBtn').onclick=async()=>{try{await api('logout');}catch(e){}showLogin();};
/* ---------- tablar ---------- */
function tab(t){$$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('.admmain .view').forEach(v=>v.classList.toggle('on',v.id==='t-'+t));
  ({dash:loadDash,users:loadUsers,logs:loadLogs,set:loadSet,sec:()=>{}})[t]().catch(e=>toast(e.message,true));}
$$('#tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
/* ---------- statistika ---------- */
async function loadDash(){
  const s=await api('stats');
  const C=[['c1','Jami foydalanuvchi',s.totalUsers],['c2','Hozir onlayn',s.online],['c3','24 soatda faol',s.active24h],['c3','7 kunda faol',s.active7d],['c4','Bugun AI so‘rov',s.aiToday],['c4','Jami AI so‘rov',s.aiTotal],['c5','Bloklangan',s.blocked],['c5','Bugungi AI xatolar',s.failToday]];
  $('#cards').innerHTML=C.map(c=>'<div class="card '+c[0]+'"><small>'+c[1]+'</small><b>'+c[2]+'</b></div>').join('');
  const mx=Math.max(1,...s.daily.map(d=>Math.max(d.ai,d.active)));
  $('#chart').innerHTML='<div class="bars">'+s.daily.map(d=>'<div class="bar" title="'+esc(d.day)+': AI '+d.ai+', faol '+d.active+'"><em>'+(d.ai||'')+'</em><div class="col"><i class="a" style="height:'+(d.ai/mx*100)+'%"></i><i class="b" style="height:'+(d.active/mx*100)+'%"></i></div><span>'+esc(d.day.slice(8))+'</span></div>').join('')+'</div><div class="legend"><span><i style="background:var(--cy)"></i>AI so‘rovlar</span><span><i style="background:var(--mg)"></i>Faol foydalanuvchilar</span></div>';
  const row=(u,r)=>'<div class="rank"><div class="u">'+av(u)+'<div>'+esc(u.name||'—')+'<small>'+esc(u.email)+'</small></div></div><b>'+r+'</b></div>';
  $('#top').innerHTML=s.top.map(u=>row(u,u.aiTotal)).join('')||'<div class="note">Hali yo‘q</div>';
  $('#recent').innerHTML=s.recent.map(u=>row(u,'<span class="note">'+ago(u.createdAt)+'</span>')).join('')||'<div class="note">Hali yo‘q</div>';
}
/* ---------- foydalanuvchilar ---------- */
async function loadUsers(){usersCache=(await api('users')).users;drawUsers();}
function drawUsers(){
  const q=$('#uq').value.trim().toLowerCase();const list=usersCache.filter(u=>!q||((u.name||'')+' '+(u.email||'')).toLowerCase().includes(q));
  $('#ucount').textContent=list.length+' / '+usersCache.length+' ta';
  $('#utab').innerHTML='<thead><tr><th>Foydalanuvchi</th><th>Qo‘shilgan</th><th>Oxirgi faollik</th><th>Kirishlar</th><th>AI bugun</th><th>Kunlik limit</th><th>AI jami</th><th>Holat</th><th>Amallar</th></tr></thead><tbody>'+list.map(u=>{
    const on=Date.now()-(u.lastSeen||0)<6*60e3;
    return '<tr data-uid="'+esc(u.uid)+'"><td><div class="u">'+av(u)+'<div>'+esc(u.name||'—')+'<small>'+esc(u.email)+'</small></div></div></td><td>'+dt(u.createdAt)+'</td><td title="'+dt(u.lastSeen)+'">'+(on?'<span class="tag on">onlayn</span>':ago(u.lastSeen))+'</td><td>'+(u.loginCount||0)+'</td><td>'+u.aiToday+' / '+u.limit+'</td>'
    +'<td><input type="number" class="lim" min="0" value="'+(typeof u.dailyLimit==='number'?u.dailyLimit:'')+'" placeholder="'+u.limit+'" title="Bo‘sh = umumiy limit"></td><td>'+(u.aiTotal||0)+'</td><td>'+(u.blocked?'<span class="tag bad">bloklangan</span>':'<span class="tag ok">faol</span>')+'</td>'
    +'<td><div class="act"><button class="btn sm" data-a="lim">Limit</button><button class="btn sm" data-a="reset">Bugun 0</button><button class="btn sm '+(u.blocked?'':'danger')+'" data-a="blk">'+(u.blocked?'Ochish':'Bloklash')+'</button><button class="btn sm danger" data-a="del">O‘chirish</button></div></td></tr>';}).join('')+'</tbody>';
}
$('#uq').oninput=drawUsers;$('#uref').onclick=()=>loadUsers().catch(e=>toast(e.message,true));
$('#utab').onclick=async e=>{const b=e.target.closest('button[data-a]');if(!b)return;const tr=b.closest('tr'),uid=tr.dataset.uid,u=usersCache.find(x=>x.uid===uid);
  try{
    if(b.dataset.a==='blk'){if(!u.blocked&&!confirm(u.email+' bloklansinmi?'))return;await api('userUpdate',{uid,blocked:!u.blocked});toast(u.blocked?'Blok ochildi':'Bloklandi');}
    else if(b.dataset.a==='lim'){const v=tr.querySelector('.lim').value;await api('userUpdate',{uid,dailyLimit:v===''?null:+v});toast('Limit saqlandi');}
    else if(b.dataset.a==='reset'){await api('userUpdate',{uid,resetToday:true});toast('Bugungi hisob nolga tushdi');}
    else if(b.dataset.a==='del'){if(!confirm(u.email+' butunlay o‘chirilsinmi? (u qayta kira oladi)'))return;await api('userDelete',{uid});toast('O‘chirildi');}
    await loadUsers();}catch(err){toast(err.message,true);}};
$('#ucsv').onclick=()=>{const rows=[['ism','email','qoshilgan','oxirgi_faollik','kirishlar','ai_jami','holat']].concat(usersCache.map(u=>[u.name,u.email,dt(u.createdAt),dt(u.lastSeen),u.loginCount||0,u.aiTotal||0,u.blocked?'bloklangan':'faol']));
  const csv=rows.map(r=>r.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'}));a.download='foydalanuvchilar.csv';a.click();};
/* ---------- loglar ---------- */
async function loadLogs(){const j=await api('logs',{limit:150});
  $('#ltab').innerHTML='<thead><tr><th>Vaqt</th><th>Foydalanuvchi</th><th>Natija</th><th>Mavzu / masala</th><th>Model</th><th>Vaqt, ms</th></tr></thead><tbody>'+j.logs.map(l=>'<tr><td>'+dt(l.ts)+'</td><td>'+esc(l.name||'')+'<br><small class="note">'+esc(l.email||'')+'</small></td><td>'+(l.ok?'<span class="tag ok">OK</span>':'<span class="tag bad">xato</span>')+(l.error?'<br><small class="note">'+esc(l.error)+'</small>':'')+(l.animError?'<br><small class="note">🎬 '+esc(l.animError)+'</small>':'')+'</td><td><b>'+esc(l.title||'')+'</b> <small class="note">'+esc(l.topic||'')+'</small><br><small class="note">'+esc((l.q||'').slice(0,140))+(l.hasImage?' 🖼':'')+'</small></td><td>'+esc(l.model||'')+'</td><td>'+(l.ms||'')+'</td></tr>').join('')+'</tbody>';}
$('#lref').onclick=()=>loadLogs().catch(e=>toast(e.message,true));
$('#lclr').onclick=async()=>{if(!confirm('Barcha AI so‘rovlar tarixi o‘chirilsinmi?'))return;try{const j=await api('logsClear');toast(j.deleted+' ta yozuv o‘chirildi');await loadLogs();}catch(e){toast(e.message,true);}};
/* ---------- sozlamalar ---------- */
const sw=(id,on)=>'<label class="sw"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span></span></label>';
async function loadSet(){const {settings:s,keys}=await api('settings');
  $('#setForm').innerHTML=
  '<div class="setrow"><div><b>AI yechuvchi yoqilgan</b><small>O‘chirilsa, hech kim AI dan foydalana olmaydi.</small></div>'+sw('sAi',s.aiEnabled)+'</div>'
  +'<div class="setrow"><div><b>Texnik ishlar rejimi</b><small>Yoqilsa, foydalanuvchilar saytga kira olmaydi (admin panel ishlaydi).</small></div>'+sw('sMt',s.maintenance)+'</div>'
  +'<div class="setrow"><div><b>Yangi foydalanuvchilarni qabul qilish</b><small>O‘chirilsa, faqat avval ro‘yxatdan o‘tganlar kira oladi.</small></div>'+sw('sReg',s.registrationOpen)+'</div>'
  +'<div class="setrow"><div><b>Har bir foydalanuvchiga kunlik AI limiti</b><small>Alohida foydalanuvchi uchun «Foydalanuvchilar» bo‘limida o‘zgartiriladi.</small></div><input type="number" id="sLim" min="0" value="'+s.dailyLimit+'"></div>'
  +'<div class="setrow"><div><b>Butun sayt bo‘yicha kunlik AI limiti</b><small>0 = cheklanmagan. Bepul Gemini kvotasini himoya qiladi.</small></div><input type="number" id="sCap" min="0" value="'+s.globalDailyCap+'"></div>'
  +'<div class="setrow" style="grid-template-columns:1fr"><div><b>Gemini modellari (ketma-ketlik bilan)</b><small>Birinchisi ishlamasa, keyingisi sinaladi. Model nomlari vaqt o‘tishi bilan yangilanadi — <a href="https://ai.google.dev/gemini-api/docs/models" target="_blank" rel="noopener" style="color:var(--cy)">ro‘yxat</a>. Serverda sozlangan API kalitlar: <b>'+keys+'</b> ta.</small></div><input type="text" id="sMod" value="'+esc(s.models.join(', '))+'"></div>'
  +'<div class="setrow" style="grid-template-columns:1fr"><div><b>Texnik ishlar xabari</b></div><input type="text" id="sMsg" value="'+esc(s.maintenanceMessage||'')+'"></div>'
  +'<button class="btn pri" id="sSave" style="margin-top:8px">Saqlash</button>';
  $('#sSave').onclick=async()=>{try{await api('settingsSave',{aiEnabled:$('#sAi').checked,maintenance:$('#sMt').checked,registrationOpen:$('#sReg').checked,dailyLimit:+$('#sLim').value,globalDailyCap:+$('#sCap').value,models:$('#sMod').value,maintenanceMessage:$('#sMsg').value});toast('Saqlandi ✓');}catch(e){toast(e.message,true);}};}
/* ---------- parol ---------- */
$('#pBtn').onclick=async()=>{const n=$('#pNew').value;if(n!==$('#pNew2').value){$('#pMsg').textContent='Yangi parollar bir xil emas.';return;}
  try{await api('password',{currentPassword:$('#pCur').value,newPassword:n});$('#pMsg').textContent='Parol almashtirildi ✓';['#pCur','#pNew','#pNew2'].forEach(s=>$(s).value='');}catch(e){$('#pMsg').textContent=e.message;}};
/* ---------- boshlash ---------- */
api('session').then(()=>enter()).catch(()=>showLogin());
})();
