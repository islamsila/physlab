# PhysLab Solver 2.0 — AI + Google kirish + Admin panel

**Yangiliklar**
- **AI yechuvchi** (bepul Google Gemini): PDF / rasm (skrinshot, Ctrl+V) / matn yuklang → AI mavzuni aniqlaydi, masalani o‘zi tahlil qilib yechadi (formulaga "tiqmaydi"), har bir qadamni tushuntiradi va masalaga mos **animatsiya + grafiklar** yaratadi.
  Hisob-kitoblarni AI emas, **dastur qayta hisoblaydi** (AI xato qilsa ogohlantiradi), PDF dagi kitob javobi bilan solishtiradi (✓ / ⚠).
- **Google orqali kirish** — kim va nechta odam foydalanayotgani admin panelda ko‘rinadi.
- **Admin panel** (`/admin`): login+parol, **3 ta xato → 1 soat blok**, foydalanuvchilar (bloklash, limit, o‘chirish), statistika, AI so‘rovlar tarixi, sozlamalar, parol almashtirish.
- Eski «Formula bo‘yicha» yechuvchi saqlangan.

## Sozlash (bir marta, ~20 daqiqa, hammasi bepul)

### 1. Firebase (Google kirish + baza)
1. https://console.firebase.google.com → **Add project** (Analytics shart emas).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable**, support email tanlang.
3. **Build → Firestore Database → Create database** (production mode, region: `eur3` yoki yaqinrog‘i). Keyin **Rules** bo‘limiga `firestore.rules` faylidagi matnni qo‘yib *Publish* qiling.
4. **Project settings (⚙) → General → Your apps → Web (`</>`)** ni qo‘shing → `apiKey` va `appId` ni oling.
5. **Project settings → Service accounts → Generate new private key** → JSON yuklanadi: undagi `client_email` va `private_key` kerak.
6. **Authentication → Settings → Authorized domains** ga saytingiz domenini qo‘shing (masalan `nmtu-shaxrux-physlab.vercel.app`).

### 2. Gemini API kaliti (bepul)
https://aistudio.google.com/apikey → **Create API key**.
> Bepul darajada Google so‘rovlarni mahsulotlarini yaxshilash uchun ishlatishi mumkin; kunlik/daqiqalik limitlar bor — shuning uchun panelda foydalanuvchi limitlari bor.
> Model nomlari vaqt o‘tishi bilan almashadi: ishlamay qolsa **Admin → Sozlamalar → Gemini modellari** da yangisini yozing (ro‘yxat: https://ai.google.dev/gemini-api/docs/models).

### 3. Admin parol xeshi
```
npm install
node scripts/hash-password.js "MeningParolim-2026!"
```
chiqqan `scrypt$...` qatorini `ADMIN_PASSWORD_HASH` ga qo‘ying. (Node o‘rnatmagan bo‘lsangiz: vaqtincha `ADMIN_PASSWORD=parol` ham ishlaydi, keyin panelda parolni almashtirsangiz xeshga o‘tadi.)

### 4. Vercel
1. Shu papkani GitHub ga yuklang → Vercel da **Import** (yoki `vercel --prod`).
2. **Settings → Environment Variables** ga `.env.example` dagi hamma qiymatlarni kiriting. `FIREBASE_PRIVATE_KEY` ni qo‘shtirnoqsiz yoki `\n` lari bilan o‘z holicha qo‘ying.
3. Redeploy. Sayt: `/` , admin: `/admin`.

## Qanday ishlaydi / xavfsizlik
- Admin blokirovkasi **serverda** (Firestore `config/adminLock`): 3 ta xato → 1 soat hamma qurilma uchun yopiladi; urinish tekshiruvdan oldin hisoblanadi, shuning uchun parallel taxminlar ham 3 tadan oshmaydi. Blokni darhol ochish kerak bo‘lsa Firebase konsolda `config/adminLock` hujjatini o‘chiring.
- Admin sessiya: HttpOnly + Secure + SameSite=Strict cookie, 8 soat; parol almashtirilsa barcha sessiyalar tugaydi.
- AI chiqargan formulalar `eval` bilan **bajarilmaydi** — alohida xavfsiz hisoblagich (`js/safeexpr.js`) ishlaydi; server va brauzer bir xil tekshiruv qiladi.
- Bloklangan foydalanuvchi Firebase Auth da ham o‘chiriladi (qayta kira olmaydi).
- Firestore brauzerdan butunlay yopiq; hamma narsa serverdagi Admin SDK orqali.
- Eslatma: eski «Formula bo‘yicha» yechuvchi oddiy statik JS — uni texnik jihatdan to‘liq yopib bo‘lmaydi; AI, kvota va statistika esa serverda nazorat qilinadi.
- Firebase bepul (Spark) kvotasi: kuniga 20k yozish / 50k o‘qish — yuzlab foydalanuvchiga yetadi.

## Fayllar
`index.html`, `js/ai.js` (AI oynasi, PDF o‘qish), `js/scene.js` (universal animatsiya), `js/plan.js` + `js/safeexpr.js` (tekshiruv/hisob), `js/auth.js` (Google kirish), `admin.html` + `js/admin.js`, `api/*` (Vercel funksiyalari), `scripts/build-catalog.js` (formulalar o‘zgarsa `npm run catalog`), `tests/` (`npm test`).
