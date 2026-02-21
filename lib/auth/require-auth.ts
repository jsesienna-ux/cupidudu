import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentUser } from "./get-current-user";

/**
 * 보호가 필요한 Server Component에서 호출.
 * 유저가 없으면 redirect("/login"), 있으면 User 반환.
 */
export async function requireUser(): Promise<User> {
  const { user } = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

const UNAUTHORIZED_MESSAGE = "로그인이 필요합니다.";

/**
 * 보호가 필요한 Route Handler에서 호출.
 * 유저가 없으면 401 NextResponse 반환, 있으면 User 반환.
 * 호출부에서 반환값이 NextResponse인지 검사 후 분기.
 */
export async function requireUserApi(): Promise<User | NextResponse<{ message: string }>> {
  const { user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: UNAUTHORIZED_MESSAGE }, { status: 401 });
  }
  return user;
}

/*
  === 사용 예시 ===

  // 예시 1: app/(protected) 페이지에서 requireUser 사용
  import { requireUser } from "@/lib/auth/require-auth";

  export default async function ProtectedPage() {
    const user = await requireUser(); // 없으면 redirect("/login")
    return <div>안녕, {user.email}</div>;
  }

  // 예시 2: app/api 라우트에서 requireUserApi 사용
  import { NextResponse } from "next/server";
  import { requireUserApi } from "@/lib/auth/require-auth";

  export async function GET() {
    const userOr401 = await requireUserApi();
    if (userOr401 instanceof NextResponse) return userOr401;
    const user = userOr401;
    return NextResponse.json({ userId: user.id });
  }
*/
