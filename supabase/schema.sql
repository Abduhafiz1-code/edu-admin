-- =========================================================
-- EDU ADMIN PANEL — Supabase sxemasi
-- Buni Supabase Dashboard > SQL Editor ichiga to'liq nusxalab, RUN qiling.
-- =========================================================

-- 1) PROFILES: har bir auth foydalanuvchisi uchun rol va ism saqlanadi
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'teacher' check (role in ('manager', 'teacher')),
  phone text,
  created_at timestamptz not null default now()
);

-- Yangi auth.users yaratilganda avtomatik profiles qatori yaratiladi
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'teacher'),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) SUBJECTS (fanlar)
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 3) GROUPS (guruhlar)
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  monthly_price numeric not null default 0,
  created_at timestamptz not null default now()
);

-- 4) STUDENTS (o'quvchilar)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  parent_phone text,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  group_id uuid references public.groups(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- 5) PAYMENTS (oylik to'lovlar)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric not null default 0,
  month date not null, -- har doim oyning 1-kuni, masalan 2026-07-01
  paid_at timestamptz,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  created_at timestamptz not null default now(),
  unique (student_id, month)
);

-- =========================================================
-- YORDAMCHI FUNKSIYA: joriy foydalanuvchi manager ekanini tekshirish
-- =========================================================
create or replace function public.is_manager()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
  );
$$;

-- =========================================================
-- RLS YOQISH
-- =========================================================
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;

-- ---------- PROFILES ----------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists "profiles_update_own_or_manager" on public.profiles;
create policy "profiles_update_own_or_manager" on public.profiles
  for update using (id = auth.uid() or public.is_manager());

drop policy if exists "profiles_delete_manager_only" on public.profiles;
create policy "profiles_delete_manager_only" on public.profiles
  for delete using (public.is_manager());

-- ---------- SUBJECTS ----------
drop policy if exists "subjects_select_all" on public.subjects;
create policy "subjects_select_all" on public.subjects
  for select using (auth.uid() is not null);

drop policy if exists "subjects_write_manager_only" on public.subjects;
create policy "subjects_write_manager_only" on public.subjects
  for all using (public.is_manager()) with check (public.is_manager());

-- ---------- GROUPS ----------
drop policy if exists "groups_select_own_or_manager" on public.groups;
create policy "groups_select_own_or_manager" on public.groups
  for select using (teacher_id = auth.uid() or public.is_manager());

drop policy if exists "groups_write_manager_only" on public.groups;
create policy "groups_write_manager_only" on public.groups
  for all using (public.is_manager()) with check (public.is_manager());

-- ---------- STUDENTS ----------
-- teacher: faqat o'ziniki; manager: hammasi
drop policy if exists "students_select_own_or_manager" on public.students;
create policy "students_select_own_or_manager" on public.students
  for select using (teacher_id = auth.uid() or public.is_manager());

drop policy if exists "students_insert_own_or_manager" on public.students;
create policy "students_insert_own_or_manager" on public.students
  for insert with check (teacher_id = auth.uid() or public.is_manager());

-- teacher o'z o'quvchisini tahrirlay oladi, lekin teacher_id ni o'zgartira olmaydi (buni faqat manager qila oladi)
drop policy if exists "students_update_own_or_manager" on public.students;
create policy "students_update_own_or_manager" on public.students
  for update using (teacher_id = auth.uid() or public.is_manager())
  with check (public.is_manager() or teacher_id = auth.uid());

drop policy if exists "students_delete_own_or_manager" on public.students;
create policy "students_delete_own_or_manager" on public.students
  for delete using (teacher_id = auth.uid() or public.is_manager());

-- ---------- PAYMENTS ----------
drop policy if exists "payments_select_own_or_manager" on public.payments;
create policy "payments_select_own_or_manager" on public.payments
  for select using (
    public.is_manager() or exists (
      select 1 from public.students st
      where st.id = payments.student_id and st.teacher_id = auth.uid()
    )
  );

drop policy if exists "payments_write_own_or_manager" on public.payments;
create policy "payments_write_own_or_manager" on public.payments
  for all using (
    public.is_manager() or exists (
      select 1 from public.students st
      where st.id = payments.student_id and st.teacher_id = auth.uid()
    )
  ) with check (
    public.is_manager() or exists (
      select 1 from public.students st
      where st.id = payments.student_id and st.teacher_id = auth.uid()
    )
  );

-- =========================================================
-- BIRINCHI MENEJERNI QO'LYA QILISH
-- Avval oddiy foydalanuvchi sifatida ro'yxatdan o'ting (yoki Dashboard >
-- Authentication > Add user orqali yarating), keyin quyidagi so'rovni
-- o'sha foydalanuvchining email'i bilan ishga tushiring:
-- =========================================================
-- update public.profiles set role = 'manager'
-- where id = (select id from auth.users where email = 'manager@misol.uz');
