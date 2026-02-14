-- profile_cards 확장: 회사, 거주지, 학교, 키, 몸무게, 취미, 자산, 성격 등

ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS residence text;
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS school_name text;
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS height_cm int;
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS weight_kg int;
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS hobbies text;
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS assets text;
ALTER TABLE profile_cards ADD COLUMN IF NOT EXISTS personality text;
