/* Formulalar: 6 va 7-sinf */
window.FORMULAS = window.FORMULAS || [];
window.F = function(id, topic, uz, ru, eq, anim, solve, extra){
  window.FORMULAS.push(Object.assign({id, topic, uz, ru, eq, anim, solve}, extra||{}));
};
// ---------- 6-sinf
F('density','t6_matter','Zichlik','Плотность','ρ = m / V','density',{rho:'m/V',m:'rho*V',V:'m/rho'});
F('uniform','t6_motion','To‘g‘ri chiziqli tekis harakat tezligi','Скорость равномерного движения','υ = s / t','motion',{v:'s/t',s:'v*t',t:'s/v'});
F('lever','t6_mech','Richag muvozanat sharti (Arximed qoidasi)','Условие равновесия рычага','F₁·l₁ = F₂·l₂','lever',{F1:'F2*d2/d1',F2:'F1*d1/d2',d1:'F2*d2/F1',d2:'F1*d1/F2'});
F('work','t6_mech','Mexanik ish','Механическая работа','A = F · s','work',{W:'F*s',F:'W/s',s:'W/F'});
F('power','t6_mech','Quvvat','Мощность','N = A / t','power',{Np:'W/t',W:'Np*t',t:'W/Np'});
F('eff','t6_mech','Foydali ish koeffitsiyenti','КПД','η = A_f / A_t · 100%','efficiency',{eta:'Wf/Wt*100',Wf:'eta*Wt/100',Wt:'Wf*100/eta'});
F('lens1','t6_lens','Yupqa linza formulasi','Формула тонкой линзы','1/F = 1/d + 1/f','lens',{Fo:'1/(1/d+1/f)',d:'1/(1/Fo-1/f)',f:'1/(1/Fo-1/d)'});
// ---------- 7-sinf
F('vavg','t6_motion','O‘rtacha tezlik','Средняя скорость','υ_o‘rt = s_umum / t_umum','motion',{vavg:'stot/ttot',stot:'vavg*ttot',ttot:'stot/vavg'});
F('acc','t7_kin','Tezlanish','Ускорение','a = (υ − υ₀) / t','accel',{a:'(v-v0)/t',v:'v0+a*t',v0:'v-a*t',t:'(v-v0)/a'});
F('path1','t7_kin','Tekis o‘zgaruvchan harakatda yo‘l','Путь при равнопеременном движении','s = υ₀t + at²/2','accel',{s:'v0*t+a*t*t/2',v0:'(s-a*t*t/2)/t',a:'2*(s-v0*t)/(t*t)'});
F('path2','t7_kin','Vaqtsiz yo‘l formulasi','Путь без времени','s = (υ² − υ₀²) / 2a','accel',{s:'(v*v-v0*v0)/(2*a)',v:'sqrt(v0*v0+2*a*s)',v0:'sqrt(v*v-2*a*s)',a:'(v*v-v0*v0)/(2*s)'});
F('per1','t7_circ','Aylanish davri','Период обращения','T = t / N','circular',{T:'t/Ncnt',t:'T*Ncnt',Ncnt:'t/T'});
F('freq1','t7_circ','Chastota','Частота','ν = N / t','circular',{nu:'Ncnt/t',Ncnt:'nu*t',t:'Ncnt/nu'});
F('freq2','t7_circ','Chastota va davr','Частота и период','ν = 1 / T','circular',{nu:'1/T',T:'1/nu'});
F('lin1','t7_circ','Chiziqli tezlik (chastota orqali)','Линейная скорость через частоту','υ = 2πRν','circular',{v:'2*pi*R*nu',R:'v/(2*pi*nu)',nu:'v/(2*pi*R)'});
F('lin2','t7_circ','Chiziqli tezlik (davr orqali)','Линейная скорость через период','υ = 2πR / T','circular',{v:'2*pi*R/T',R:'v*T/(2*pi)',T:'2*pi*R/v'});
F('lin3','t7_circ','Chiziqli va burchakli tezlik','Линейная и угловая скорость','υ = ωR','circular',{v:'omega*R',omega:'v/R',R:'v/omega'});
F('omg1','t7_circ','Burchak tezlik (davr orqali)','Угловая скорость через период','ω = 2π / T','circular',{omega:'2*pi/T',T:'2*pi/omega'});
F('omg2','t7_circ','Burchak tezlik (chastota orqali)','Угловая скорость через частоту','ω = 2πν','circular',{omega:'2*pi*nu',nu:'omega/(2*pi)'});
F('an1','t7_circ','Markazga intilma tezlanish','Центростремительное ускорение','aₙ = υ² / R','circular',{an:'v*v/R',v:'sqrt(an*R)',R:'v*v/an'});
F('an2','t7_circ','Markazga intilma tezlanish (ω orqali)','Центростремительное ускорение через ω','aₙ = ω²R','circular',{an:'omega*omega*R',omega:'sqrt(an/R)',R:'an/(omega*omega)'});
F('newt2','t7_dyn','Nyutonning 2-qonuni','Второй закон Ньютона','F = m·a','newton2',{F:'m*a',m:'F/a',a:'F/m'});
F('newt3','t7_dyn','Nyutonning 3-qonuni (kattaliklar)','Третий закон Ньютона (модули)','F₁ = F₂','newton3',{F1:'F2',F2:'F1'});
F('hooke','t7_dyn','Guk qonuni','Закон Гука','F = k·Δl','spring',{F:'ks*dl',ks:'F/dl',dl:'F/ks'});
F('grav','t7_dyn','Butun olam tortishish qonuni','Закон всемирного тяготения','F = G·m₁m₂ / r²','gravity',{F:'G*m1*m2/(r*r)',m1:'F*r*r/(G*m2)',m2:'F*r*r/(G*m1)',r:'sqrt(G*m1*m2/F)'});
F('wt0','t7_dyn','Og‘irlik kuchi (tinch holat)','Сила тяжести (покой)','P = m·g','weight0',{P:'m*g',m:'P/g'});
F('wtup','t7_dyn','Jism og‘irligi (tezlanish yuqoriga)','Вес тела (ускорение вверх)','P = m(g + a)','weightup',{P:'m*(g+a)',m:'P/(g+a)',a:'P/m-g'});
F('wtdn','t7_dyn','Jism og‘irligi (tezlanish pastga)','Вес тела (ускорение вниз)','P = m(g − a)','weightdn',{P:'m*(g-a)',m:'P/(g-a)',a:'g-P/m'});
F('fr1','t7_dyn','Sirpanish ishqalanish kuchi','Сила трения скольжения','F = μ·N','friction',{F:'mu*Nf',mu:'F/Nf',Nf:'F/mu'});
F('fr2','t7_dyn','Ishqalanish kuchi (gorizontal sirtda)','Сила трения (горизонт. поверхность)','F = μ·m·g','friction',{F:'mu*m*g',mu:'F/(m*g)',m:'F/(mu*g)'});
F('press','t7_fluid','Sirtga berilgan bosim','Давление на поверхность','p = F / S','pressure',{p:'F/S',F:'p*S',S:'F/p'});
F('hydro','t7_fluid','Gidrostatik bosim','Гидростатическое давление','p = ρ·g·h','hydro',{p:'rho*g*h',rho:'p/(g*h)',h:'p/(rho*g)'});
F('arch','t7_fluid','Arximed kuchi','Сила Архимеда','F_A = ρ·g·V_bot','archimedes',{FA:'rho*g*Vb',rho:'FA/(g*Vb)',Vb:'FA/(rho*g)'});
