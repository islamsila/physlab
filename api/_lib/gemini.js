'use strict';
/* Google Gemini REST (bepul daraja). Modellar ro'yxati admin paneldan o'zgartiriladi. */
function keys(){return String(process.env.GEMINI_API_KEYS||process.env.GEMINI_API_KEY||'').split(/[\s,]+/).filter(Boolean);}
class GeminiError extends Error{constructor(m,status,code){super(m);this.status=status;this.code=code;}}
async function call(model,key,body,timeoutMs){
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
  let r;
  try{r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(timeoutMs)});}
  catch(e){throw new GeminiError(e.name==='TimeoutError'?'AI javobi juda sekin keldi':'AI serveriga ulanib bo‘lmadi',504,'timeout');}
  let j=null;try{j=await r.json();}catch(e){}
  if(!r.ok){const msg=(j&&j.error&&j.error.message)||('HTTP '+r.status);throw new GeminiError(msg.slice(0,300),r.status,r.status===429?'rate':(r.status===404?'model':'http'));}
  const c=j&&j.candidates&&j.candidates[0];
  if(!c){const br=j&&j.promptFeedback&&j.promptFeedback.blockReason;throw new GeminiError(br?'AI so‘rovni rad etdi: '+br:'AI bo‘sh javob qaytardi',502,'empty');}
  const text=((c.content&&c.content.parts)||[]).map(p=>p.text||'').join('');
  if(!text.trim())throw new GeminiError('AI bo‘sh javob qaytardi ('+(c.finishReason||'?')+')',502,'empty');
  return {text,finish:c.finishReason};
}
/* contents: Gemini "contents" massivi. Modellar va kalitlar bo'yicha ketma-ket urinadi. */
async function generate({models,system,contents,deadline}){
  const ks=keys();if(!ks.length)throw new GeminiError('Serverda GEMINI_API_KEY sozlanmagan',500,'nokey');
  let last=null;
  for(const model of models){
    for(const key of ks){
      const left=deadline-Date.now();if(left<4000)throw last||new GeminiError('Vaqt tugadi',504,'timeout');
      try{
        const out=await call(model,key,{systemInstruction:{parts:[{text:system}]},contents,generationConfig:{temperature:0.2,responseMimeType:'application/json',maxOutputTokens:16000}},Math.min(left-500,45000));
        return Object.assign(out,{model});
      }catch(e){last=e;if(e.code==='rate')continue;      // boshqa kalit
        if(e.status===401||e.status===403){if(ks.length>1)continue;throw new GeminiError('GEMINI_API_KEY yaroqsiz yoki ruxsat yo‘q',500,'badkey');}
        break;}                                           // boshqa model
    }
  }
  throw last||new GeminiError('AI ishlamadi',502,'fail');
}
function parseJson(text){
  let s=String(text).trim();s=s.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
  try{return JSON.parse(s);}catch(e){const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(s.slice(a,b+1));throw e;}
}
module.exports={generate,parseJson,GeminiError,keys};
