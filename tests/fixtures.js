/* PDF dagi haqiqiy masalalar uchun qo'lda yozilgan "AI javoblari" (testlar va brauzer sinovi uchun) */
const g=(id,sym,name,value,unit,si,siUnit,extra)=>Object.assign({id,sym,name,value,unit,si,siUnit},extra||{});
const st=(id,title,eq,sym,name,unit,expr,explain)=>({id,title,eq,sym,name,unit,expr,explain:explain||''});
module.exports=[
{name:'1-masala: o‘rtacha tezlik (12 km/soat)',expect:[12],book:'vo‘rt=12 km/soat',text:'Velosipedchi balandlikka v1=10 km/soat tezlik bilan ko‘tariladi, pastga esa v2=15 km/soat tezlik bilan tushdi. O‘rtacha tezligi nimaga teng?',
 plan:{title:'Velosipedchining o‘rtacha tezligi',topic:'t6_motion',topicName:'Kinematika — o‘rtacha tezlik',statement:'Velosipedchi balandlikka 10 km/soat bilan ko‘tariladi, pastga 15 km/soat bilan tushdi. O‘rtacha tezlik?',
  given:[g('v1','υ₁','ko‘tarilish tezligi',10,'km/soat','10/3.6','m/s'),g('v2','υ₂','tushish tezligi',15,'km/soat','15/3.6','m/s'),g('S','S','bir yo‘nalishdagi yo‘l',1000,'m','1000','m',{assumed:true,note:'S qisqarib ketadi'})],
  steps:[st('t1','Ko‘tarilish vaqti','t₁ = S / υ₁','t₁','vaqt','s','S/v1'),st('t2','Tushish vaqti','t₂ = S / υ₂','t₂','vaqt','s','S/v2'),st('vavg','O‘rtacha tezlik','υ_o‘rt = 2S / (t₁+t₂)','υ_o‘rt','o‘rtacha tezlik','m/s','2*S/(t1+t2)','O‘rtacha tezlik = butun yo‘l / butun vaqt, tezliklarning o‘rtachasi emas.')],
  answers:[{id:'vavg',sym:'υ_o‘rt',name:'o‘rtacha tezlik',unit:'km/soat',show:'val*3.6'}],
  anim:{kind:'scene',scene:{duration:'t1+t2',view:{x0:'-S*0.08',x1:'S*1.08',y0:-1,y1:4},
   objects:[{type:'ruler',y:0.4,x0:0,x1:'S',step:'S/5',unit:'m'},{type:'dot',x:'if(ts<t1, v1*ts, S-v2*(ts-t1))',y:1.6,r:9,color:'cy',label:'velosipedchi'},
    {type:'hud',sx:0.03,sy:0.12,text:'υ = {if(ts<t1, v1, v2)*3.6|1} km/soat',color:'am'},{type:'hud',sx:0.03,sy:0.2,text:'o‘tilgan yo‘l = {if(ts<t1, v1*ts, S+v2*(ts-t1))|0} m',color:'li'}],
   graphs:[{title:'Tezlik',ylabel:'υ, m/s',series:[{y:'if(ts<t1, v1, v2)',color:'cy',label:'υ'}]}],captions:[{from:0,to:'t1',text:'Ko‘tarilish'},{from:'t1',to:'t1+t2',text:'Tushish'}]}}}},
{name:'2-masala: murakkab o‘rtacha tezlik (13,1 km/soat)',expect:[13.09],plan:{title:'Velosipedchining butun yo‘ldagi o‘rtacha tezligi',topic:'t6_motion',topicName:'O‘rtacha tezlik',statement:'…',
  given:[g('S','S','butun yo‘l',1000,'m','1000','m',{assumed:true}),g('va','υ_a','1-yarim yo‘l tezligi',24,'km/soat','24/3.6','m/s'),g('vb','υ_b','vaqtning 1-yarmidagi tezlik',12,'km/soat','12/3.6','m/s'),g('vc','υ_c','vaqtning 2-yarmidagi tezlik',6,'km/soat','6/3.6','m/s')],
  steps:[st('t1','1-yarim yo‘l vaqti','t₁ = (S/2)/υ_a','t₁','vaqt','s','(S/2)/va'),st('t2','Qolgan yo‘l vaqti','S/2 = (υ_b+υ_c)·t₂/2','t₂','vaqt','s','(S/2)/((vb+vc)/2)'),st('vavg','O‘rtacha tezlik','υ_o‘rt = S/(t₁+t₂)','υ_o‘rt','tezlik','m/s','S/(t1+t2)')],
  answers:[{id:'vavg',sym:'υ_o‘rt',name:'o‘rtacha tezlik',unit:'km/soat',show:'val*3.6'}],anim:null}},
{name:'3-masala: samolyot (6,7 m/s²; 1500 m; 100 m/s)',expect:[6.667,1500,100],plan:{title:'Samolyotning tezlanishi',topic:'t7_kin',topicName:'Kinematika',statement:'…',
  given:[g('v0','υ₀','boshlang‘ich tezlik',180,'km/soat','180/3.6','m/s'),g('v','υ','oxirgi tezlik',540,'km/soat','540/3.6','m/s'),g('t','t','vaqt',15,'s','15','s')],
  steps:[st('a','Tezlanish','a = (υ−υ₀)/t','a','tezlanish','m/s²','(v-v0)/t'),st('S','Yo‘l','S = (υ₀+υ)t/2','S','yo‘l','m','(v0+v)/2*t'),st('vavg','O‘rtacha tezlik','υ_o‘rt = S/t','υ_o‘rt','tezlik','m/s','S/t')],
  answers:[{id:'a',sym:'a',name:'tezlanish',unit:'m/s²'},{id:'S',sym:'S',name:'yo‘l',unit:'m'},{id:'vavg',sym:'υ_o‘rt',name:'o‘rtacha tezlik',unit:'m/s'}],
  anim:{kind:'scene',scene:{duration:'t',view:{x0:'-S*0.05',x1:'S*1.08',y0:-1,y1:4},objects:[{type:'ground',y:0.6},{type:'ruler',y:0.2,x0:0,x1:'S',step:'S/5',unit:'m'},{type:'box',x:'v0*ts+a*ts^2/2',y:1.4,w:54,h:18,color:'cy',label:'samolyot'},{type:'trail',x:'v0*ts+a*ts^2/2',y:1.4,color:'cy'},{type:'hud',sx:0.03,sy:0.12,text:'υ = {v0+a*ts|1} m/s',color:'am'}],
   graphs:[{title:'υ(t)',ylabel:'m/s',series:[{y:'v0+a*ts',color:'am',label:'υ'}]},{title:'S(t)',ylabel:'m',series:[{y:'v0*ts+a*ts^2/2',color:'li',label:'S'}]}]}}}},
{name:'11-masala: tormozlanish yo‘li (20 m)',expect:[20],plan:{title:'Tormozlanish yo‘li',topic:'t7_kin',topicName:'Kinematika',statement:'…',
  given:[g('v0','υ₀','boshlang‘ich tezlik',20,'m/s','20','m/s'),g('t','t','to‘xtash vaqti',2,'s','2','s')],
  steps:[st('a','Tezlanish (to‘xtash: υ=0)','a = −υ₀/t','a','tezlanish','m/s²','-v0/t'),st('S','Tormozlanish yo‘li','S = υ₀t + at²/2','S','yo‘l','m','v0*t+a*t^2/2')],answers:[{id:'S',sym:'S',name:'yo‘l',unit:'m'}],
  anim:{kind:'scene',scene:{duration:'t',view:{x0:-3,x1:'S*1.15',y0:-1,y1:4},objects:[{type:'ground',y:0.6},{type:'box',x:'v0*ts+a*ts^2/2',y:1.4,w:46,h:20,color:'mg',label:'avtomobil'},{type:'arrow',x:'v0*ts+a*ts^2/2',y:2.4,dx:'(v0+a*ts)*3',dy:0,color:'am'}],graphs:[{title:'υ(t)',series:[{y:'v0+a*ts',color:'am',label:'υ'}]}]}}}}
];
