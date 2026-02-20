import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    let currentApprovalStatus: string | null = null;
    let currentProfileStatus: string | null = null;

    const { data: currentByUserId, error: currentByUserIdError } = await admin
      .from("user_profiles")
      .select("approval_status, profile_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentByUserIdError) {
      const isMissingUserIdColumn = currentByUserIdError.message
        ?.toLowerCase()
        .includes("could not find the 'user_id' column");

      if (isMissingUserIdColumn) {
        const { data: currentById, error: currentByIdError } = await admin
          .from("user_profiles")
          .select("approval_status, profile_status")
          .eq("id", user.id)
          .maybeSingle();

        if (currentByIdError) {
          return NextResponse.json(
            { message: `프로필 조회 실패: ${currentByIdError.message}` },
            { status: 500 }
          );
        }
        const current = currentById as
          | { approval_status?: string | null; profile_status?: string | null }
          | null;
        currentApprovalStatus = current?.approval_status ?? null;
        currentProfileStatus = current?.profile_status ?? null;
      } else {
        return NextResponse.json(
          { message: `프로필 조회 실패: ${currentByUserIdError.message}` },
          { status: 500 }
        );
      }
    } else {
      currentApprovalStatus =
        (currentByUserId as { approval_status?: string | null } | null)?.approval_status ?? null;
      currentProfileStatus =
        (currentByUserId as { profile_status?: string | null } | null)?.profile_status ?? null;
    }

    const isApproved = isApprovedStatus(currentApprovalStatus) || isApprovedStatus(currentProfileStatus);

    const updatePayload: ProfilePayload =
      isApproved
        ? {
            height_cm: profile.height_cm ?? null,
            mbti: profile.mbti ?? null,
            greeting: profile.greeting ?? null,
          }
        : profile;

    const { error: updateError } = await admin
      .from("user_profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    if (updateError) {
      const isMissingUserIdColumn = updateError.message
        ?.toLowerCase()
        .includes("could not find the 'user_id' column");

      if (isMissingUserIdColumn) {
        const { error: retryError } = await admin
          .from("user_profiles")
          .update(updatePayload)
          .eq("id", user.id);

        if (retryError) {
          return NextResponse.json(
            { message: `프로필 저장 실패: ${retryError.message}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { message: `프로필 저장 실패: ${updateError.message}` },
          { status: 500 }
        );
      }
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
