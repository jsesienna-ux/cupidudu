-- delivered_cards: 확인한 날짜, 열람/미열람

ALTER TABLE delivered_cards ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE delivered_cards ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;
