'use strict';
exports.send=(res,status,obj,headers)=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('cache-control','no-store');
  if(headers)for(const k in headers)res.setHeader(k,headers[k]);res.end(JSON.stringify(obj));};
exports.body=req=>{let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b);}catch(e){b=null;}}return(b&&typeof b==='object')?b:{};};
exports.ip=req=>String((req.headers['x-forwarded-for']||req.socket&&req.socket.remoteAddress||'')).split(',')[0].trim().slice(0,64);
exports.dayKey=(ms)=>new Date((ms||Date.now())+5*3600e3).toISOString().slice(0,10); // Toshkent kuni (UTC+5)
exports.sameOrigin=req=>{const o=req.headers.origin;if(!o)return true;try{const h=new URL(o).host;return h===req.headers.host;}catch(e){return false;}};
