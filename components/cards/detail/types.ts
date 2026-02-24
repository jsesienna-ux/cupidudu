export type Profile = {
  id: string;
  full_name: string;
  job: string | null;
  image_url: string | null;
  greeting: string | null;
  age: number | null;
  mbti: string | null;
  introduction: string | null;
  company_name?: string | null;
  residence?: string | null;
  school_name?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  hobbies?: string | null;
  assets?: string | null;
  personality?: string | null;
};

export type Card = {
  id: string;
  user_id: string;
  status: string;
  manager_comment: string | null;
  created_at?: string;
  profile: Profile;
};
