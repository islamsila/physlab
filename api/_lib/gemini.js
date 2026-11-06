'use strict';
/* Google Gemini REST (bepul daraja). Modellar ro'yxati admin paneldan o'zgartiriladi.
   Muhim: Gemini 3.x modellari standart holatda uzoq "o'ylaydi" (thinking) — bu so'rovni 45+ soniyaga cho'zadi va
   javob token limitini yeb qo'yadi. Shuning uchun thinkingLevel ochiq beriladi, temperature esa Google tavsiyasiga ko'ra
   standart (1.0) qoldiriladi (past temperature Gemini 3 da aylanib qolish/sifat pasayishiga olib kelishi mumkin). */

/* GEMINI_API_KEYS="k1,k2"  yoki  GEMINI_API_KEY=k1 + GEMINI_API_KEY_2=k2 (GEMINI_API_KEY2, ...) — hammasi qabul qilinadi */
function keys(){
  const out=[];
  Object.keys(process.env).filter(k=>/^GEMINI_API_KEYS?(?:_?\d+)?$/i.test(k)).sort().forEach(k=>{
    String(process.env[k]||'').split(/[\s,;]+/).forEach(x=>{x=x.replace(/^["']|["']$/g,'').trim();if(x&&!out.includes(x))out.push(x);});});
  return out;
}
class GeminiError extends Error{constructor(m,status,code){super(m);this.status=status;this.code=code;}}
const LEVELS=['minimal','low','medium','high'];
const BUDGET={minimal:0,low:1024,medium:4096,high:8192};
/* Model avlodiga qarab "thinking" sozlamasi */
function thinkingFor(model,level){
  if(!LEVELS.includes(level))return null;
  if(/^gemini-(?:[3-9]|\d{2,})/.test(model))return {thinkingLevel:level};
  if(/^gemini-2\.5/.test(model)){const b=BUDGET[level];return {thinkingBudget:/pro/.test(model)?Math.max(b,512):b};}
  return null;
}
async function call(model,key,body,timeoutMs){
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
  let r;
  try{r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(timeoutMs)});}
  catch(e){throw new GeminiError(e.name==='TimeoutError'?'AI javobi juda sekin keldi':'AI serveriga ulanib bo‘lmadi',504,'timeout');}
  let j=null;try{j=await r.json();}catch(e){}
  if(!r.ok){const msg=(j&&j.error&&j.error.message)||('HTTP '+r.status);
    throw new GeminiError(msg.slice(0,300),r.status,r.status===429?'rate':(r.status===404?'model':(r.status===400&&/thinking/i.test(msg)?'thinking':'http')));}
  const c=j&&j.candidates&&j.candidates[0];
  if(!c){const br=j&&j.promptFeedback&&j.promptFeedback.blockReason;throw new GeminiError(br?'AI so‘rovni rad etdi: '+br:'AI bo‘sh javob qaytardi',502,'empty');}
  const text=((c.content&&c.content.parts)||[]).filter(p=>!p.thought).map(p=>p.text||'').join('');
  if(c.finishReason==='MAX_TOKENS')throw new GeminiError('AI javobi uzilib qoldi (token limiti)',502,'truncated');
  if(!text.trim())throw new GeminiError('AI bo‘sh javob qaytardi ('+(c.finishReason||'?')+')',502,'empty');
  return {text,finish:c.finishReason};
}
let rr=0;
/* contents: Gemini "contents" massivi. Modellar va kalitlar bo'yicha ketma-ket urinadi.
   thinking: 'minimal'|'low'|'medium'|'high'. perCall: bitta so'rov uchun maksimal ms. */
async function generate({models,system,contents,deadline,thinking,maxTokens,perCall}){
  const ks=keys();if(!ks.length)throw new GeminiError('Serverda GEMINI_API_KEY sozlanmagan',500,'nokey');
  const start=(rr++)%ks.length,order=ks.map((_,i)=>ks[(start+i)%ks.length]);   // kalitlar navbat bilan ishlatiladi
  let last=null;
  for(const model of models){
    let nextModel=false;
    for(const key of order){
      if(nextModel)break;
      let useThink=true,retried=false;
      for(;;){
        const left=deadline-Date.now();if(left<4000)throw last||new GeminiError('Vaqt tugadi',504,'timeout');
        const gc={responseMimeType:'application/json',maxOutputTokens:maxTokens||12000};
        const th=useThink?thinkingFor(model,thinking):null;if(th)gc.thinkingConfig=th;
        try{
          const out=await call(model,key,{systemInstruction:{parts:[{text:system}]},contents,generationConfig:gc},Math.min(left-500,perCall||50000));
          return Object.assign(out,{model});
        }catch(e){
          last=e;
          if(e.code==='thinking'&&useThink){useThink=false;continue;}                 // model thinking sozlamasini qabul qilmadi — usiz qayta
          if(e.code==='rate')break;                                                    // kvota tugadi — boshqa kalit
          if((e.status===500||e.status===502||e.status===503)&&e.code!=='truncated'&&e.code!=='empty'&&!retried&&deadline-Date.now()>9000){retried=true;await new Promise(r=>setTimeout(r,900));continue;} // band — bir marta qayta
          if(e.status===401||e.status===403){if(ks.length>1)break;throw new GeminiError('GEMINI_API_KEY yaroqsiz yoki ruxsat yo‘q',500,'badkey');}
          nextModel=true;break;                                                        // model yo'q / sekin / javob buzuq — keyingi model
        }
      }
    }
  }
  throw last||new GeminiError('AI ishlamadi',502,'fail');
}
function parseJson(text){
  let s=String(text).trim();s=s.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
  const tries=[s];const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)tries.push(s.slice(a,b+1));
  let err=null;
  for(const t of tries){for(const x of [t,t.replace(/,\s*([}\]])/g,'$1')]){try{return JSON.parse(x);}catch(e){err=err||e;}}}
  throw err;
}
module.exports={generate,parseJson,GeminiError,keys,thinkingFor,LEVELS};
