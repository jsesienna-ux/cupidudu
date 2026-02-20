import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectByUserOrId, updateByUserOrId } from "@/lib/supabase/update-by-user";

type ProfilePayload = {
  full_name?: string | null;
  age?: number | null;
  contact?: string | null;
  gender?: string | null;
  job?: string | null;
  introduction?: string | null;
  greeting?: string | null;
  image_url?: string | null;
  mbti?: string | null;
  company_name?: string | null;
  residence?: string | null;
  school_name?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  hobbies?: string | null;
  assets?: string | null;
  personality?: string | null;
};

function isApprovedStatus(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.toUpperCase();
  return normalized === "APPROVED" || normalized === "APPROVE" || normalized === "approved";
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await req.json()) as { profile?: ProfilePayload };
    const profile = body.profile ?? {};

    const admin = createAdminClient();

    const { data: currentRow, error: selectError } = await selectByUserOrId(
      admin,
      "user_profiles",
      user.id,
      { columns: "approval_status, profile_status" }
    );
    if (selectError) {
      return NextResponse.json(
        { message: `프로필 조회 실패: ${selectError.message}` },
        { status: 500 }
      );
    }
    const currentApprovalStatus = (currentRow?.approval_status as string | null | undefined) ?? null;
    const currentProfileStatus = (currentRow?.profile_status as string | null | undefined) ?? null;

    const isApproved = isApprovedStatus(currentApprovalStatus) || isApprovedStatus(currentProfileStatus);

    const updatePayload: ProfilePayload =
      isApproved
        ? {
            height_cm: profile.height_cm ?? null,
            mbti: profile.mbti ?? null,
            greeting: profile.greeting ?? null,
          }
        : profile;

    const { error: updateError } = await updateByUserOrId(
      admin,
      "user_profiles",
      user.id,
      updatePayload as Record<string, unknown>
    );
    if (updateError) {
      return NextResponse.json(
        { message: `프로필 저장 실패: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!isApproved && (profile.gender === "male" || profile.gender === "female")) {
      await admin.from("user_wallets").upsert(
        {
          user_id: user.id,
          gender: profile.gender,
          coins: 0,
        },
        { onConflict: "user_id" }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "프로필 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
