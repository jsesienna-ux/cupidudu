import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const { error } = await admin.from("user_profiles").update(payload).eq("user_id", user.id);
    if (error) {
      if (error.message?.toLowerCase().includes("could not find the 'user_id' column")) {
        const { error: retryError } = await admin
          .from("user_profiles")
          .update(payload)
          .eq("id", user.id);
        if (retryError) {
          return NextResponse.json({ message: retryError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "제출 실패" },
      { status: 500 }
    );
  }
}

