'use strict';
/* Ko'rsatma ichidagi namuna. Testlarda ham tekshiriladi — shuning uchun doim yaroqli. */
module.exports={
 title:'Ikki avtomobil tezliklarining tenglashishi',topic:'t7_kin',topicName:'Kinematika — tekis o‘zgaruvchan harakat',
 statement:'Bir avtomobil 4 m/s boshlang‘ich tezlik va 0,3 m/s² tezlanish bilan tekis tezlanuvchan, ikkinchisi 12 m/s boshlang‘ich tezlik va −0,5 m/s² tezlanish bilan tekis sekinlanuvchan harakat qilmoqda. Avtomobillar qancha vaqtdan keyin bir xil tezlikka ega bo‘ladi? Shu vaqt ichida har biri qancha yo‘l bosadi?',
 given:[
  {id:'v01',sym:'υ₀₁',name:'1-avtomobilning boshlang‘ich tezligi',value:4,unit:'m/s',si:'4',siUnit:'m/s'},
  {id:'a1',sym:'a₁',name:'1-avtomobilning tezlanishi',value:0.3,unit:'m/s²',si:'0.3',siUnit:'m/s²'},
  {id:'v02',sym:'υ₀₂',name:'2-avtomobilning boshlang‘ich tezligi',value:12,unit:'m/s',si:'12',siUnit:'m/s'},
  {id:'a2',sym:'a₂',name:'2-avtomobilning tezlanishi (sekinlanish)',value:-0.5,unit:'m/s²',si:'-0.5',siUnit:'m/s²'}],
 steps:[
  {id:'t',title:'Tezliklar tenglashadigan vaqt',explain:'υ₁ = υ₂ shartidan: υ₀₁ + a₁t = υ₀₂ + a₂t.',eq:'t = (υ₀₂ − υ₀₁) / (a₁ − a₂)',sym:'t',name:'vaqt',unit:'s',expr:'(v02-v01)/(a1-a2)',value:10},
  {id:'v',title:'Umumiy tezlik',explain:'Topilgan t ni 1-avtomobil tezlik formulasiga qo‘yamiz.',eq:'υ = υ₀₁ + a₁t',sym:'υ',name:'tenglashgan tezlik',unit:'m/s',expr:'v01+a1*t',value:7},
  {id:'S1',title:'1-avtomobil bosgan yo‘l',explain:'Tekis o‘zgaruvchan harakatda yo‘l formulasi.',eq:'S₁ = υ₀₁t + a₁t²/2',sym:'S₁',name:'1-avtomobil yo‘li',unit:'m',expr:'v01*t+a1*t^2/2',value:55},
  {id:'S2',title:'2-avtomobil bosgan yo‘l',explain:'Xuddi shu formula, a₂ manfiy.',eq:'S₂ = υ₀₂t + a₂t²/2',sym:'S₂',name:'2-avtomobil yo‘li',unit:'m',expr:'v02*t+a2*t^2/2',value:95}],
 answers:[{id:'t',sym:'t',name:'vaqt',unit:'s'},{id:'v',sym:'υ',name:'tezlik',unit:'m/s'},{id:'S1',sym:'S₁',name:'1-avtomobil yo‘li',unit:'m'},{id:'S2',sym:'S₂',name:'2-avtomobil yo‘li',unit:'m'}],
 notes:'Natija kitob javobi bilan mos.',
 anim:{kind:'scene',scene:{duration:'t',playSeconds:9,view:{x0:'-6',x1:'S2*1.1',y0:'-0.5',y1:'6.5'},
  objects:[
   {type:'ground',y:0.9},
   {type:'ruler',y:0.3,x0:0,x1:'S2',step:'S2/5',unit:'m'},
   {type:'box',x:'v01*ts+a1*ts^2/2',y:2.2,w:50,h:22,color:'cy',label:'1-avto'},
   {type:'box',x:'v02*ts+a2*ts^2/2',y:4.4,w:50,h:22,color:'mg',label:'2-avto'},
   {type:'trail',x:'v01*ts+a1*ts^2/2',y:2.2,color:'cy'},
   {type:'trail',x:'v02*ts+a2*ts^2/2',y:4.4,color:'mg'},
   {type:'hud',sx:0.03,sy:0.1,text:'υ₁ = {v01+a1*ts|2} m/s   S₁ = {v01*ts+a1*ts^2/2|1} m',color:'cy'},
   {type:'hud',sx:0.03,sy:0.18,text:'υ₂ = {v02+a2*ts|2} m/s   S₂ = {v02*ts+a2*ts^2/2|1} m',color:'mg'}],
  graphs:[{title:'Tezlik grafigi',ylabel:'υ, m/s',series:[{y:'v01+a1*ts',color:'cy',label:'υ₁'},{y:'v02+a2*ts',color:'mg',label:'υ₂'}]}],
  captions:[{from:0,to:'t*0.98',text:'Tezliklar tenglashmoqda…'},{from:'t*0.98',to:'t',text:'υ₁ = υ₂ = 7 m/s'}]}}
};
