# EduAdmin — O'quv markazi boshqaruv paneli

Vue 3 + TypeScript + Tailwind CSS + DaisyUI + Supabase asosida qurilgan kichik admin panel.

Rollar: **manager** (menejer) va **teacher** (o'qituvchi) — boshqa rol yo'q.

## Imkoniyatlar

- Fanlar (subjects) — CRUD, faqat manager yaratadi/o'zgartiradi
- Guruhlar (groups) — fan + o'qituvchi + oylik narx, faqat manager yaratadi/o'zgartiradi, o'qituvchi faqat o'z guruhlarini ko'radi
- O'quvchilar (students) — har bir o'qituvchida faqat o'zining o'quvchilari; qo'shish, tahrirlash, **o'chirish**, **boshqa o'qituvchiga o'tkazish** (faqat manager)
- Oylik to'lovlar (payments) — har oy uchun to'landi/to'lanmadi belgilash, oylik yig'im statistikasi
- O'qituvchilar (teachers) — faqat manager ko'radi, yangi o'qituvchi hisobini yaratadi (Edge Function orqali xavfsiz)

## 1) O'rnatish

```bash
npm install
cp .env.example .env
```

`.env` faylga Supabase loyihangizning URL va anon key'ini kiriting
(Supabase Dashboard > Project Settings > API).

```bash
npm run dev
```

## 2) Supabase'ni sozlash

1. https://supabase.com da yangi loyiha yarating.
2. **SQL Editor** bo'limiga o'ting va `supabase/schema.sql` faylining
   to'liq mazmunini nusxalab, **Run** tugmasini bosing. Bu quyidagilarni yaratadi:
   - `profiles`, `subjects`, `groups`, `students`, `payments` jadvallari
   - Yangi foydalanuvchi ro'yxatdan o'tganda avtomatik `profiles` yozuvini yaratuvchi trigger
   - Har bir jadval uchun Row Level Security (RLS) siyosatlari (teacher faqat
     o'zinikini ko'radi, manager hammasini)

3. **Birinchi menejerni yaratish:**
   - Authentication > Users > **Add user** orqali o'zingiz uchun hisob yarating
     (email + parol, "Auto Confirm User" belgilang).
   - SQL Editor'da faylning oxiridagi izohdan chiqarilgan so'rovni ishga tushiring:
     ```sql
     update public.profiles set role = 'manager'
     where id = (select id from auth.users where email = 'sizning-emailingiz@misol.uz');
     ```
   - Shu email/parol bilan ilovaga kiring — endi siz menejersiz.

4. **Edge Function joylashtirish (yangi o'qituvchi qo'shish uchun):**

   Bu funksiya kerak, chunki menejer ilovadan turib yangi o'qituvchi hisobini
   yaratganda, bu amal `service_role` kalitini talab qiladi — bu kalit hech
   qachon frontendga chiqarilmasligi kerak, shuning uchun bu ishni server
   tomonlama Edge Function bajaradi.

   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <sizning-project-ref>
   supabase functions deploy create-teacher
   ```

   Function avtomatik ravishda loyihangizning `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` va `SUPABASE_ANON_KEY` maxfiy
   o'zgaruvchilaridan foydalanadi (Supabase bularni har bir funksiyaga
   avtomatik taqdim etadi).

   Agar Edge Function joylashtirishni istamasangiz, muqobil variant:
   yangi o'qituvchilarni Supabase Dashboard > Authentication > **Add user**
   orqali qo'lda yarating (metadata'ga `role: teacher` qo'shish shart emas,
   chunki standart rol allaqachon `teacher`), keyin ular ilovaga shu
   login/parol bilan kirishadi.

## 3) Loyiha tuzilishi

```
src/
  lib/supabase.ts        Supabase klient
  types/                 TypeScript turlari
  stores/                Pinia store'lar (auth, teachers, subjects, groups, students, payments)
  views/                 Sahifalar (Login, Dashboard, Students, Groups, Subjects, Payments, Teachers)
  components/            NavBar, ConfirmDialog
  router/                Vue Router + rol asosidagi himoya
supabase/
  schema.sql              Jadvallar + RLS siyosatlari
  functions/create-teacher  Yangi o'qituvchi yaratish uchun Edge Function
```

## 4) Rollar mantig'i (qisqacha)

- **Manager**: fan/guruh/o'qituvchi CRUD, barcha o'quvchilarni ko'radi va
  ularni boshqa o'qituvchiga o'tkaza oladi, barcha to'lovlarni ko'radi.
- **Teacher**: faqat o'z guruhlari va o'z o'quvchilarini ko'radi/boshqaradi
  (qo'shish, tahrirlash, o'chirish), lekin fan/guruh yarata olmaydi va
  o'quvchini boshqa o'qituvchiga o'tkaza olmaydi — bularni faqat manager
  qiladi. Bu cheklovlar ham frontendda, ham (asosiysi) Supabase RLS
  siyosatlarida amalga oshirilgan, shuning uchun API'ni to'g'ridan-to'g'ri
  chaqirib ham chetlab o'tib bo'lmaydi.

## 5) Ishlab chiqarishga chiqarish (build)

```bash
npm run build
```

`dist/` papkasini istalgan static hosting'ga (Vercel, Netlify, Cloudflare
Pages va h.k.) joylashtirishingiz mumkin.
