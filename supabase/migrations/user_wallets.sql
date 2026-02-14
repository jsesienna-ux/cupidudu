-- user_wallets 테이블: 유저별 코인 잔액
-- user_id가 PK이므로 upsert(onConflict: 'user_id') 사용 가능

CREATE TABLE IF NOT EXISTS user_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins int NOT NULL DEFAULT 0
);

-- RLS: service_role은 Supabase에서 자동으로 RLS 우회 (SERVICE_ROLE_KEY 사용 시)
