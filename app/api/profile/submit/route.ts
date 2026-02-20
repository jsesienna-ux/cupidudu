import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateByUserOrId } from "@/lib/supabase/update-by-user";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const admin = createAdminClient();
    const payload = {
      profile_status: "PENDING",
      approval_status: "PENDING",
      submitted_at: new Date().toISOString(),
      last_reviewed_at: null,
      rejected_reason: null,
    };

    const { error } = await updateByUserOrId(admin, "user_profiles", user.id, payload);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "제출 실패" },
      { status: 500 }
    );
  }
}

