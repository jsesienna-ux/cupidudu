-- payment_confirmations에 결제 금액(amount) 컬럼 추가 (수익 기록/영수증용)
ALTER TABLE payment_confirmations
ADD COLUMN IF NOT EXISTS amount int;
