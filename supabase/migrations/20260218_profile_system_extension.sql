-- Safe extension migration for profile system
-- - Keep existing user_profiles
-- - Add missing columns only
-- - Add new tables for verification/survey/badges/internal/audit
-- - Add public view + RLS + indexes

begin;

create extension if not exists pgcrypto;

-- ===== 1) user_profiles: add missing columns only =====
alter table public.user_profiles
  add column if not exists membership_level text default 'REGULAR',
  add column if not exists profile_status text default 'DRAFT',
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists is_admin boolean default false,
  -- legacy compatibility for current app code
  add column if not exists membership_grade text,
  add column if not exists approval_status text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_membership_level_chk'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_membership_level_chk
      check (membership_level in ('REGULAR','VERIFIED','VIP'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_profile_status_chk'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_profile_status_chk
      check (profile_status in ('DRAFT','PENDING','APPROVED','REJECTED','SUSPENDED'));
  end if;
end $$;

update public.user_profiles
set membership_level = coalesce(membership_level, 'REGULAR'),
    profile_status = coalesce(profile_status, 'DRAFT');

-- keep legacy/new columns in sync for existing rows (one-time normalization)
update public.user_profiles
set
  profile_status = coalesce(profile_status, case when approval_status = 'approved' then 'APPROVED' else profile_status end),
  membership_level = coalesce(
    membership_level,
    case membership_grade
      when 'VIP회원' then 'VIP'
      when '우수회원' then 'VERIFIED'
      when '정회원' then 'REGULAR'
      else membership_level
    end
  );

-- ===== 2) new tables =====
create table if not exists public.profile_verifications (
  user_id uuid primary key references public.user_profiles(user_id) on delete cascade,
  phone_verified boolean not null default false,
  id_verified boolean not null default false,
  selfie_verified boolean not null default false,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.values_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  type text not null check (type in ('single','multi','scale','text')),
  options jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.values_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  question_id uuid not null references public.values_questions(id) on delete cascade,
  answer jsonb not null,
  score int,
  created_at timestamptz not null default now()
);

create unique index if not exists values_answers_user_question_uniq
  on public.values_answers(user_id, question_id);

create table if not exists public.badges (
  badge_code text primary key,
  category text not null,
  label text not null,
  description text,
  is_public boolean not null default true,
  icon text,
  sort_order int not null default 0
);

create table if not exists public.user_badges (
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  badge_code text not null references public.badges(badge_code) on delete cascade,
  granted_by uuid,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  note text,
  primary key (user_id, badge_code)
);

create table if not exists public.internal_scores (
  user_id uuid primary key references public.user_profiles(user_id) on delete cascade,
  manners_score int check (manners_score between 0 and 100),
  photo_real_score int check (photo_real_score between 0 and 100),
  manager_notes text,
  last_reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  action text not null,
  target_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ===== 3) updated_at trigger helper =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_profile_verifications_set_updated_at') then
    create trigger trg_profile_verifications_set_updated_at
    before update on public.profile_verifications
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_internal_scores_set_updated_at') then
    create trigger trg_internal_scores_set_updated_at
    before update on public.internal_scores
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- ===== 4) public profile view (approved only) =====
create or replace view public.public_profiles_view as
select
  up.user_id,
  up.membership_level,
  up.profile_status,
  up.full_name,
  up.gender,
  up.age,
  up.image_url,
  up.mbti,
  up.job,
  up.school_name,
  up.residence,
  up.height_cm,
  up.greeting,
  up.introduction,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'badge_code', b.badge_code,
        'label', b.label,
        'category', b.category,
        'icon', b.icon,
        'sort_order', b.sort_order
      )
      order by b.sort_order, b.badge_code
    ) filter (where b.badge_code is not null),
    '[]'::jsonb
  ) as public_badges
from public.user_profiles up
left join public.user_badges ub
  on ub.user_id = up.user_id
 and (ub.expires_at is null or ub.expires_at > now())
left join public.badges b
  on b.badge_code = ub.badge_code
 and b.is_public = true
where up.profile_status = 'APPROVED'
group by
  up.user_id, up.membership_level, up.profile_status,
  up.full_name, up.gender, up.age, up.image_url,
  up.mbti, up.job, up.school_name, up.residence,
  up.height_cm, up.greeting, up.introduction;

grant select on public.public_profiles_view to anon, authenticated;

-- ===== 5) RLS =====
alter table public.user_profiles enable row level security;
alter table public.profile_verifications enable row level security;
alter table public.values_questions enable row level security;
alter table public.values_answers enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.internal_scores enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.user_id = p_user_id
      and coalesce(up.is_admin, false) = true
  );
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='user_profiles_select_own_or_admin') then
    create policy user_profiles_select_own_or_admin
      on public.user_profiles
      for select
      using (auth.uid() = user_id or public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='user_profiles_update_own_or_admin') then
    create policy user_profiles_update_own_or_admin
      on public.user_profiles
      for update
      using (auth.uid() = user_id or public.is_admin_user(auth.uid()))
      with check (auth.uid() = user_id or public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_verifications' and policyname='profile_verifications_select_own_or_admin') then
    create policy profile_verifications_select_own_or_admin
      on public.profile_verifications
      for select
      using (auth.uid() = user_id or public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_verifications' and policyname='profile_verifications_upsert_own_or_admin') then
    create policy profile_verifications_upsert_own_or_admin
      on public.profile_verifications
      for all
      using (auth.uid() = user_id or public.is_admin_user(auth.uid()))
      with check (auth.uid() = user_id or public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='values_questions' and policyname='values_questions_select_authenticated') then
    create policy values_questions_select_authenticated
      on public.values_questions
      for select to authenticated
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='values_questions' and policyname='values_questions_admin_write') then
    create policy values_questions_admin_write
      on public.values_questions
      for all
      using (public.is_admin_user(auth.uid()))
      with check (public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='values_answers' and policyname='values_answers_select_own_or_admin') then
    create policy values_answers_select_own_or_admin
      on public.values_answers
      for select
      using (auth.uid() = user_id or public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='values_answers' and policyname='values_answers_insert_own') then
    create policy values_answers_insert_own
      on public.values_answers
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='values_answers' and policyname='values_answers_update_own') then
    create policy values_answers_update_own
      on public.values_answers
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='values_answers' and policyname='values_answers_delete_own') then
    create policy values_answers_delete_own
      on public.values_answers
      for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='badges' and policyname='badges_select_authenticated') then
    create policy badges_select_authenticated
      on public.badges
      for select to authenticated
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='badges' and policyname='badges_admin_write') then
    create policy badges_admin_write
      on public.badges
      for all
      using (public.is_admin_user(auth.uid()))
      with check (public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_badges' and policyname='user_badges_select_own_or_admin') then
    create policy user_badges_select_own_or_admin
      on public.user_badges
      for select
      using (auth.uid() = user_id or public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_badges' and policyname='user_badges_admin_write') then
    create policy user_badges_admin_write
      on public.user_badges
      for all
      using (public.is_admin_user(auth.uid()))
      with check (public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='internal_scores' and policyname='internal_scores_admin_only') then
    create policy internal_scores_admin_only
      on public.internal_scores
      for all
      using (public.is_admin_user(auth.uid()))
      with check (public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_log' and policyname='audit_log_admin_select') then
    create policy audit_log_admin_select
      on public.audit_log
      for select
      using (public.is_admin_user(auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='audit_log' and policyname='audit_log_admin_insert') then
    create policy audit_log_admin_insert
      on public.audit_log
      for insert
      with check (public.is_admin_user(auth.uid()));
  end if;
end $$;

-- ===== 6) indexes =====
create index if not exists idx_user_profiles_profile_status
  on public.user_profiles(profile_status);

create index if not exists idx_user_profiles_membership_level
  on public.user_profiles(membership_level);

create index if not exists idx_values_answers_user_id
  on public.values_answers(user_id);

create index if not exists idx_user_badges_user_id
  on public.user_badges(user_id);

create index if not exists idx_user_badges_badge_code
  on public.user_badges(badge_code);

commit;
