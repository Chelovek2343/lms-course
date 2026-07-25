-- ============================================================
-- LMS Course Platform — Database Schema
-- Supabase (PostgreSQL)
-- ============================================================
-- Run this whole file in Supabase → SQL Editor → New query → Run
-- ============================================================


-- ============================================================
-- TABLE: profiles
-- One row per user, mirrors auth.users, adds role info
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'student',
  created_at timestamp with time zone default now()
);

-- Automatically create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- TABLE: courses
-- ============================================================
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric default 0,
  author_id uuid references auth.users on delete set null,
  is_published boolean default false,
  created_at timestamp with time zone default now()
);


-- ============================================================
-- TABLE: sections
-- Groups of lessons within a course
-- ============================================================
create table if not exists sections (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  order_index integer default 0
);


-- ============================================================
-- TABLE: lessons
-- ============================================================
create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  section_id uuid references sections(id) on delete cascade,
  title text not null,
  content text,
  hls_key text,          -- storage key for uploaded video
  order_index integer default 0
);


-- ============================================================
-- TABLE: lesson_files
-- Files attached to a lesson (PDFs, resources, etc.)
-- ============================================================
create table if not exists lesson_files (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade,
  name text,
  file_key text,
  file_size bigint,
  file_type text,
  created_at timestamp with time zone default now()
);


-- ============================================================
-- TABLE: enrollments
-- Created via Stripe webhook after successful payment
-- ============================================================
create table if not exists enrollments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, course_id)
);


-- ============================================================
-- TABLE: progress
-- Tracks per-user, per-lesson completion
-- ============================================================
create table if not exists progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  completed boolean default false,
  watch_pct numeric default 0,
  unique(user_id, lesson_id)
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- profiles
alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- courses
alter table courses enable row level security;

drop policy if exists "Anyone can view published courses" on courses;
create policy "Anyone can view published courses"
  on courses for select
  using (is_published = true);

drop policy if exists "Admins can do everything with courses" on courses;
create policy "Admins can do everything with courses"
  on courses for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- sections
alter table sections enable row level security;

drop policy if exists "Anyone can view sections" on sections;
create policy "Anyone can view sections"
  on sections for select
  using (true);

-- lessons
alter table lessons enable row level security;

drop policy if exists "Anyone can view lessons" on lessons;
create policy "Anyone can view lessons"
  on lessons for select
  using (true);

-- lesson_files
alter table lesson_files enable row level security;

drop policy if exists "Anyone can view lesson files" on lesson_files;
create policy "Anyone can view lesson files"
  on lesson_files for select
  using (true);

-- enrollments
alter table enrollments enable row level security;

drop policy if exists "Users can view own enrollments" on enrollments;
create policy "Users can view own enrollments"
  on enrollments for select
  using (auth.uid() = user_id);

-- progress
alter table progress enable row level security;

drop policy if exists "Users can manage own progress" on progress;
create policy "Users can manage own progress"
  on progress for all
  using (auth.uid() = user_id);


-- ============================================================
-- NOTES
-- ============================================================
-- 1. sections / lessons / lesson_files are currently readable by
--    anyone (no enrollment check). Tighten these later if you want
--    lesson content restricted to enrolled students only, e.g.:
--
--    create policy "Enrolled users can view lessons"
--      on lessons for select
--      using (
--        exists (
--          select 1 from enrollments e
--          join sections s on s.id = lessons.section_id
--          where e.course_id = s.course_id and e.user_id = auth.uid()
--        )
--      );
--
-- 2. Writes to courses/sections/lessons/lesson_files from the admin
--    pages currently go through the client (anon key + RLS "admin"
--    check on courses only). Consider adding matching admin-only
--    write policies on sections/lessons/lesson_files, or route all
--    admin writes through a server route using SUPABASE_SERVICE_KEY.
--
-- 3. Required environment variables (Vercel):
--    NEXT_PUBLIC_SUPABASE_URL
--    NEXT_PUBLIC_SUPABASE_ANON_KEY
--    SUPABASE_SERVICE_KEY
--    STRIPE_SECRET_KEY
--    STRIPE_WEBHOOK_SECRET
--    NEXT_PUBLIC_SITE_URL
-- ============================================================
