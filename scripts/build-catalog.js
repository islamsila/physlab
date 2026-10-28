/* api/_lib/catalog.json ni yaratadi: mavzular va tayyor animatsiyalar ro'yxati (AI ko'rsatmasi uchun).
   Formulalar/animatsiyalar o'zgarsa:  node scripts/build-catalog.js */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const ctx={window:{}};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of['vars','f6_7','f8_9','f10','f11'])vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),ctx,{filename:f});
const {TOPICS,FORMULAS,VARS}=ctx;
// animatsiya nomlari
const animNames=new Set();
for(const f of fs.readdirSync(path.join(root,'js')).filter(x=>/^anim_/.test(x))){
  const src=fs.readFileSync(path.join(root,'js',f),'utf8');for(const m of src.matchAll(/^A\.([A-Za-z0-9_]+)\s*=/gm))animNames.add(m[1]);}
animNames.delete('generic');
const byAnim={};
for(const f of FORMULAS){if(!animNames.has(f.anim))continue;const a=byAnim[f.anim]=byAnim[f.anim]||{name:f.anim,topics:new Set(),eqs:[],keys:new Set()};
  a.topics.add(f.topic);if(a.eqs.length<3)a.eqs.push(f.eq);
  for(const k in f.solve){a.keys.add(k);(f.solve[k].match(/[A-Za-z_][A-Za-z0-9_]*/g)||[]).forEach(i=>{if(VARS[i])a.keys.add(i);});}}
const anims=Object.values(byAnim).map(a=>({name:a.name,topics:[...a.topics],eqs:a.eqs,keys:[...a.keys]}));
const used=new Set();anims.forEach(a=>a.keys.forEach(k=>used.add(k)));
const vars={};used.forEach(k=>{if(VARS[k])vars[k]=[VARS[k][0],VARS[k][1],VARS[k][2]];});
const out={topics:TOPICS.map(t=>({id:t.id,g:t.g,uz:t.uz})),anims,vars};
fs.writeFileSync(path.join(root,'api','_lib','catalog.json'),JSON.stringify(out));
console.log('topics',out.topics.length,'anims',anims.length,'vars',Object.keys(vars).length,'bytes',fs.statSync(path.join(root,'api','_lib','catalog.json')).size);
