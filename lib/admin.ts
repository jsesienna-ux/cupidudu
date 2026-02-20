/** 관계자(어드민) 전용 인증 시스템 */

// 관리자 계정 정보 (실제 배포 시에는 환경변수로 관리 권장)
export const ADMIN_CREDENTIALS = {
  username: "cupidudu_admin",
  password: "admin2024!@",
};

/**
 * 관리자 로그인 검증
 */
export function verifyAdminLogin(username: string, password: string): boolean {
  return (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  );
}

/**
 * 세션 저장용 토큰 생성 (간단한 구현)
 */
export function createAdminToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `admin_${timestamp}_${random}`;
}

/**
 * 관리자 토큰 검증 (간단한 구현)
 */
export function isValidAdminToken(token?: string | null): boolean {
  if (!token) return false;
  return token.startsWith("admin_");
}
