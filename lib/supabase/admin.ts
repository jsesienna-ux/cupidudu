import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용. RLS를 우회해 user_wallets 등을 갱신할 때만 사용하세요.
 * Supabase SERVICE_ROLE_KEY는 RLS 정책에 관계없이 모든 테이블에 읽기/쓰기 가능합니다.
 * .env.local에 SUPABASE_SERVICE_ROLE_KEY를 반드시 설정하세요.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for admin client.");
  }
  return createClient(url, key);
}
