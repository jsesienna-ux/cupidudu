import { NextResponse } from "next/server";
import { isValidAdminToken } from "@/lib/admin";

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

