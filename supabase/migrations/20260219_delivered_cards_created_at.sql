-- delivered_cards에 created_at 추가 (delivered_at 미존재 시 대체)
ALTER TABLE delivered_cards ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
