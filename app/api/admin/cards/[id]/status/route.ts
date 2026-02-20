import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";

const ALLOWED_STATUS = new Set(["pending", "paid", "meeting_scheduled", "meeting_done"]);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      status?: string;
      meeting_at?: string | null;
    };

    const deliveredId = params.id;
    const status = (body.status || "").toLowerCase();
    if (!deliveredId) {
      return NextResponse.json({ message: "카드 ID가 필요합니다." }, { status: 400 });
    }
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ message: "유효하지 않은 상태값입니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const payload: Record<string, unknown> = { status };

    if (status === "meeting_scheduled") {
      payload.meeting_at = body.meeting_at ?? null;
      payload.meeting_completed_at = null;
    } else if (status === "meeting_done") {
      payload.meeting_completed_at = new Date().toISOString();
    }

    const { data, error } = await admin
      .from("delivered_cards")
      .update(payload)
      .eq("id", deliveredId)
      .select("id, status, meeting_at, meeting_completed_at")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, card: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "상태 업데이트 실패" },
      { status: 500 }
    );
  }
}

