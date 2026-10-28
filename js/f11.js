/* Formulalar: 11-sinf */
F('amp','t11_mag','Amper kuchi','Сила Ампера','F_A = I·B·L·sin α','magforce',{Famp:'I*B*lw*sin(rad(alpha))',I:'Famp/(B*lw*sin(rad(alpha)))',B:'Famp/(I*lw*sin(rad(alpha)))',lw:'Famp/(I*B*sin(rad(alpha)))'});
F('lor','t11_mag','Lorens kuchi','Сила Лоренца','F_L = q·υ·B·sin α','lorentz',{FL:'q*v*B*sin(rad(alpha))',q:'FL/(v*B*sin(rad(alpha)))',v:'FL/(q*B*sin(rad(alpha)))',B:'FL/(q*v*sin(rad(alpha)))'});
F('lorR','t11_mag','Zaryadning magnit maydondagi aylana radiusi','Радиус окружности заряда в поле','R = m·υ / (q·B)','lorentz',{R:'m*v/(q*B)',m:'R*q*B/v',v:'R*q*B/m',B:'m*v/(q*R)'});
F('flux','t11_mag','Magnit oqimi','Магнитный поток','Φ = B·S·cos α','flux',{Phi:'B*S*cos(rad(alpha))',B:'Phi/(S*cos(rad(alpha)))',S:'Phi/(B*cos(rad(alpha)))'});
F('faraday','t11_mag','Faradey induksiya qonuni (kattalik)','Закон Фарадея (модуль)','|ℰᵢ| = ΔΦ / Δt','induction',{emfi:'dPhi/dtt',dPhi:'emfi*dtt',dtt:'dPhi/emfi'});
F('selfind','t11_mag','O‘zinduksiya EYuK (kattalik)','ЭДС самоиндукции (модуль)','|ℰ| = L·ΔI / Δt','induction',{emfi:'Lind*dI/dtt',Lind:'emfi*dtt/dI',dI:'emfi*dtt/Lind',dtt:'Lind*dI/emfi'});
F('Wmag','t11_mag','Magnit maydon energiyasi','Энергия магнитного поля','W_m = L·I² / 2','induction',{Wm:'Lind*I*I/2',Lind:'2*Wm/(I*I)',I:'sqrt(2*Wm/Lind)'});
F('thomson','t11_emw','Tomson formulasi','Формула Томсона','T = 2π√(L·C)','lc',{T:'2*pi*sqrt(Lind*C)',Lind:'(T/(2*pi))^2/C',C:'(T/(2*pi))^2/Lind'});
F('trafo','t11_emw','Transformatsiya koeffitsiyenti','Коэффициент трансформации','k = U₁/U₂ = N₁/N₂','transformer',{kt:'N1/N2',N1:'kt*N2',N2:'N1/kt'});
F('trafoU','t11_emw','Transformator kuchlanishlari','Напряжения трансформатора','U₁/U₂ = N₁/N₂','transformer',{U2:'U1*N2/N1',U1:'U2*N1/N2',N1:'N2*U1/U2',N2:'N1*U2/U1'});
// STR
F('relm','t11_rel','Relyativistik massa','Релятивистская масса','m = m₀ / √(1 − υ²/c²)','relativity',{mr:'m0r/sqrt(1-v*v/(cl*cl))',m0r:'mr*sqrt(1-v*v/(cl*cl))',v:'cl*sqrt(1-(m0r/mr)^2)'});
F('relt','t11_rel','Vaqt nisbiyligi','Относительность времени','τ = τ₀ / √(1 − υ²/c²)','relativity',{tau:'tau0/sqrt(1-v*v/(cl*cl))',tau0:'tau*sqrt(1-v*v/(cl*cl))',v:'cl*sqrt(1-(tau0/tau)^2)'});
F('rell','t11_rel','Uzunlik nisbiyligi','Относительность длины','l = l₀·√(1 − υ²/c²)','relativity',{lr:'l0*sqrt(1-v*v/(cl*cl))',l0:'lr/sqrt(1-v*v/(cl*cl))',v:'cl*sqrt(1-(lr/l0)^2)'});
F('relv','t11_rel','Relyativistik tezliklarni qo‘shish','Релятивистское сложение скоростей','u = (υ₁ + υ₂) / (1 + υ₁υ₂/c²)','relativity',{uu:'(v1+v2)/(1+v1*v2/(cl*cl))'});
F('emc','t11_rel','Eynshteyn formulasi','Формула Эйнштейна','E = m·c²','relativity',{Etot:'mr*cl*cl',mr:'Etot/(cl*cl)'});
F('e0','t11_rel','Tinchlik energiyasi','Энергия покоя','E₀ = m₀·c²','relativity',{E0:'m0r*cl*cl',m0r:'E0/(cl*cl)'});
F('ekr','t11_rel','Relyativistik kinetik energiya','Релятивистская кинетическая энергия','E_k = (m − m₀)c²','relativity',{Ekr:'(mr-m0r)*cl*cl',mr:'Ekr/(cl*cl)+m0r',m0r:'mr-Ekr/(cl*cl)'});
// kvant
F('wien','t11_quant','Vin siljish qonuni','Закон смещения Вина','λ_m·T = b','quantum',{lamm:'bW/Tk',Tk:'bW/lamm'});
F('planck1','t11_quant','Foton energiyasi (chastota)','Энергия фотона (частота)','E = h·ν','photon',{Eph:'hP*nu',nu:'Eph/hP'});
F('planck2','t11_quant','Foton energiyasi (to‘lqin uzunligi)','Энергия фотона (длина волны)','E = h·c / λ','photon',{Eph:'hP*cl/lam',lam:'hP*cl/Eph'});
F('photoeff','t11_quant','Fotoeffekt uchun Eynshteyn tenglamasi','Уравнение Эйнштейна для фотоэффекта','hν = A_chiq + m·υ²/2','photoeffect',{Ek:'hP*nu-Aw',nu:'(Aw+Ek)/hP',Aw:'hP*nu-Ek'});
F('photov','t11_quant','Fotoelektron tezligi','Скорость фотоэлектрона','υ_max = √(2(hν − A)/mₑ)','photoeffect',{vel:'sqrt(2*(hP*nu-Aw)/me)',nu:'(me*vel*vel/2+Aw)/hP',Aw:'hP*nu-me*vel*vel/2'});
F('redb1','t11_quant','Fotoeffektning qizil chegarasi (chastota)','Красная граница (частота)','ν₀ = A_chiq / h','photoeffect',{nu0:'Aw/hP',Aw:'nu0*hP'});
F('redb2','t11_quant','Fotoeffektning qizil chegarasi (to‘lqin uzunligi)','Красная граница (длина волны)','λ₀ = h·c / A_chiq','photoeffect',{lam0:'hP*cl/Aw',Aw:'hP*cl/lam0'});
F('pph','t11_quant','Foton impulsi','Импульс фотона','p = E / c = h / λ','photon',{pph:'hP/lam',lam:'hP/pph'});
F('pph2','t11_quant','Foton impulsi (energiya orqali)','Импульс фотона (через энергию)','p = E / c','photon',{pph:'Eph/cl',Eph:'pph*cl'});
// atom, yadro
F('bohr','t11_nuc','Borning 2-postulati','2-й постулат Бора','hν = E₂ − E₁','bohr',{nu:'(En2-En1)/hP',En2:'En1+hP*nu',En1:'En2-hP*nu'});
F('nneu','t11_nuc','Neytronlar soni','Число нейтронов','N = A − Z','nucleus',{Nneu:'An-Zp',An:'Nneu+Zp',Zp:'An-Nneu'});
F('defect','t11_nuc','Massalar defekti','Дефект масс','Δm = Z·m_p + (A−Z)·m_n − M_y','nucleus',{dm:'Zp*mp+(An-Zp)*mn-Mnuc',Mnuc:'Zp*mp+(An-Zp)*mn-dm'});
F('ebond','t11_nuc','Yadroning bog‘lanish energiyasi','Энергия связи ядра','E_bog‘ = Δm·c²','nucleus',{Ebond:'dm*cl*cl',dm:'Ebond/(cl*cl)'});
F('decay1','t11_nuc','Radioaktiv yemirilish (2 ning darajasi)','Радиоактивный распад (степень 2)','N = N₀·2^(−t/T)','decay',{Nn:'N0*2^(-t/Thalf)',N0:'Nn*2^(t/Thalf)',t:'-Thalf*log2(Nn/N0)',Thalf:'-t/log2(Nn/N0)'});
F('decay2','t11_nuc','Radioaktiv yemirilish (eksponenta)','Радиоактивный распад (экспонента)','N = N₀·e^(−λt)','decay',{Nn:'N0*exp(-lamd*t)',N0:'Nn*exp(lamd*t)',t:'-ln(Nn/N0)/lamd',lamd:'-ln(Nn/N0)/t'});
F('lamT','t11_nuc','Yemirilish doimiysi va yarim yemirilish davri','Постоянная распада и период полураспада','λ = ln2 / T','decay',{lamd:'ln(2)/Thalf',Thalf:'ln(2)/lamd'});
F('alpha','t11_nuc','Alfa-yemirilish (siljish qoidasi)','Альфа-распад (правило смещения)','ᴬ_Z X → ᴬ⁻⁴_Z₋₂ Y + ⁴₂He','alphadecay',{Ad:'An-4',Zd:'Zp-2'});
F('beta','t11_nuc','Beta-yemirilish (siljish qoidasi)','Бета-распад (правило смещения)','ᴬ_Z X → ᴬ_Z₊₁ Y + ₋₁⁰e + ν̄','betadecay',{Ad:'An',Zd:'Zp+1'});
