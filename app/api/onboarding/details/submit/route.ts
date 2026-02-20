import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateByUserOrId } from "@/lib/supabase/update-by-user";

type Payload = {
  residence: string;
  occupation_group: string;
  education_level: string;
  relationship_status: string;
  height_cm: number;
  body_type: string;
  marriage_timeline: string;
  interests: string[];
  introduction: string;
  spouse_summary: string;
  profile_images: string[];
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await req.json()) as Payload;
    const requiredFields: Array<[keyof Payload, string]> = [
      ["residence", "거주지역"],
      ["occupation_group", "직업군"],
      ["education_level", "학력수준"],
      ["relationship_status", "현재 상태"],
      ["height_cm", "키"],
      ["body_type", "체형"],
      ["marriage_timeline", "결혼 희망 시기"],
      ["introduction", "자기소개"],
      ["spouse_summary", "원하는 배우자 한 줄 요약"],
    ];

    for (const [key, label] of requiredFields) {
      const value = body[key];
      if (value === null || value === undefined || String(value).trim() === "") {
        return NextResponse.json({ message: `${label}은(는) 필수입니다.` }, { status: 400 });
      }
    }

    if (!Number.isFinite(body.height_cm) || body.height_cm < 155 || body.height_cm > 195) {
      return NextResponse.json({ message: "키는 155cm부터 195cm 사이로 입력해주세요." }, { status: 400 });
    }

    if ((body.introduction || "").trim().length < 300) {
      return NextResponse.json({ message: "자기소개는 300자 이상 입력해주세요." }, { status: 400 });
    }

    const images = Array.isArray(body.profile_images) ? body.profile_images.filter(Boolean) : [];
    if (images.length !== 3) {
      return NextResponse.json({ message: "얼굴 사진 2장 + 전신 사진 1장, 총 3장을 업로드해주세요." }, { status: 400 });
    }

    const admin = createAdminClient();
    const payload = {
      residence: body.residence,
      occupation_group: body.occupation_group,
      job: body.occupation_group,
      education_level: body.education_level,
      school_name: body.education_level,
      relationship_status: body.relationship_status,
      height_cm: body.height_cm,
      body_type: body.body_type,
      marriage_timeline: body.marriage_timeline,
      interests: body.interests ?? [],
      introduction: body.introduction,
      spouse_summary: body.spouse_summary,
      greeting: body.spouse_summary,
      profile_images: images,
      image_url: images[0] ?? null,
      profile_status: "PENDING",
      approval_status: "PENDING",
      membership_level: "REGULAR",
      membership_grade: "정회원",
      submitted_at: new Date().toISOString(),
      last_reviewed_at: null,
      rejected_reason: null,
    };

    const { error } = await updateByUserOrId(admin, "user_profiles", user.id, payload);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: "정회원 심사 중입니다. 승인 후 매칭이 가능합니다.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "제출 실패" },
      { status: 500 }
    );
  }
}

