-- 성별 기반 매칭: 여자회원→남자프로필, 남자회원→여자프로필

-- 1. profile_cards에 gender 컬럼 추가 (프로필 소유자 성별: 'male' | 'female')
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS gender text;

-- 2. 회원 성별 저장용 user_profiles 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender text CHECK (gender IN ('male', 'female')),
  updated_at timestamptz DEFAULT now()
);

-- 3. RLS (본인만 조회/수정)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
