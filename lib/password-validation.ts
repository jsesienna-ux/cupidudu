/** 비밀번호 유효성 검사: 6자 이상, 영문·숫자·특수문자 포함 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: "비밀번호는 6자 이상이어야 해요." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: "비밀번호에 영문을 포함해주세요." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "비밀번호에 숫자를 포함해주세요." };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, message: "비밀번호에 특수문자를 포함해주세요." };
  }
  return { valid: true };
}
