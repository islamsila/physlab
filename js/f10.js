/* Formulalar: 10-sinf */
// kinematika: otilgan jismlar
F('hx','t10_proj','Gorizontal otilgan jism: x koordinata','Горизонтальный бросок: x','x = υ₀·t','projectile',{x:'v0*t',v0:'x/t',t:'x/v0'});
F('hy','t10_proj','Gorizontal otilgan jism: balandlik','Горизонтальный бросок: падение','y = g·t² / 2','projectile',{y:'g*t*t/2',t:'sqrt(2*y/g)',g:'2*y/(t*t)'});
F('hv','t10_proj','Gorizontal otilgan jism tezligi','Скорость при горизонтальном броске','υ = √(υ₀² + (g·t)²)','projectile',{v:'sqrt(v0*v0+(g*t)^2)',v0:'sqrt(v*v-(g*t)^2)',t:'sqrt(v*v-v0*v0)/g'});
F('tk','t10_proj','Ko‘tarilish vaqti (qiya otilgan)','Время подъёма (под углом)','t_k = υ₀·sin α / g','projectile',{tk:'v0*sin(rad(alpha))/g',v0:'tk*g/sin(rad(alpha))',alpha:'deg(asin(tk*g/v0))'});
F('hmax','t10_proj','Maksimal ko‘tarilish balandligi','Максимальная высота','h_max = υ₀²·sin²α / 2g','projectile',{hmax:'v0*v0*sin(rad(alpha))^2/(2*g)',v0:'sqrt(2*g*hmax)/sin(rad(alpha))',alpha:'deg(asin(sqrt(2*g*hmax)/v0))'});
F('Lr','t10_proj','Uchish uzoqligi','Дальность полёта','L = υ₀²·sin 2α / g','projectile',{Lr:'v0*v0*sin(2*rad(alpha))/g',v0:'sqrt(Lr*g/sin(2*rad(alpha)))',alpha:'deg(asin(Lr*g/(v0*v0))/2)'});
// impuls va energiya
F('imp','t10_cons','Jism impulsi','Импульс тела','p = m·υ','momentum',{pm:'m*v',m:'pm/v',v:'pm/m'});
F('fimp','t10_cons','Kuch impulsi','Импульс силы','F·Δt = Δp','momentum',{F:'dpm/dtt',dpm:'F*dtt',dtt:'dpm/F'});
F('cons1','t10_cons','Impulsning saqlanishi (noelastik, birga harakat)','Закон сохранения импульса (слипание)','m₁υ₁ + m₂υ₂ = (m₁+m₂)·u','collision',{u1:'(m1*v1+m2*v2)/(m1+m2)'},{note:'Birga harakatlanuvchi jismlar uchun u₁′ = u₂′ = u'});
F('cons2','t10_cons','Impulsning saqlanishi (1-jism keyingi tezligi)','Закон сохранения импульса (скорость 1-го после)','m₁υ₁ + m₂υ₂ = m₁υ₁′ + m₂υ₂′','collision',{u1:'(m1*v1+m2*v2-m2*u2)/m1',u2:'(m1*v1+m2*v2-m1*u1)/m2',v1:'(m1*u1+m2*u2-m2*v2)/m1',v2:'(m1*u1+m2*u2-m1*v1)/m2'});
F('ek','t10_cons','Kinetik energiya','Кинетическая энергия','E_k = m·υ² / 2','energy',{Ek:'m*v*v/2',m:'2*Ek/(v*v)',v:'sqrt(2*Ek/m)'});
F('ep','t10_cons','Potensial energiya','Потенциальная энергия','E_p = m·g·h','energy',{Ep:'m*g*h',m:'Ep/(g*h)',h:'Ep/(m*g)'});
F('eps','t10_cons','Deformatsiyalangan prujina energiyasi','Энергия деформированной пружины','E_p = k·Δl² / 2','spring',{Ep:'ks*dl*dl/2',ks:'2*Ep/(dl*dl)',dl:'sqrt(2*Ep/ks)'});
// statika, gidrodinamika
F('mom','t10_stat','Kuch momenti','Момент силы','M = F·l','lever',{M:'F*d1',F:'M/d1',d1:'M/F'});
F('cont','t10_stat','Oqim uzluksizligi','Уравнение неразрывности','S₁υ₁ = S₂υ₂','flow',{v2:'S1*v1/S2',v1:'S2*v2/S1',S1:'S2*v2/v1',S2:'S1*v1/v2'});
F('torr','t10_stat','Torrichelli formulasi','Формула Торричелли','υ = √(2gh)','torricelli',{v:'sqrt(2*g*h)',h:'v*v/(2*g)'});
F('bern','t10_stat','Bernulli tenglamasi (p₂ topish)','Уравнение Бернулли (найти p₂)','p₁ + ρgh₁ + ρυ₁²/2 = p₂ + ρgh₂ + ρυ₂²/2','flow',{p2:'p1+rho*g*h1+rho*v1*v1/2-rho*g*h2-rho*v2*v2/2',p1:'p2+rho*g*h2+rho*v2*v2/2-rho*g*h1-rho*v1*v1/2',v2:'sqrt(v1*v1+2*(p1-p2)/rho+2*g*(h1-h2))'});
// tebranishlar
F('harm','t10_osc','Garmonik tebranish: koordinata','Гармонические колебания: координата','x = A·sin(ωt + φ₀)','oscillation',{x:'Am*sin(omega*t+rad(phi0))',Am:'x/sin(omega*t+rad(phi0))'});
F('hvel','t10_osc','Maksimal tezlik','Максимальная скорость','υ_max = A·ω','oscillation',{vmax:'Am*omega',Am:'vmax/omega',omega:'vmax/Am'});
F('hacc','t10_osc','Maksimal tezlanish','Максимальное ускорение','a_max = A·ω²','oscillation',{amax:'Am*omega*omega',Am:'amax/(omega*omega)',omega:'sqrt(amax/Am)'});
F('hacc2','t10_osc','Tezlanish va siljish (harmonik)','Ускорение и смещение (гармон.)','a = −ω²·x','oscillation',{a:'-omega*omega*x',x:'-a/(omega*omega)',omega:'sqrt(-a/x)'});
F('omT','t10_osc','Siklik chastota va davr','Циклическая частота и период','ω = 2π / T','oscillation',{omega:'2*pi/T',T:'2*pi/omega'});
F('omN','t10_osc','Siklik chastota va chastota','Циклическая частота и частота','ω = 2πν','oscillation',{omega:'2*pi*nu',nu:'omega/(2*pi)'});
F('TN','t10_osc','Tebranish davri','Период колебаний','T = t / N','oscillation',{T:'t/Ncnt',t:'T*Ncnt',Ncnt:'t/T'});
F('spT','t10_osc','Prujinali mayatnik davri','Период пружинного маятника','T = 2π√(m/k)','springpend',{T:'2*pi*sqrt(m/ks)',m:'ks*(T/(2*pi))^2',ks:'m*(2*pi/T)^2'});
F('pdT','t10_osc','Matematik mayatnik davri','Период математического маятника','T = 2π√(l/g)','pendulum',{T:'2*pi*sqrt(lp/g)',lp:'g*(T/(2*pi))^2',g:'lp*(2*pi/T)^2'});
F('Eosc','t10_osc','Tebranish to‘la energiyasi','Полная энергия колебаний','E = k·A² / 2','springpend',{Eosc:'ks*Am*Am/2',Am:'sqrt(2*Eosc/ks)',ks:'2*Eosc/(Am*Am)'});
F('wave1','t10_osc','To‘lqin uzunligi (davr orqali)','Длина волны (через период)','λ = υ·T','wave',{lam:'v*T',v:'lam/T',T:'lam/v'});
F('wave2','t10_osc','To‘lqin uzunligi (chastota orqali)','Длина волны (через частоту)','λ = υ / ν','wave',{lam:'v/nu',v:'lam*nu',nu:'v/lam'});
// MKN
F('mkn1','t10_mkn','MKN asosiy tenglamasi','Основное уравнение МКТ','p = ⅓·n·m₀·⟨υ²⟩','gas',{p:'nc*m0*vsq/3',nc:'3*p/(m0*vsq)',m0:'3*p/(nc*vsq)',vsq:'3*p/(nc*m0)'});
F('mkn2','t10_mkn','Bosim va temperatura','Давление и температура','p = n·k·T','gas',{p:'nc*kB*Tk',nc:'p/(kB*Tk)',Tk:'p/(nc*kB)'});
F('mc','t10_mkn','Mendeleyev–Klapeyron tenglamasi','Уравнение Менделеева–Клапейрона','p·V = (m/M)·R·T','gas',{p:'m/Mmol*Rg*Tk/V',V:'m/Mmol*Rg*Tk/p',Tk:'p*V*Mmol/(m*Rg)',m:'p*V*Mmol/(Rg*Tk)',Mmol:'m*Rg*Tk/(p*V)'});
F('nmol','t10_mkn','Modda miqdori','Количество вещества','ν = m / M','gas',{nmol:'m/Mmol',m:'nmol*Mmol',Mmol:'m/nmol'});
F('izoT','t10_mkn','Izotermik jarayon (Boyl–Mariott)','Изотермический процесс (Бойль–Мариотт)','p₁V₁ = p₂V₂','isotherm',{p2:'p1*V1/V2',p1:'p2*V2/V1',V1:'p2*V2/p1',V2:'p1*V1/p2'});
F('izoP','t10_mkn','Izobar jarayon (Gey-Lyussak)','Изобарный процесс (Гей-Люссак)','V₁/T₁ = V₂/T₂','isobar',{V2:'V1*Tk2/Tk1',V1:'V2*Tk1/Tk2',Tk1:'V1*Tk2/V2',Tk2:'V2*Tk1/V1'});
F('izoV','t10_mkn','Izoxor jarayon (Sharl)','Изохорный процесс (Шарль)','p₁/T₁ = p₂/T₂','isochore',{p2:'p1*Tk2/Tk1',p1:'p2*Tk1/Tk2',Tk1:'p1*Tk2/p2',Tk2:'p2*Tk1/p1'});
F('Uint','t10_mkn','Ideal gaz ichki energiyasi','Внутренняя энергия идеального газа','U = (i/2)(m/M)RT','gas',{U_in:'ifr/2*m/Mmol*Rg*Tk',m:'2*U_in*Mmol/(ifr*Rg*Tk)',Tk:'2*U_in*Mmol/(ifr*m*Rg)'});
F('Uint2','t10_mkn','Ichki energiya (ν orqali)','Внутренняя энергия через ν','U = (i/2)·ν·R·T','gas',{U_in:'ifr/2*nmol*Rg*Tk',nmol:'2*U_in/(ifr*Rg*Tk)',Tk:'2*U_in/(ifr*nmol*Rg)'});
// termodinamika
F('first','t10_thermo','Termodinamikaning 1-qonuni','1-й закон термодинамики','Q = ΔU + A','thermo',{Q:'dU+Wg',dU:'Q-Wg',Wg:'Q-dU'});
F('gaswork','t10_thermo','Gaz ishi (izobar)','Работа газа (изобарный)','A = p·ΔV','thermo',{Wg:'p*dV',p:'Wg/dV',dV:'Wg/p'});
F('dU','t10_thermo','Ichki energiya o‘zgarishi','Изменение внутренней энергии','ΔU = (i/2)·ν·R·ΔT','thermo',{dU:'ifr/2*nmol*Rg*(Tk2-Tk1)',Tk2:'Tk1+2*dU/(ifr*nmol*Rg)',Tk1:'Tk2-2*dU/(ifr*nmol*Rg)'});
F('carnot','t10_thermo','Karno sikli FIK','КПД цикла Карно','η = (T₁ − T₂)/T₁ · 100%','carnot',{eta:'(TH-TC)/TH*100',TH:'TC/(1-eta/100)',TC:'TH*(1-eta/100)'});
// elektrodinamika
F('Efield','t10_elec','Elektr maydon kuchlanganligi (kuch orqali)','Напряжённость поля (через силу)','E = F / q','field',{E:'F/q',F:'E*q',q:'F/E'});
F('EfieldU','t10_elec','Maydon kuchlanganligi (kuchlanish orqali)','Напряжённость поля (через напряжение)','E = U / d','field',{E:'U/ds',U:'E*ds',ds:'U/E'});
F('cap','t10_elec','Yassi kondensator sig‘imi','Ёмкость плоского конденсатора','C = ε₀·ε·S / d','capacitor',{C:'eps0*eps*S/ds',S:'C*ds/(eps0*eps)',ds:'eps0*eps*S/C',eps:'C*ds/(eps0*S)'});
F('capq','t10_elec','Sig‘im va zaryad','Ёмкость и заряд','C = q / U','capacitor',{C:'q/U',q:'C*U',U:'q/C'});
F('capE1','t10_elec','Kondensator energiyasi (U orqali)','Энергия конденсатора (через U)','W_e = C·U² / 2','capacitor',{We:'C*U*U/2',C:'2*We/(U*U)',U:'sqrt(2*We/C)'});
F('capE2','t10_elec','Kondensator energiyasi (q orqali)','Энергия конденсатора (через q)','W_e = q² / 2C','capacitor',{We:'q*q/(2*C)',q:'sqrt(2*We*C)',C:'q*q/(2*We)'});
F('fullohm','t10_elec','To‘liq zanjir uchun Om qonuni','Закон Ома для полной цепи','I = ℰ / (R + r)','fullcircuit',{I:'emf/(Rr+rin)',emf:'I*(Rr+rin)',Rr:'emf/I-rin',rin:'emf/I-Rr'});
F('farad','t10_elec','Faradey qonuni (elektroliz)','Закон Фарадея (электролиз)','m = k·q','electrolysis',{m:'ke*q',ke:'m/q',q:'m/ke'});
F('farad2','t10_elec','Faradey qonuni (I·t orqali)','Закон Фарадея (через I·t)','m = k·I·t','electrolysis',{m:'ke*I*t',ke:'m/(I*t)',I:'m/(ke*t)',t:'m/(ke*I)'});
