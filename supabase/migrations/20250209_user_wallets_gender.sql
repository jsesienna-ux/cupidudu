-- user_wallets에 gender 컬럼 추가 ('male' | 'female')
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female'));

-- 성별 설정 RPC (가입 시/프로필 수정 시 - 기존 coins 유지)
CREATE OR REPLACE FUNCTION set_user_gender(p_user_id uuid, p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'Invalid gender';
  END IF;
  INSERT INTO user_wallets (user_id, coins, gender)
  VALUES (p_user_id, 0, p_gender)
  ON CONFLICT (user_id) DO UPDATE SET gender = EXCLUDED.gender;
END;
$$;
