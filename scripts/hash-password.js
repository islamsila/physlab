// Foydalanish:  node scripts/hash-password.js "parolingiz"
const {hashPassword}=require('../api/_lib/admin.js');
const pw=process.argv[2];if(!pw||pw.length<10){console.error('Parol kamida 10 belgi bo‘lsin.\nMisol: node scripts/hash-password.js "MeningParolim2026!"');process.exit(1);}
console.log(hashPassword(pw));
