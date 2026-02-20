-- ===== 마이그레이션 검증용 체크 SQL =====
-- 실행 방법: Supabase SQL Editor에 붙여넣고 Run

-- 1) user_profiles 새 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('membership_level', 'profile_status', 'approved_at', 'submitted_at', 'last_reviewed_at', 'rejected_reason', 'is_admin', 'membership_grade', 'approval_status')
ORDER BY column_name;

-- 2) 새 테이블 존재 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profile_verifications',
    'values_questions',
    'values_answers',
    'badges',
    'user_badges',
    'internal_scores',
    'audit_log'
  )
ORDER BY table_name;

-- 3) public_profiles_view 존재 확인
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'public_profiles_view';

-- 4) RLS 정책 확인
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'profile_verifications',
    'values_questions',
    'values_answers',
    'badges',
    'user_badges',
    'internal_scores',
    'audit_log'
  )
ORDER BY tablename, policyname;

-- 5) 인덱스 확인
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'values_answers',
    'user_badges'
  )
ORDER BY tablename, indexname;

-- 6) 함수 확인
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('set_updated_at', 'is_admin_user')
ORDER BY routine_name;
