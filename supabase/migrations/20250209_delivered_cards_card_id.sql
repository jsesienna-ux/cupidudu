-- delivered_cards에 card_id 추가 (profile_cards.id 참조)
-- 카드 도착 시 프로필 정보를 가져오기 위해 필요

ALTER TABLE delivered_cards ADD COLUMN IF NOT EXISTS card_id uuid;

-- 참조 제약은 profile_cards 테이블 구조에 맞게 필요시 추가
