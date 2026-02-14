-- 프로필 카드 잠금 해제 (코인 5개 차감)
-- target_card_id: delivered_cards.id, target_user_id: 현재 로그인한 사용자(카드 수신자) ID

CREATE OR REPLACE FUNCTION unlock_profile_card(target_card_id uuid, target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_coins int;
  v_coin_cost int := 5;
  v_new_coins int;
BEGIN
  SELECT user_id INTO v_user_id
  FROM delivered_cards
  WHERE id = target_card_id AND user_id = target_user_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'DELIVERED_CARD_NOT_FOUND' USING errcode = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM delivered_cards
    WHERE id = target_card_id AND status = 'paid'
  ) THEN
    SELECT coins INTO v_current_coins FROM user_wallets WHERE user_id = v_user_id;
    RETURN jsonb_build_object('new_balance', COALESCE(v_current_coins, 0), 'new_coins', COALESCE(v_current_coins, 0));
  END IF;

  SELECT coins INTO v_current_coins
  FROM user_wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  v_current_coins := COALESCE(v_current_coins, 0);

  IF v_current_coins < v_coin_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_COIN' USING errcode = 'P0002';
  END IF;

  v_new_coins := v_current_coins - v_coin_cost;

  INSERT INTO user_wallets (user_id, coins)
  VALUES (v_user_id, v_new_coins)
  ON CONFLICT (user_id)
  DO UPDATE SET coins = v_new_coins;

  UPDATE delivered_cards
  SET status = 'paid'
  WHERE id = target_card_id AND user_id = v_user_id;

  RETURN jsonb_build_object('new_balance', v_new_coins, 'new_coins', v_new_coins);
END;
$$;
