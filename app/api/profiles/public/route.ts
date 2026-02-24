import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/require-auth";
import { ok, serverError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

type PublicProfileRow = {
  user_id: string;
  full_name: string | null;
  age: number | null;
  residence: string | null;
  membership_level: string | null;
  public_badges: Array<{ badge_code?: string }>;
};

function parseAgeRange(ageRange: string | null): { min: number; max: number } | null {
  if (!ageRange) return null;
  if (ageRange === "20s") return { min: 20, max: 29 };
  if (ageRange === "30s") return { min: 30, max: 39 };
  if (ageRange === "40s") return { min: 40, max: 49 };
  const [minRaw, maxRaw] = ageRange.split("-");
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min, max };
}

export async function GET(req: Request) {
  const userOr401 = await requireUserApi();
  if (userOr401 instanceof NextResponse) return userOr401;

  try {
    const url = new URL(req.url);
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);
    const membershipLevel = url.searchParams.get("membership_level");
    const badgeCode = url.searchParams.get("badge_code");
    const region = url.searchParams.get("region");
    const ageRange = parseAgeRange(url.searchParams.get("age_range"));

    const supabase = await createClient();
    let query = supabase
      .from("public_profiles_view")
      .select("*")
      .order("user_id", { ascending: false });

    if (membershipLevel) {
      query = query.eq("membership_level", membershipLevel);
    }

    if (region) {
      query = query.ilike("residence", `%${region}%`);
    }

    const { data, error } = await query;
    if (error) {
      return serverError(error.message);
    }

    let filtered = (data ?? []) as PublicProfileRow[];
    if (ageRange) {
      filtered = filtered.filter((row) => {
        if (typeof row.age !== "number") return false;
        return row.age >= ageRange.min && row.age <= ageRange.max;
      });
    }
    if (badgeCode) {
      filtered = filtered.filter((row) =>
        Array.isArray(row.public_badges)
          ? row.public_badges.some((badge) => badge?.badge_code === badgeCode)
          : false
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return ok({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    });
  } catch (error: unknown) {
    return serverError(error instanceof Error ? error.message : "공개 프로필 조회 실패");
  }
}

