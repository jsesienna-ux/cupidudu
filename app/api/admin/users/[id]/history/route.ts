import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";

const EVENT_TYPES = new Set(["미팅", "전화통화", "카톡", "문자", "기타"]);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      event_type?: string;
      scheduled_at?: string | null;
      note?: string;
      actor_user_id?: string;
    };

    const targetUserId = params.id;
    if (!targetUserId) {
      return NextResponse.json({ message: "대상 회원 ID가 필요합니다." }, { status: 400 });
    }

    const eventType = body.event_type?.trim() || "기타";
    if (!EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ message: "유효하지 않은 히스토리 유형입니다." }, { status: 400 });
    }

    const note = body.note?.trim() || "";
    const scheduledAt = body.scheduled_at ?? null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("audit_log")
      .insert({
        actor_user_id: body.actor_user_id ?? targetUserId,
        action: "MANAGER_HISTORY",
        target_user_id: targetUserId,
        metadata: {
          event_type: eventType,
          scheduled_at: scheduledAt,
          note,
        },
      })
      .select("id, action, metadata, created_at, actor_user_id")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "히스토리 저장 실패" },
      { status: 500 }
    );
  }
}

