-- 새로고침 방어 + 데이터 무결성: 코인 차감·카드 잠금해제를 트랜잭션 하나로 처리
-- Supabase SQL Editor에서 실행하세요.

-- 필요한 코인 (매칭 1회 비용, 필요 시 상수 테이블로 관리)
-- 여기서는 1코인으로 가정. 필요 시 COIN_COST 상수 변경.
CREATE OR REPLACE FUNCTION unlock_card_with_coin(p_delivered_card_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_coins int;
  v_coin_cost int := 1;
  v_new_coins int;
BEGIN
  -- 1) 트랜잭션 내에서만 처리 (새로고침/중복 요청 시에도 일관성 유지)
  SELECT user_id INTO v_user_id
  FROM delivered_cards
  WHERE id = p_delivered_card_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'DELIVERED_CARD_NOT_FOUND' USING errcode = 'P0001';
  END IF;

  -- 2) 이미 잠금 해제된 카드면 성공 처리 (멱등)
  IF EXISTS (
    SELECT 1 FROM delivered_cards
    WHERE id = p_delivered_card_id AND status = 'paid'
  ) THEN
    SELECT coins INTO v_current_coins FROM user_wallets WHERE user_id = v_user_id;
    RETURN jsonb_build_object('new_balance', COALESCE(v_current_coins, 0));
  END IF;

  -- 3) 잔액 조회 (DB 내부에서만 확인)
  SELECT coins INTO v_current_coins
  FROM user_wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  v_current_coins := COALESCE(v_current_coins, 0);

  IF v_current_coins < v_coin_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_COIN' USING errcode = 'P0002';
  END IF;

  v_new_coins := v_current_coins - v_coin_cost;

  -- 4) 코인 차감 (DB 내부에서만 차감)
  INSERT INTO user_wallets (user_id, coins)
  VALUES (v_user_id, v_new_coins)
  ON CONFLICT (user_id)
  DO UPDATE SET coins = v_new_coins;

  -- 5) 카드 잠금 해제
  UPDATE delivered_cards
  SET status = 'paid'
  WHERE id = p_delivered_card_id AND user_id = v_user_id;

  RETURN jsonb_build_object('new_balance', v_new_coins);
END;
$$;

-- RLS가 켜져 있어도 SECURITY DEFINER로 인해 서버 로직이 안전하게 실행됩니다.
