/**
 * 코인 부족/언락 관련 에러 판별 및 메시지 유틸
 */

export const REQUIRED_COINS_TO_UNLOCK = 5;

function safeString(value: unknown): string {
  return value != null && typeof value === "string" ? value : "";
}

/**
 * 에러가 "코인 부족" 계열인지 판별 (unknown 입력 안전 처리)
 */
export function isInsufficientCoinError(err: unknown): boolean {
  if (err == null) return false;

  let msg = "";
  let code = "";

  if (typeof err === "object" && err !== null) {
    msg = safeString((err as Record<string, unknown>).message);
    code = safeString((err as Record<string, unknown>).code);
  }

  const msgLower = msg.toLowerCase();
  const codeLower = code.toLowerCase();

  return (
    msgLower.includes("insufficient") ||
    msgLower.includes("부족") ||
    msgLower.includes("코인") ||
    msgLower.includes("not enough") ||
    codeLower.includes("insufficient") ||
    msgLower.includes("balance")
  );
}

/**
 * 코인 관련 에러를 사용자용 메시지로 변환
 * - 코인 부족 에러 → "코인이 부족합니다" (InsufficientCoinModal과 동일 문구)
 * - 그 외 → 에러 메시지 또는 기본 안내
 */
export function translateCoinError(err: unknown): string {
  if (isInsufficientCoinError(err)) return "코인이 부족합니다";
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as Record<string, unknown>).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "처리 중 오류가 발생했습니다.";
}

/*
  === 사용 예시 ===

  // 예시 1: CardArrived/CardDetail - unlock_profile_card RPC 에러 처리
  import { isInsufficientCoinError, REQUIRED_COINS_TO_UNLOCK } from "@/lib/utils/coin-errors";
  const { data, error } = await supabase.rpc("unlock_profile_card", { ... });
  if (error) {
    if (isInsufficientCoinError(error)) {
      setInsufficientModalOpen(true);
      return;
    }
    // ...
  }
  // 잔액 사전 체크
  if (coinBalance < REQUIRED_COINS_TO_UNLOCK) setInsufficientModalOpen(true);

  // 예시 2: toast/메시지 표시용
  import { translateCoinError } from "@/lib/utils/coin-errors";
  try {
    await someCoinOperation();
  } catch (err) {
    toast.error(translateCoinError(err));
  }
*/
