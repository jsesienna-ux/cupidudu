-- 기존 user_profiles 테이블 완전 삭제 및 재생성

-- 1. 기존 테이블 삭제 (모든 정책, 인덱스 포함)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. user_profiles 테이블 새로 생성
CREATE TABLE user_profiles (
  -- 기본 정보 (회원가입 시 입력)
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL, -- 로그인 아이디
  full_name text NOT NULL, -- 이름
  gender text NOT NULL CHECK (gender IN ('male', 'female')), -- 성별
  age int, -- 나이 (생년월일에서 계산)
  contact text NOT NULL, -- 연락처
  email text, -- 이메일
  
  -- 상세 정보 (마이페이지에서 나중에 작성)
  job text, -- 직업
  introduction text, -- 소개
  greeting text, -- 한마디
  image_url text, -- 프로필 사진
  mbti text, -- MBTI
  company_name text, -- 회사
  residence text, -- 거주지
  school_name text, -- 학교
  height_cm int, -- 키
  weight_kg int, -- 몸무게
  hobbies text, -- 취미
  assets text, -- 자산
  personality text, -- 성격
  
  -- 타임스탬프
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. 인덱스 생성
CREATE UNIQUE INDEX user_profiles_username_lower_idx ON user_profiles (LOWER(username));
CREATE INDEX user_profiles_gender_idx ON user_profiles (gender);
CREATE INDEX user_profiles_created_at_idx ON user_profiles (created_at);

-- 4. RLS 비활성화 (개발 편의를 위해)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 5. 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
