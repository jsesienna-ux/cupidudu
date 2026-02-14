-- user_profiles 확장: 이름, 나이, 연락처 + 상세정보
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age int;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS contact text;

-- 상세정보 (마이페이지에서 작성)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS introduction text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS greeting text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mbti text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS residence text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS school_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS height_cm int;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weight_kg int;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hobbies text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS assets text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS personality text;
