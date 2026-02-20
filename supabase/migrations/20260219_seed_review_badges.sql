-- 관리자 리뷰용 배지 마스터 데이터
-- 이미 존재하면 최신 라벨/카테고리로 갱신

insert into public.badges (badge_code, category, label, description, is_public, icon, sort_order)
values
  -- 결혼의지
  ('MARRIAGE_INTENT_1Y', 'commitment', '1년 내 결혼 의지', '1년 내 결혼 계획이 명확한 회원', true, '💍', 10),
  ('MARRIAGE_INTENT_2Y', 'commitment', '2년 내 결혼 의지', '2년 내 결혼 계획이 있는 회원', true, '🗓️', 11),
  ('REMARRIAGE_READY', 'commitment', '재혼 준비 완료', '재혼에 대한 의지가 명확한 회원', true, '🤝', 12),

  -- 가치관
  ('VALUE_ACCEPT_CHILD', 'values', '자녀 수용 가능', '자녀 계획/수용 가능', true, '👶', 20),
  ('VALUE_FINANCE_TRANSPARENT', 'values', '경제관 투명', '경제관/재정관이 투명한 회원', true, '💸', 21),
  ('VALUE_PARENT_INDEPENDENT', 'values', '부모 독립성 명확', '부모와의 독립성 기준이 명확한 회원', true, '🏠', 22),
  ('VALUE_LONG_DISTANCE_OK', 'values', '장거리 가능', '장거리 만남/거주 이전 가능', true, '🚄', 23),

  -- 매니저 추천
  ('MANAGER_MEETING_DONE', 'manager', '직접 미팅 완료', '매니저와 직접 미팅 완료', true, '✅', 30),
  ('MANAGER_MANNERS_TOP', 'manager', '매너 점수 상위', '내부 매너 점수 상위 회원', true, '🌟', 31),
  ('MANAGER_PHOTO_TOP', 'manager', '실물 점수 상위', '내부 실물 점수 상위 회원', true, '📸', 32),

  -- 전문직
  ('PROFESSIONAL', 'career', '전문직', '전문직 종사 회원', true, '🧠', 40),
  ('OVERSEAS_WORK', 'career', '해외근무', '해외근무 경험/가능 회원', true, '🌍', 41),
  ('ENTREPRENEUR', 'career', '사업가', '사업/창업 관련 회원', true, '💼', 42),
  ('MASTER_PLUS', 'career', '석사 이상', '석사/박사 학력 회원', true, '🎓', 43),

  -- 인기 배지
  ('POPULAR_REVIEW_GOOD', 'lifestyle', '후기 좋음', '후기가 좋은 회원', true, '👍', 50),
  ('POPULAR_MANNER_GOOD', 'lifestyle', '매너 좋음', '매너 평가가 좋은 회원', true, '😊', 51),
  ('POPULAR_GENTLE_MAN', 'lifestyle', '다정한 에게남', '다정한 인상/피드백의 회원', true, '💗', 52),
  ('POPULAR_RELIABLE_MAN', 'lifestyle', '든든한 테토남', '든든하고 책임감 있는 회원', true, '🛡️', 53)
on conflict (badge_code) do update
set
  category = excluded.category,
  label = excluded.label,
  description = excluded.description,
  is_public = excluded.is_public,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
