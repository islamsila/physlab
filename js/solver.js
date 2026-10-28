/* Solver: forward-chaining over FORMULAS. Works in browser and Node. */
(function(root){
  const MATH = {sqrt:Math.sqrt,abs:Math.abs,sin:Math.sin,cos:Math.cos,asin:Math.asin,acos:Math.acos,exp:Math.exp,ln:Math.log,log2:Math.log2,
    rad:x=>x*Math.PI/180,deg:x=>x*180/Math.PI};
  const FN = new Set(Object.keys(MATH));
  const cache = new Map();
  function compile(expr){
    let c = cache.get(expr);
    if(!c){
      const ids = [...new Set((expr.match(/[A-Za-z_][A-Za-z0-9_]*/g)||[]).filter(x=>!FN.has(x)))];
      const js = expr.replace(/\^/g,'**');
      const fn = new Function('M','S', 'with(M){with(S){return ('+js+');}}');
      c = {ids, fn}; cache.set(expr,c);
    }
    return c;
  }
  function evalExpr(expr, scope){ const c=compile(expr); return c.fn(MATH, scope); }
  function fmt(x){
    if(!isFinite(x)) return String(x);
    if(x===0) return '0';
    const a=Math.abs(x);
    if(a>=1e6||a<1e-3){ let [m,e]=x.toExponential(4).split('e'); m=m.replace(/\.?0+$/,''); return m+'·10^'+(+e); }
    let s=parseFloat(x.toPrecision(6)).toString(); return s;
  }
  function substitute(expr, scope, keys){
    return expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, id=>{
      if(FN.has(id)) return id;
      if(id in scope){ const v=scope[id]; return (v<0?'('+fmt(v)+')':fmt(v)); }
      return id;
    }).replace(/rad\(([^()]*)\)/g,'$1°').replace(/deg\(/g,'(').replace(/\^2/g,'²').replace(/\^3/g,'³').replace(/\*/g,'·');
  }
  /**
   * givens: {key:valueSI}, finds:[key], opts:{topic, consts:{key:val}}
   * returns {ok, results:[{key,value,steps:[...]}], steps, error}
   */
  function solveCore(givens, finds, opts, restrict){
    opts=opts||{};
    const C=root.CONSTS;
    const F=restrict&&opts.topic?root.FORMULAS.filter(f=>f.topic===opts.topic):root.FORMULAS;
    const consts={}; for(const k in C) consts[k]=C[k].val;
    if(opts.consts) Object.assign(consts, opts.consts);
    // a constant that is asked for / not a given-constant becomes unknown
    const known=Object.assign({}, consts, givens);
    for(const f of finds){ if(f in consts && !(f in givens)) delete known[f]; }
    const via={}; // key -> {formula, target, round}
    const order=[];
    let changed=true, round=0;
    const need=finds.filter(f=>!(f in known));
    while(changed && need.some(f=>!(f in known))){
      changed=false; round++;
      const found=[];
      for(const f of F){
        for(const tgt in f.solve){
          if(tgt in known) continue;
          const c=compile(f.solve[tgt]);
          if(c.ids.every(i=>i in known)){
            found.push({f,tgt,pref:(opts.topic && f.topic===opts.topic)?0:1});
          }
        }
      }
      found.sort((a,b)=>a.pref-b.pref);
      const roundNew={};
      for(const x of found){
        if(x.tgt in known || x.tgt in roundNew) continue;
        let v;
        try{ v=evalExpr(x.f.solve[x.tgt], known); }catch(e){ continue; }
        if(typeof v!=='number'||!isFinite(v)||Number.isNaN(v)) continue;
        roundNew[x.tgt]={f:x.f,v};
      }
      for(const k in roundNew){ known[k]=roundNew[k].v; via[k]={formula:roundNew[k].f,target:k,round,value:roundNew[k].v}; order.push(k); changed=true; }
    }
    const missing=finds.filter(f=>!(f in known));
    if(missing.length) return {ok:false, missing, error:'cannot', known};
    // back-trace
    const used=new Set(), stepList=[];
    function trace(k){
      if(!(k in via)||used.has(k)) return;
      const v=via[k]; used.add(k);
      const c=compile(v.formula.solve[k]);
      c.ids.forEach(i=>{ if(!(i in givens) && !(i in consts)) trace(i); });
      stepList.push(k);
    }
    finds.forEach(trace);
    const steps=stepList.map(k=>{
      const v=via[k]; const expr=v.formula.solve[k]; const c=compile(expr);
      const scope={}; c.ids.forEach(i=>{ scope[i]=known[i]; });
      return {key:k, formula:v.formula, expr, value:v.value, inputs:c.ids, subst:substitute(expr,scope), scope};
    });
    const results=finds.map(k=>({key:k, value:known[k], given:(k in givens)}));
    return {ok:true, results, steps, known, consts};
  }
  function solve(givens, finds, opts){
    opts=opts||{};
    if(opts.topic){const r=solveCore(givens,finds,opts,true);if(r.ok)return r;}
    return solveCore(givens,finds,opts,false);
  }
  root.Solver={solve, fmt, evalExpr, compile, MATH};
  if(typeof module!=='undefined') module.exports=root.Solver;
})(typeof window!=='undefined'?window:globalThis);
