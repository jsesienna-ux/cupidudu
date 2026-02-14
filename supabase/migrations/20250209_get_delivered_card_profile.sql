-- delivered_cards의 카드 상세(프로필) 조회 RPC
-- RLS 우회 없이, delivered_cards 접근 권한 있는 사용자만 호출 가능
-- p_delivered_id: delivered_cards.id, p_user_id: 요청자(수신자) user_id

CREATE OR REPLACE FUNCTION get_delivered_card_profile(p_delivered_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_id uuid;
  v_row jsonb;
BEGIN
  -- delivered_cards에서 card_id 가져오기 (본인 수신 카드만)
  SELECT card_id INTO v_card_id
  FROM delivered_cards
  WHERE id = p_delivered_id AND user_id = p_user_id;

  IF v_card_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- profile_cards에서 프로필 가져오기
  SELECT to_jsonb(pc.*) INTO v_row
  FROM profile_cards pc
  WHERE pc.id = v_card_id;

  RETURN v_row;
END;
$$;
