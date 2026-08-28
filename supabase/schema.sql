-- StudyPlanner multi-user foundation
-- Run in a Supabase PostgreSQL project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  category text not null,
  subtitle text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  name text not null,
  display_order integer not null default 0
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  parent_id uuid references public.topics(id) on delete cascade,
  name text not null,
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  importance smallint not null default 3 check (importance between 1 and 5),
  display_order integer not null default 0
);

create table if not exists public.user_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete restrict,
  target_date date,
  daily_minutes integer not null default 240 check (daily_minutes between 15 and 1440),
  preparation_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_exams_user_exam_idx on public.user_exams(user_id, exam_id);

create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  completion numeric(5,2) not null default 0 check (completion between 0 and 100),
  accuracy numeric(5,2) not null default 0 check (accuracy between 0 and 100),
  mastery numeric(5,2) not null default 0 check (mastery between 0 and 100),
  confidence smallint check (confidence between 1 and 5),
  last_studied_at timestamptz,
  next_revision_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, topic_id)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  planned_minutes integer not null default 0 check (planned_minutes >= 0),
  actual_minutes integer not null default 0 check (actual_minutes >= 0),
  status text not null default 'planned' check (status in ('planned','in_progress','completed','skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists topic_progress_user_idx on public.topic_progress(user_id);
create index if not exists topic_progress_revision_idx on public.topic_progress(user_id, next_revision_at);
create index if not exists study_sessions_user_date_idx on public.study_sessions(user_id, created_at desc);
create index if not exists topics_subject_order_idx on public.topics(subject_id, display_order);

alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.user_exams enable row level security;
alter table public.topic_progress enable row level security;
alter table public.study_sessions enable row level security;

-- Shared exam catalogue is readable; user-owned records are private.
drop policy if exists exams_read on public.exams;
create policy exams_read on public.exams for select using (active = true);

drop policy if exists subjects_read on public.subjects;
create policy subjects_read on public.subjects for select using (true);

drop policy if exists topics_read on public.topics;
create policy topics_read on public.topics for select using (true);

 drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists user_exams_self on public.user_exams;
create policy user_exams_self on public.user_exams for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists topic_progress_self on public.topic_progress;
create policy topic_progress_self on public.topic_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists study_sessions_self on public.study_sessions;
create policy study_sessions_self on public.study_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Create a profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
