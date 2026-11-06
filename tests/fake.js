/* Firestore / Auth soxta (in-memory) — faqat test uchun */
const Module=require('module'),path=require('path');
const store=new Map();let mutex=Promise.resolve();
const FieldValue={increment:n=>({__inc:n}),delete:()=>({__del:true})};
function apply(old,upd,merge){const o=merge&&old?{...old}:{};for(const k in upd){const v=upd[k];if(v&&v.__inc!==undefined)o[k]=(o[k]||0)+v.__inc;else if(v&&v.__del)delete o[k];else o[k]=v;}return o;}
const snap=(p,id)=>{const d=store.get(p);return {id,exists:d!==undefined,ref:ref(p,id),data:()=>d?{...d}:undefined,get:f=>d?d[f]:undefined};};
const ref=(p,id)=>({id,path:p,get:async()=>snap(p,id),set:async(o,opt)=>{store.set(p,apply(store.get(p),o,opt&&opt.merge));},delete:async()=>{store.delete(p);}});
function query(col,filters=[],order=null,lim=null){
  const run=()=>{let rows=[...store.keys()].filter(k=>k.startsWith(col+'/')&&!k.slice(col.length+1).includes('/')).map(k=>({k,d:store.get(k)}));
    for(const [f,op,v] of filters)rows=rows.filter(r=>op==='=='?r.d[f]===v:op==='>='?(r.d[f]||0)>=v:true);
    if(order)rows.sort((a,b)=>{const x=a.d[order[0]]||0,y=b.d[order[0]]||0;return order[1]==='desc'?y-x:x-y;});
    if(lim)rows=rows.slice(0,lim);return rows.map(r=>snap(r.k,r.k.slice(col.length+1)));};
  const q={where:(f,op,v)=>query(col,[...filters,[f,op,v]],order,lim),orderBy:(f,dir)=>query(col,filters,[f,dir||'asc'],lim),limit:n=>query(col,filters,order,n),
    get:async()=>{const docs=run();return {docs,size:docs.length,empty:!docs.length};},count:()=>({get:async()=>({data:()=>({count:run().length})})})};return q;}
let auto=0;
const db={collection:name=>({doc:id=>ref(name+'/'+id,id),add:async o=>{const id='auto'+(++auto);store.set(name+'/'+id,{...o});return ref(name+'/'+id,id);},...query(name)}),
  getAll:async(...refs)=>refs.map(r=>snap(r.path,r.id)),
  batch:()=>{const ops=[];return {delete:r=>ops.push(r),commit:async()=>{ops.forEach(r=>store.delete(r.path));}};},
  runTransaction:fn=>{const run=mutex.then(async()=>{const tx={get:async x=>x.get?x.get():x,set:(r,o,opt)=>{store.set(r.path,apply(store.get(r.path),o,opt&&opt.merge));},delete:r=>store.delete(r.path)};return fn(tx);});mutex=run.catch(()=>{});return run;}};
const tokens=new Map(),authUsers=new Map();
const auth={verifyIdToken:async t=>{const u=tokens.get(t);if(!u)throw new Error('bad token');return {uid:u.uid,email:u.email,name:u.name,picture:'',email_verified:true};},
  updateUser:async(uid,o)=>{authUsers.set(uid,{...(authUsers.get(uid)||{}),...o});},revokeRefreshTokens:async()=>{},deleteUser:async uid=>{authUsers.delete(uid);}};
const fb={db:()=>db,auth:()=>auth,FieldValue};
const target=path.join(__dirname,'..','api','_lib','firebase.js');
require.cache[target]={id:target,filename:target,loaded:true,exports:fb};
module.exports={store,tokens,authUsers,db};
