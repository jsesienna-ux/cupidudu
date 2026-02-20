-- Onboarding 상세정보 확장 컬럼
alter table public.user_profiles
  add column if not exists birth_year int,
  add column if not exists occupation_group text,
  add column if not exists education_level text,
  add column if not exists marital_status text,
  add column if not exists children_status text,
  add column if not exists body_type text,
  add column if not exists smoking_status text,
  add column if not exists drinking_status text,
  add column if not exists religion text,
  add column if not exists marriage_timeline text,
  add column if not exists partner_children_acceptance text,
  add column if not exists spouse_summary text,
  add column if not exists profile_images jsonb default '[]'::jsonb,
  add column if not exists interests jsonb default '[]'::jsonb,
  add column if not exists interest_other text,
  add column if not exists relationship_status text;

