const assert=require('assert');const fake=require('./fake');
const path=require('path');const R=p=>path.join(__dirname,'..',p);
const SE=require(R('js/safeexpr.js')),Plan=require(R('js/plan.js'));
let pass=0,fail=0;const T=async(name,fn)=>{try{await fn();pass++;console.log('  ✓',name);}catch(e){fail++;console.log('  ✗',name,'\n     ',e.message.split('\n')[0]);}};
const near=(a,b,tol=1e-6)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),a+' ≈ '+b);
(async()=>{
console.log('SafeExpr');
await T('arifmetika va ustuvorlik',()=>{near(SE.evaluate('2+3*4^2/8-1',{}),7);near(SE.evaluate('-2^2',{}),-4);near(SE.evaluate('2^-1',{}),.5);near(SE.evaluate('2^3^2',{}),512);near(SE.evaluate('1.5e-3*2',{}),3e-3);near(SE.evaluate('10 % 4',{}),2);});
await T('funksiyalar, if, taqqoslash',()=>{near(SE.evaluate('sqrt(16)+sin(rad(90))+if(3>2,10,20)',{}),15);near(SE.evaluate('if(ts<2, ts*5, 10+ts)',{ts:1}),5);near(SE.evaluate('if(ts<2, ts*5, 10+ts)',{ts:3}),13);near(SE.evaluate('max(1,min(5,3))+clamp(9,0,2)',{}),5);near(SE.evaluate('2*pi',{}),2*Math.PI);near(SE.evaluate('pi',{pi:3}),3);});
await T('unicode ko‘paytirish belgisi',()=>near(SE.evaluate('3·4×2',{}),24));
for(const bad of ['constructor','a.b','process.exit(1)','x[0]','"a"','1;2','this','eval(1)','sin()','sin(1,2)','2 2','(1','toString(1)','__proto__','a=1','`x`','1 +']){
  await T('rad etiladi: '+bad,()=>{let ok=false;try{const v=SE.evaluate(bad,Object.create(null));ok=!Number.isFinite(v);}catch(e){ok=true;}assert(ok,'ruxsat berildi!');});}
await T('prototip identifikatorlari son bermaydi',()=>{const v=SE.evaluate('constructor+1',{});assert(Number.isNaN(v));assert(Number.isNaN(SE.evaluate('toString*2',{})));});
await T('juda uzun / chuqur ifoda',()=>{assert.throws(()=>SE.parse('1+'.repeat(300)+'1'));assert.throws(()=>SE.parse('('.repeat(80)+'1'+')'.repeat(80)));});

console.log('Plan');
const EX=require(R('api/_lib/example.js'));const catalog=require(R('api/_lib/catalog.json'));const ANIMS=new Set(catalog.anims.map(a=>a.name));
const clone=o=>JSON.parse(JSON.stringify(o));
await T('namuna yaroqli va kitob javobiga mos (10 s, 7 m/s, 55 m, 95 m)',()=>{const n=Plan.normalize(EX,{animNames:ANIMS});assert.deepStrictEqual([n.errors,n.sceneErrors],[[],[]]);const r=Plan.run(n.plan);assert.deepStrictEqual(r.errors,[]);
  [10,7,55,95].forEach((v,i)=>near(r.answers[i].shown,v));assert.deepStrictEqual(Plan.checkScene(n.plan,r),[]);});
await T('noma’lum id rad etiladi',()=>{const p=clone(EX);p.steps[0].expr='(v02-v01)/(a1-aX)';const n=Plan.normalize(p);assert(n.errors.some(e=>/aX/.test(e)));});
await T('takroriy id va zahiralangan nom',()=>{const p=clone(EX);p.steps[1].id='t';let n=Plan.normalize(p);assert(n.errors.length);const q=clone(EX);q.given[0].id='sin';n=Plan.normalize(q);assert(n.errors.some(e=>/id/.test(e)));const w=clone(EX);w.given[1].id='ts';assert(Plan.normalize(w).errors.length);});
await T('xavfli ifoda rad etiladi',()=>{const p=clone(EX);p.steps[0].expr='constructor.constructor("return 1")()';assert(Plan.normalize(p).errors.length);});
await T('AI hisobi noto‘g‘ri bo‘lsa — ogohlantirish va dastur qiymati',()=>{const p=clone(EX);p.steps[0].value=99;const n=Plan.normalize(p);const r=Plan.run(n.plan);assert(r.warnings.length===1);near(r.steps[0].value,10);});
await T('nolga bo‘lish aniqlanadi',()=>{const p=clone(EX);p.steps[0].expr='1/(a1-a1)';const n=Plan.normalize(p);const r=Plan.run(n.plan);assert(r.errors.length);});
await T('scene: noma’lum identifikator, NaN va yomon view',()=>{let p=clone(EX);p.anim.scene.objects[2].x='vv*ts';let n=Plan.normalize(p,{animNames:ANIMS});assert(n.sceneErrors.length);
  p=clone(EX);p.anim.scene.objects[2].x='ln(ts-5)';n=Plan.normalize(p,{animNames:ANIMS});assert.strictEqual(n.sceneErrors.length,0);assert(Plan.checkScene(n.plan,Plan.run(n.plan)).length>0);
  p=clone(EX);p.anim.scene.view.x1='-100';n=Plan.normalize(p,{animNames:ANIMS});assert(Plan.checkScene(n.plan,Plan.run(n.plan)).some(e=>/view/.test(e)));});
await T('scene: ruxsatsiz rang va shakl e’tiborga olinmaydi',()=>{const p=clone(EX);p.anim.scene.objects[2].color='url(javascript:alert(1))';p.anim.scene.objects.push({type:'script',x:1});const n=Plan.normalize(p,{animNames:ANIMS});assert.strictEqual(n.plan.anim.scene.objects[2].color,undefined);assert(!n.plan.anim.scene.objects.some(o=>o.type==='script'));});
await T('lib animatsiya: noma’lum nom rad etiladi',()=>{const p=clone(EX);p.anim={kind:'lib',name:'../../etc',params:[]};assert(Plan.normalize(p,{animNames:ANIMS}).sceneErrors.length);p.anim={kind:'lib',name:'series',params:[{k:'R1',v:'v01'}]};const n=Plan.normalize(p,{animNames:ANIMS});assert.strictEqual(n.plan.anim.kind,'lib');});

console.log('Haqiqiy PDF masalalari (AI o‘rniga qo‘lda yozilgan rejalar, kitob javobi bilan solishtirish)');
const fx=require('./fixtures');
for(const f of fx){await T(f.name,()=>{const n=Plan.normalize(f.plan,{animNames:ANIMS});assert.deepStrictEqual(n.errors,[],n.errors.join());assert.deepStrictEqual(n.sceneErrors,[],n.sceneErrors.join());const r=Plan.run(n.plan);assert.deepStrictEqual(r.errors,[]);
  assert.deepStrictEqual(Plan.checkScene(n.plan,r),[]);f.expect.forEach((v,i)=>near(r.answers[i].shown,v,.012));});}
module.exports.counts=()=>({pass,fail});
await require('./server.test')(T,assert,fake,{near,clone,EX});
console.log('\n'+pass+' ta o‘tdi, '+fail+' ta yiqildi');process.exit(fail?1:0);
})();
