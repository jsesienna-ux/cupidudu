-- 결제 확인 후 코인을 원자적으로 증가시키는 함수
-- 동시 요청 시에도 coins가 정확히 증가합니다.

CREATE OR REPLACE FUNCTION add_coins_to_wallet(p_user_id uuid, p_coins_to_add int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_coins int;
BEGIN
  IF p_coins_to_add IS NULL OR p_coins_to_add <= 0 THEN
    RAISE EXCEPTION 'COINS_MUST_BE_POSITIVE' USING errcode = 'P0003';
  END IF;

  INSERT INTO user_wallets (user_id, coins)
  VALUES (p_user_id, p_coins_to_add)
  ON CONFLICT (user_id)
  DO UPDATE SET coins = user_wallets.coins + p_coins_to_add;

  SELECT coins INTO v_new_coins FROM user_wallets WHERE user_id = p_user_id;
  RETURN COALESCE(v_new_coins, 0);
END;
$$;
