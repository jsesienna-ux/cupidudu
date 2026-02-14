-- 결제 검증 멱등성: 같은 paymentId로 중복 적립 방지
-- Supabase SQL Editor에서 실행하세요.

CREATE TABLE IF NOT EXISTS payment_confirmations (
  payment_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_added int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: anon/authenticated는 접근 불가, service_role만 접근 (결제 검증 API 전용)
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role only"
  ON payment_confirmations
  FOR ALL
  USING (false)
  WITH CHECK (false);
