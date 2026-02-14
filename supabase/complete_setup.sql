-- ============================================
-- Cupidudu 전체 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. user_wallets 테이블 (사용자 지갑/코인)
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 0,
  gender TEXT CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON user_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON user_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. user_profiles 테이블 (사용자 프로필 - 기본 + 상세 정보)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER CHECK (age >= 1 AND age <= 120),
  contact TEXT,
  email TEXT,
  username TEXT UNIQUE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  job TEXT,
  introduction TEXT,
  greeting TEXT,
  image_url TEXT,
  mbti TEXT,
  company_name TEXT,
  residence TEXT,
  school_name TEXT,
  height_cm INTEGER CHECK (height_cm >= 100 AND height_cm <= 250),
  weight_kg INTEGER CHECK (weight_kg >= 30 AND weight_kg <= 200),
  hobbies TEXT,
  assets TEXT,
  personality TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- 3. profile_cards 테이블 (프로필 카드)
CREATE TABLE IF NOT EXISTS profile_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  job TEXT,
  image_url TEXT,
  greeting TEXT,
  age INTEGER,
  mbti TEXT,
  introduction TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  company_name TEXT,
  residence TEXT,
  school_name TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  hobbies TEXT,
  assets TEXT,
  personality TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profile_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profile cards"
  ON profile_cards FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile card"
  ON profile_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile card"
  ON profile_cards FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. delivered_cards 테이블 (배달된 카드)
CREATE TABLE IF NOT EXISTS delivered_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES profile_cards(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  manager_comment TEXT,
  viewed_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE delivered_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own delivered cards"
  ON delivered_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own delivered cards"
  ON delivered_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_delivered_cards_user_id ON delivered_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_delivered_cards_card_id ON delivered_cards(card_id);

-- 5. payment_confirmations 테이블 (결제 확인)
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment confirmations"
  ON payment_confirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment confirmations"
  ON payment_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Functions (함수)
-- ============================================

-- 사용자 성별 설정 함수
CREATE OR REPLACE FUNCTION set_user_gender(p_user_id UUID, p_gender TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_wallets (user_id, gender, coins)
  VALUES (p_user_id, p_gender, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET gender = p_gender, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 코인 추가 함수
CREATE OR REPLACE FUNCTION add_coins_to_wallet(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_wallets (user_id, coins)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET coins = user_wallets.coins + p_amount, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 코인으로 카드 잠금 해제 함수
CREATE OR REPLACE FUNCTION unlock_card_with_coin(
  p_user_id UUID,
  p_card_id UUID,
  p_coin_cost INTEGER
)
RETURNS JSONB AS $$
DECLARE
  current_coins INTEGER;
  new_coins INTEGER;
BEGIN
  SELECT coins INTO current_coins
  FROM user_wallets
  WHERE user_id = p_user_id;

  IF current_coins IS NULL OR current_coins < p_coin_cost THEN
    RETURN jsonb_build_object('success', false, 'message', '코인이 부족합니다');
  END IF;

  new_coins := current_coins - p_coin_cost;

  UPDATE user_wallets
  SET coins = new_coins, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'remaining_coins', new_coins);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 배달된 카드 프로필 가져오기 함수
CREATE OR REPLACE FUNCTION get_delivered_card_profile(
  p_delivered_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  card_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', pc.id,
    'full_name', pc.full_name,
    'job', pc.job,
    'image_url', pc.image_url,
    'greeting', pc.greeting,
    'age', pc.age,
    'mbti', pc.mbti,
    'introduction', pc.introduction,
    'company_name', pc.company_name,
    'residence', pc.residence,
    'school_name', pc.school_name,
    'height_cm', pc.height_cm,
    'weight_kg', pc.weight_kg,
    'hobbies', pc.hobbies,
    'assets', pc.assets,
    'personality', pc.personality
  ) INTO card_data
  FROM delivered_cards dc
  JOIN profile_cards pc ON dc.card_id = pc.id
  WHERE dc.id = p_delivered_id AND dc.user_id = p_user_id;

  RETURN card_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 완료!
-- ============================================
-- 이 SQL을 Supabase SQL Editor에 복사해서 실행하세요.
-- 모든 테이블, 정책, 함수가 생성됩니다.
