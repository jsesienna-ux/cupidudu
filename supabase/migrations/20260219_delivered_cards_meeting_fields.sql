-- delivered_cards 미팅 상태 관리용 컬럼
alter table public.delivered_cards
  add column if not exists meeting_at timestamptz,
  add column if not exists meeting_completed_at timestamptz;

