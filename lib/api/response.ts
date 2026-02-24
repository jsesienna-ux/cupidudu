import { NextResponse } from "next/server";

type ResponseInit = Parameters<typeof NextResponse.json>[1];

export function ok(data?: unknown, init?: ResponseInit): NextResponse {
  const body: Record<string, unknown> = { ok: true };
  if (data !== undefined) {
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      Object.assign(body, data);
    } else {
      body.data = data;
    }
  }
  return NextResponse.json(body, init);
}

export function fail(
  message: string,
  status: number = 400,
  extra?: Record<string, unknown>
): NextResponse {
  const body: Record<string, unknown> = { message, ...extra };
  return NextResponse.json(body, { status });
}

export function unauthorized(message?: string): NextResponse {
  return NextResponse.json(
    { message: message ?? "인증이 필요합니다." },
    { status: 401 }
  );
}

export function serverError(message?: string): NextResponse {
  return NextResponse.json(
    { message: message ?? "서버 오류가 발생했습니다." },
    { status: 500 }
  );
}

/*
  예시 1: route handler에서 try/catch로 fail, serverError 사용
  import { ok, fail, serverError } from "@/lib/api/response";
  export async function POST(req: Request) {
    try {
      const body = await req.json();
      if (!body.email) return fail("email 필드가 필요합니다.");
      const result = await doSomething(body);
      return ok(result);
    } catch (e) {
      console.error(e);
      return serverError();
    }
  }

  예시 2: 인증 실패에서 unauthorized 사용
  import { unauthorized } from "@/lib/api/response";
  if (!user) return unauthorized("로그인이 필요합니다.");
*/
