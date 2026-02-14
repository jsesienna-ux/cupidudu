/** Supabase 프로젝트 도메인 사용 (검증 통과용). auth.cupidudu.app 등은 invalid로 거부됨 */
function getAuthEmailDomain(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    try {
      return new URL(url).hostname;
    } catch {
      //
    }
  }
  return "ykwtjurktmwuuxjjeovh.supabase.co";
}

/** 로그인 시 입력값(아이디 또는 이메일)을 Supabase Auth용 이메일로 변환 */
export function toAuthEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  return trimmed.toLowerCase() + "@" + getAuthEmailDomain();
}
