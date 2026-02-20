-- 이메일로 auth.users에서 고아 계정을 삭제하는 헬퍼 함수
-- user_profiles에 해당 username이 없는 경우에만 호출됨
CREATE OR REPLACE FUNCTION delete_orphan_auth_user(target_email text)
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE email = lower(target_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
