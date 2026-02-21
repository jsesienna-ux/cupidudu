import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type GetCurrentUserResult = {
  user: User | null;
  error: { message: string } | null;
};

/**
 * Server-side에서 현재 로그인 유저를 가져온다.
 * createClient(server) + auth.getUser() 패턴과 동일.
 */
export async function getCurrentUser(): Promise<GetCurrentUserResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  return {
    user: user ?? null,
    error: error ? { message: error.message } : null,
  };
}

/*
  === 사용 예시 ===

  // Server Component / Route Handler
  const { user, error } = await getCurrentUser();
  if (error) {
    // 에러 처리 (네트워크/세션 오류 등)
  }
  if (!user) {
    // 비로그인
  }
  // user.id, user.email 등 사용
*/
