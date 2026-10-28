/* SafeExpr — AI yozgan formulalarni XAVFSIZ hisoblaydi (eval / new Function ishlatilmaydi).
   Brauzerda ham, Node (server) da ham ishlaydi. */
(function(root){
'use strict';
const FUNCS={
  sqrt:Math.sqrt,abs:Math.abs,sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,atan2:Math.atan2,
  exp:Math.exp,ln:Math.log,log10:Math.log10,log2:Math.log2,pow:Math.pow,min:Math.min,max:Math.max,floor:Math.floor,ceil:Math.ceil,round:Math.round,sign:Math.sign,
  rad:x=>x*Math.PI/180,deg:x=>x*180/Math.PI,clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),mod:(a,b)=>a-b*Math.floor(a/b),
  'if':(c,a,b)=>(c?a:b),cbrt:Math.cbrt,sinh:Math.sinh,cosh:Math.cosh
};
const ARITY={sqrt:1,abs:1,sin:1,cos:1,tan:1,asin:1,acos:1,atan:1,atan2:2,exp:1,ln:1,log10:1,log2:1,pow:2,floor:1,ceil:1,round:1,sign:1,rad:1,deg:1,clamp:3,mod:2,'if':3,cbrt:1,sinh:1,cosh:1};
const BUILTIN={pi:Math.PI};
const MAXLEN=400,MAXDEPTH=40;
function tokenize(src){
  const s=String(src).replace(/[·×∙⋅]/g,'*').replace(/[−–]/g,'-').replace(/\*\*/g,'^');
  if(s.length>MAXLEN)throw new Error('ifoda juda uzun');
  const out=[];let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\s/.test(c)){i++;continue;}
    let m;
    if((m=/^(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(s.slice(i)))){out.push({k:'n',v:parseFloat(m[0])});i+=m[0].length;continue;}
    if((m=/^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i)))){out.push({k:'i',v:m[0]});i+=m[0].length;continue;}
    if((m=/^(<=|>=|==|!=|[-+*\/%^(),<>])/.exec(s.slice(i)))){out.push({k:'o',v:m[0]});i+=m[0].length;continue;}
    throw new Error('ruxsat etilmagan belgi: «'+c+'»');
  }
  return out;
}
function parse(src){
  const tk=tokenize(src);let p=0;
  const peek=()=>tk[p],isOp=v=>tk[p]&&tk[p].k==='o'&&tk[p].v===v;
  function expect(v){if(!isOp(v))throw new Error('«'+v+'» kutilgan edi');p++;}
  function cmp(d){let a=add(d);const t=peek();if(t&&t.k==='o'&&['<','>','<=','>=','==','!='].includes(t.v)){p++;const b=add(d);a={t:'b',op:t.v,a,b};}return a;}
  function add(d){let a=mul(d);while(isOp('+')||isOp('-')){const op=tk[p++].v;a={t:'b',op,a,b:mul(d)};}return a;}
  function mul(d){let a=unary(d);while(isOp('*')||isOp('/')||isOp('%')){const op=tk[p++].v;a={t:'b',op,a,b:unary(d)};}return a;}
  function unary(d){if(d>MAXDEPTH)throw new Error('ifoda juda murakkab');if(isOp('-')){p++;return {t:'u',op:'-',a:unary(d+1)};}if(isOp('+')){p++;return unary(d+1);}return pow(d);}
  function pow(d){const a=prim(d);if(isOp('^')){p++;return {t:'b',op:'^',a,b:unary(d+1)};}return a;}
  function prim(d){
    const t=tk[p++];if(!t)throw new Error('ifoda tugamagan');
    if(t.k==='n')return {t:'n',v:t.v};
    if(t.k==='i'){
      if(isOp('(')){p++;if(!Object.prototype.hasOwnProperty.call(FUNCS,t.v))throw new Error('noma’lum funksiya: '+t.v);const args=[];
        if(!isOp(')')){args.push(cmp(d+1));while(isOp(',')){p++;args.push(cmp(d+1));}}expect(')');
        if(t.v==='min'||t.v==='max'){if(args.length<2||args.length>6)throw new Error(t.v+'() 2..6 ta argument oladi');}else if(args.length!==ARITY[t.v])throw new Error(t.v+'() '+ARITY[t.v]+' ta argument oladi');return {t:'f',n:t.v,args};}
      return {t:'i',n:t.v};}
    if(t.k==='o'&&t.v==='('){const e=cmp(d+1);expect(')');return e;}
    throw new Error('kutilmagan belgi: «'+t.v+'»');
  }
  const ast=cmp(0);if(p<tk.length)throw new Error('ortiqcha belgi: «'+tk[p].v+'»');return ast;
}
function ids(ast,set){set=set||new Set();
  (function w(n){if(n.t==='i')set.add(n.n);else if(n.t==='u')w(n.a);else if(n.t==='b'){w(n.a);w(n.b);}else if(n.t==='f')n.args.forEach(w);})(ast);return set;}
function build(n){
  switch(n.t){
    case 'n':{const v=n.v;return()=>v;}
    case 'i':{const k=n.n;if(Object.prototype.hasOwnProperty.call(BUILTIN,k)){const b=BUILTIN[k];return s=>{const v=s[k];return typeof v==='number'?v:b;};}
      return s=>{const v=s[k];return typeof v==='number'?v:NaN;};}
    case 'u':{const a=build(n.a);return s=>-a(s);}
    case 'f':{const f=FUNCS[n.n],a=n.args.map(build);if(a.length>3)return s=>f(...a.map(x=>x(s)));if(a.length===1){const a0=a[0];return s=>f(a0(s));}if(a.length===2){const[a0,a1]=a;return s=>f(a0(s),a1(s));}const[a0,a1,a2]=a;return s=>f(a0(s),a1(s),a2(s));}
    case 'b':{const a=build(n.a),b=build(n.b);
      switch(n.op){case '+':return s=>a(s)+b(s);case '-':return s=>a(s)-b(s);case '*':return s=>a(s)*b(s);case '/':return s=>a(s)/b(s);case '%':return s=>{const x=a(s),y=b(s);return x-y*Math.floor(x/y);};
        case '^':return s=>Math.pow(a(s),b(s));case '<':return s=>a(s)<b(s)?1:0;case '>':return s=>a(s)>b(s)?1:0;case '<=':return s=>a(s)<=b(s)?1:0;case '>=':return s=>a(s)>=b(s)?1:0;
        case '==':return s=>Math.abs(a(s)-b(s))<1e-9?1:0;case '!=':return s=>Math.abs(a(s)-b(s))<1e-9?0:1;}}
  }
  throw new Error('ichki xato');
}
const cache=new Map();
function compile(src){
  src=String(src);let c=cache.get(src);
  if(!c){const ast=parse(src);c={ids:[...ids(ast)],fn:build(ast)};if(cache.size>2000)cache.clear();cache.set(src,c);}
  return c;
}
function evaluate(src,scope){return compile(src).fn(scope);}
const api={parse,compile,ids,evaluate,FUNCS,BUILTIN};
root.SafeExpr=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
