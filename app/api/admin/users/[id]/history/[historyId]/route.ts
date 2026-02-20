import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";

const EVENT_TYPES = new Set(["미팅", "전화통화", "카톡", "문자", "기타"]);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; historyId: string } }
) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      event_type?: string;
      scheduled_at?: string | null;
      note?: string;
    };

    const eventType = body.event_type?.trim() || "기타";
    if (!EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ message: "유효하지 않은 히스토리 유형입니다." }, { status: 400 });
    }

    const note = body.note?.trim() || "";
    const scheduledAt = body.scheduled_at ?? null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("audit_log")
      .update({
        metadata: {
          event_type: eventType,
          scheduled_at: scheduledAt,
          note,
        },
      })
      .eq("id", params.historyId)
      .eq("target_user_id", params.id)
      .eq("action", "MANAGER_HISTORY")
      .select("id, action, metadata, created_at, actor_user_id")
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, item: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "히스토리 수정 실패" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; historyId: string } }
) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("audit_log")
      .delete()
      .eq("id", params.historyId)
      .eq("target_user_id", params.id)
      .eq("action", "MANAGER_HISTORY");

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "히스토리 삭제 실패" },
      { status: 500 }
    );
  }
}

