/**
 * 영어 에러 메시지를 한국어로 변환.
 * err는 Error 객체 또는 문자열. unknown일 경우 fallback 사용.
 */
export function translateError(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "오류가 발생했습니다.";

  const errorMap: Record<string, string> = {
    "Invalid login credentials": "아이디 또는 비밀번호가 올바르지 않습니다.",
    "Email not confirmed": "이메일 인증이 완료되지 않았습니다.",
    "Email logins are disabled": "이메일 로그인이 비활성화되어 있습니다. 관리자에게 문의하세요.",
    "Invalid email": "올바르지 않은 이메일 형식입니다.",
    "User not found": "존재하지 않는 사용자입니다.",
    "Invalid password": "비밀번호가 올바르지 않습니다.",
    "Password should be at least 6 characters": "비밀번호는 최소 6자 이상이어야 합니다.",
    "User already registered": "이미 가입된 사용자입니다.",
    "Unable to validate email address": "이메일 주소를 확인할 수 없습니다.",
    "Signup requires a valid password": "올바른 비밀번호를 입력해주세요.",
  };

  if (errorMap[message]) return errorMap[message];

  for (const [eng, kor] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(eng.toLowerCase())) return kor;
  }

  return message;
}
