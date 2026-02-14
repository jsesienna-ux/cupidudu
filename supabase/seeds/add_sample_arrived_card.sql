-- 남자/여자 프로필 분리 · 성별 반대 매칭
-- 여자회원 → 남자프로필, 남자회원 → 여자프로필
-- Supabase SQL Editor에서 실행하세요.
-- (20250209_user_wallets_gender.sql, 20250209_gender_matching.sql 적용 후 실행)

-- 0. 성별 없는 회원에게 기본 성별 부여 (user_wallets.gender)
INSERT INTO user_wallets (user_id, coins, gender)
SELECT id, 0, 'male' FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET gender = COALESCE(user_wallets.gender, EXCLUDED.gender);

-- 1. 여자 프로필 (김서연) + 2. 남자 프로필 (박지훈)
WITH female_profile AS (
  INSERT INTO profile_cards (
    id, full_name, job, image_url, greeting, age, mbti, introduction,
    company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality,
    gender
  ) VALUES (
    gen_random_uuid(), '김서연', '디자이너',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    '좋은 인연 만나뵙기를 기대합니다!', 28, 'ENFP',
    '일과 삶의 균형을 중요시해요. 주말엔 카페 탐방이나 맛집 투어를 즐겨요.',
    '디자인 스튜디오', '서울 강남', '홍익대학교', 165, 52,
    '일러스트, 사진촬영, 요가', '자차 보유', '유머 있고 밝은 성격',
    'female'
  )
  RETURNING id
),
male_profile AS (
  INSERT INTO profile_cards (
    id, full_name, job, image_url, greeting, age, mbti, introduction,
    company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality,
    gender
  ) VALUES (
    gen_random_uuid(), '박지훈', '개발자',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    '편하게 인사 나눠요!', 30, 'ISTJ',
    '코딩과 독서를 좋아해요. 누구보다 책임감 있게 임하려고 해요.',
    'IT 스타트업', '서울 송파', '서울대학교', 178, 72,
    '게임, 등산, 넷플릭스', '자차 보유', '침착하고 신중한 성격',
    'male'
  )
  RETURNING id
),
male_users AS (
  SELECT user_id FROM user_wallets WHERE gender = 'male'
),
female_users AS (
  SELECT user_id FROM user_wallets WHERE gender = 'female'
),
-- 남자회원 → 여자프로필 (김서연)
d1 AS (
  INSERT INTO delivered_cards (id, user_id, card_id, status, manager_comment, is_read)
  SELECT gen_random_uuid(), mu.user_id, fp.id, 'pending',
    '세련된 감각과 따뜻한 성격을 가진 분이에요. 강력 추천합니다!', false
  FROM female_profile fp, male_users mu
),
-- 여자회원 → 남자프로필 (박지훈)
d2 AS (
  INSERT INTO delivered_cards (id, user_id, card_id, status, manager_comment, is_read)
  SELECT gen_random_uuid(), fu.user_id, mp.id, 'pending',
    '책임감 있고 신중한 분이에요. 강력 추천합니다!', false
  FROM male_profile mp, female_users fu
)
SELECT 1;
