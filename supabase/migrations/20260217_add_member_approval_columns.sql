-- 회원 승인 상태/등급 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS membership_grade text;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 기존 상세정보 작성자 기본값 정리 (선택)
UPDATE user_profiles
SET approval_status = 'pending'
WHERE approval_status IS NULL;
