/* Formulalar: 8 va 9-sinf */
// ---------- 8-sinf: issiqlik
F('heatQ','t8_heat','Isitish/sovutishdagi issiqlik miqdori','Количество теплоты при нагревании','Q = c·m·Δt','heat',{Q:'cs*m*dt',cs:'Q/(m*dt)',m:'Q/(cs*dt)',dt:'Q/(cs*m)'});
F('heatdt','t8_heat','Temperatura o‘zgarishi','Изменение температуры','Δt = t₂ − t₁','heat',{dt:'t2-t1',t2:'t1+dt',t1:'t2-dt'});
F('burn','t8_heat','Yoqilg‘i yonish issiqligi','Теплота сгорания топлива','Q = q·m','burn',{Q:'qf*m',qf:'Q/m',m:'Q/qf'});
F('melt','t8_heat','Erish va qotish issiqligi','Плавление и кристаллизация','Q = λ·m','phase',{Q:'lamf*m',lamf:'Q/m',m:'Q/lamf'});
F('vapor','t8_heat','Bug‘lanish va kondensatsiya issiqligi','Парообразование и конденсация','Q = L·m','phase',{Q:'Lv*m',Lv:'Q/m',m:'Q/Lv'});
F('mix','t8_heat','Issiqlik balansi (aralashtirish)','Уравнение теплового баланса','c₁m₁(θ − t₁) = c₂m₂(t₂ − θ)','mixing',{
  tm:'(cs1*m1*t1+cs2*m2*t2)/(cs1*m1+cs2*m2)',
  m2:'cs1*m1*(tm-t1)/(cs2*(t2-tm))', m1:'cs2*m2*(t2-tm)/(cs1*(tm-t1))',
  cs1:'cs2*m2*(t2-tm)/(m1*(tm-t1))', cs2:'cs1*m1*(tm-t1)/(m2*(t2-tm))',
  t1:'tm-cs2*m2*(t2-tm)/(cs1*m1)', t2:'tm+cs1*m1*(tm-t1)/(cs2*m2)'});
// ---------- 8-sinf: elektr
F('coul','t8_ohm','Kulon qonuni','Закон Кулона','F = k·|q₁||q₂| / r²','coulomb',{F:'kc*abs(q1*q2)/(r*r)',q1:'F*r*r/(kc*abs(q2))',q2:'F*r*r/(kc*abs(q1))',r:'sqrt(kc*abs(q1*q2)/F)'});
F('curr','t8_ohm','Tok kuchi','Сила тока','I = q / t','current',{I:'q/t',q:'I*t',t:'q/I'});
F('volt','t8_ohm','Elektr kuchlanishi','Электрическое напряжение','U = A / q','voltage',{U:'W/q',W:'U*q',q:'W/U'});
F('ohm','t8_ohm','Zanjir qismi uchun Om qonuni','Закон Ома для участка цепи','I = U / R','ohm',{I:'U/Rr',U:'I*Rr',Rr:'U/I'});
F('resist','t8_ohm','O‘tkazgich qarshiligi','Сопротивление проводника','R = ρ·l / S','resistance',{Rr:'rhoe*lw/S',rhoe:'Rr*S/lw',lw:'Rr*S/rhoe',S:'rhoe*lw/Rr'});
F('ework','t8_ohm','Elektr tokining ishi','Работа электрического тока','A = U·I·t','joule',{W:'U*I*t',U:'W/(I*t)',I:'W/(U*t)',t:'W/(U*I)'});
F('epow1','t8_ohm','Elektr quvvati','Электрическая мощность','P = U·I','joule',{Pe:'U*I',U:'Pe/I',I:'Pe/U'});
F('epow2','t8_ohm','Quvvat (tok va qarshilik orqali)','Мощность через ток и сопротивление','P = I²·R','joule',{Pe:'I*I*Rr',I:'sqrt(Pe/Rr)',Rr:'Pe/(I*I)'});
F('epow3','t8_ohm','Quvvat (kuchlanish va qarshilik orqali)','Мощность через напряжение и сопротивление','P = U² / R','joule',{Pe:'U*U/Rr',U:'sqrt(Pe*Rr)',Rr:'U*U/Pe'});
F('joule','t8_ohm','Joul–Lens qonuni','Закон Джоуля–Ленца','Q = I²·R·t','joule',{Q:'I*I*Rr*t',I:'sqrt(Q/(Rr*t))',Rr:'Q/(I*I*t)',t:'Q/(I*I*Rr)'});
// ketma-ket
F('s_R','t8_series','Umumiy qarshilik (ketma-ket)','Общее сопротивление (последовательно)','R = R₁ + R₂','series',{Rs:'R1+R2',R1:'Rs-R2',R2:'Rs-R1'});
F('s_I1','t8_series','Tok kuchi bir xil','Сила тока одинакова','I = I₁ = I₂','series',{I1:'I',I2:'I',I:'I1'});
F('s_U','t8_series','Kuchlanishlar yig‘indisi','Сумма напряжений','U = U₁ + U₂','series',{U:'U1+U2',U1:'U-U2',U2:'U-U1'});
F('s_ohm','t8_series','Butun zanjir uchun Om qonuni','Закон Ома для всей цепи','I = U / R','series',{I:'U/Rs',U:'I*Rs',Rs:'U/I'});
F('s_o1','t8_series','1-o‘tkazgich uchun Om','Закон Ома для R₁','I₁ = U₁ / R₁','series',{I1:'U1/R1',U1:'I1*R1',R1:'U1/I1'});
F('s_o2','t8_series','2-o‘tkazgich uchun Om','Закон Ома для R₂','I₂ = U₂ / R₂','series',{I2:'U2/R2',U2:'I2*R2',R2:'U2/I2'});
// parallel
F('p_R','t8_parallel','Umumiy qarshilik (parallel)','Общее сопротивление (параллельно)','1/R = 1/R₁ + 1/R₂','parallel',{Rp:'1/(1/R1+1/R2)',R1:'1/(1/Rp-1/R2)',R2:'1/(1/Rp-1/R1)'});
F('p_U','t8_parallel','Kuchlanish bir xil','Напряжение одинаково','U = U₁ = U₂','parallel',{U1:'U',U2:'U',U:'U1'});
F('p_I','t8_parallel','Toklar yig‘indisi','Сумма токов','I = I₁ + I₂','parallel',{I:'I1+I2',I1:'I-I2',I2:'I-I1'});
F('p_ohm','t8_parallel','Butun zanjir uchun Om qonuni','Закон Ома для всей цепи','I = U / R','parallel',{I:'U/Rp',U:'I*Rp',Rp:'U/I'});
F('p_o1','t8_parallel','1-o‘tkazgich uchun Om','Закон Ома для R₁','I₁ = U₁ / R₁','parallel',{I1:'U1/R1',U1:'I1*R1',R1:'U1/I1'});
F('p_o2','t8_parallel','2-o‘tkazgich uchun Om','Закон Ома для R₂','I₂ = U₂ / R₂','parallel',{I2:'U2/R2',U2:'I2*R2',R2:'U2/I2'});
// ---------- 9-sinf: optika
F('refl','t9_optics','Yorug‘likning qaytish qonuni','Закон отражения света','α = γ','reflect',{gam:'alpha',alpha:'gam'});
F('snell','t9_optics','Sindirish qonuni (Snellius)','Закон преломления (Снеллиус)','sin α / sin β = n₂₁','refract',{beta:'deg(asin(sin(rad(alpha))/n21))',alpha:'deg(asin(n21*sin(rad(beta))))',n21:'sin(rad(alpha))/sin(rad(beta))'});
F('n21a','t9_optics','Nisbiy sindirish ko‘rsatkichi','Относительный показатель преломления','n₂₁ = n₂ / n₁','refract',{n21:'n2/n1',n2:'n21*n1',n1:'n2/n21'});
F('n21b','t9_optics','Nisbiy ko‘rsatkich va tezliklar','Относительный показатель и скорости','n₂₁ = υ₁ / υ₂','refract',{n21:'v1/v2',v1:'n21*v2',v2:'v1/n21'});
F('nabs1','t9_optics','Absolyut sindirish ko‘rsatkichi (1-muhit)','Абсолютный показатель (среда 1)','n₁ = c / υ₁','refract',{n1:'cl/v1',v1:'cl/n1'});
F('nabs2','t9_optics','Absolyut sindirish ko‘rsatkichi (2-muhit)','Абсолютный показатель (среда 2)','n₂ = c / υ₂','refract',{n2:'cl/v2',v2:'cl/n2'});
F('nabs','t9_optics','Absolyut sindirish ko‘rsatkichi','Абсолютный показатель преломления','n = c / υ','speedmedium',{n:'cl/v',v:'cl/n'});
F('crit','t9_optics','To‘la ichki qaytish chegaraviy burchagi','Предельный угол полного отражения','sin α₀ = 1 / n','critical',{alpha0:'deg(asin(1/n))',n:'1/sin(rad(alpha0))'});
F('optp','t9_optics','Linzaning optik kuchi','Оптическая сила линзы','D = 1 / F','lens',{D:'1/Fo',Fo:'1/D'});
F('lens2','t9_optics','Yupqa linza formulasi','Формула тонкой линзы','1/F = 1/d + 1/f','lens',{Fo:'1/(1/d+1/f)',d:'1/(1/Fo-1/f)',f:'1/(1/Fo-1/d)'});
F('mag1','t9_optics','Linza kattalashtirishi (balandliklar)','Увеличение линзы (высоты)','Γ = H / h','lens',{K:'H/ho',H:'K*ho',ho:'H/K'});
F('mag2','t9_optics','Linza kattalashtirishi (masofalar)','Увеличение линзы (расстояния)','Γ = f / d','lens',{K:'f/d',f:'K*d',d:'f/K'});
