-- user_profiles에 로그인용 아이디(username) 추가 (대소문자 구분 없이 고유)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_lower_idx ON user_profiles (lower(username)) WHERE username IS NOT NULL;

-- 연락용 이메일 (선택)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email text;
