import { NextResponse } from "next/server";
import { isValidAdminToken } from "@/lib/admin";

/** 관리자 토큰은 요청 헤더 x-admin-token 에서만 읽는다. body.token 은 사용하지 않는다. */
export function getAdminTokenFromRequest(req: Request): string | null {
  const headerToken = req.headers.get("x-admin-token");
  if (headerToken) return headerToken;
  return null;
}

export function assertAdminToken(token: string | null): NextResponse | null {
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ message: "관리자 인증이 필요합니다." }, { status: 401 });
  }
  return null;
}

