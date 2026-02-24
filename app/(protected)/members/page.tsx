import Link from "next/link";
import { requireUser } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { getLevelLabel, normalizeMembershipLevel } from "@/lib/profile-status";

type SearchParams = {
  membership_level?: string;
  region?: string;
  badge_code?: string;
  page?: string;
};

type PublicProfile = {
  user_id: string;
  full_name: string | null;
  age: number | null;
  residence: string | null;
  membership_level: string | null;
  public_badges: Array<{ badge_code?: string; label?: string }> | null;
};

export default async function MembersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const supabase = await createClient();
  const page = Math.max(Number(searchParams.page ?? "1"), 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("public_profiles_view")
    .select("user_id, full_name, age, residence, membership_level, public_badges")
    .order("user_id", { ascending: false })
    .range(from, to);

  if (searchParams.membership_level) {
    query = query.eq("membership_level", searchParams.membership_level);
  }
  if (searchParams.region) {
    query = query.ilike("residence", `%${searchParams.region}%`);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as PublicProfile[];
  let filtered = rows;
  if (searchParams.badge_code) {
    filtered = rows.filter((row) =>
      Array.isArray(row.public_badges)
        ? row.public_badges.some((b) => b.badge_code === searchParams.badge_code)
        : false
    );
  }

  return (
    <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-4">
        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">공개 회원 목록</h1>
          <p className="mt-2 text-sm text-cupid-gray">APPROVED 상태 회원만 조회됩니다.</p>
          {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}
        </section>

        {filtered.map((row) => {
          const level = normalizeMembershipLevel(row.membership_level, null);
          return (
            <Link
              key={row.user_id}
              href={`/members/${row.user_id}`}
              className="block rounded-2xl border border-cupid-pinkSoft bg-white p-5 shadow-sm transition hover:border-cupid-pink"
            >
              <p className="text-lg font-semibold text-gray-800">{row.full_name || "익명 회원"}</p>
              <p className="mt-1 text-sm text-cupid-gray">
                {row.age ? `${row.age}세` : "나이 미공개"} · {row.residence || "지역 미공개"}
              </p>
              <p className="mt-2 text-xs font-medium text-cupid-pinkDark">{getLevelLabel(level)}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(row.public_badges ?? []).slice(0, 4).map((badge, idx) => (
                  <span key={`${row.user_id}-badge-${idx}`} className="rounded-full bg-cupid-cream px-2 py-0.5 text-xs text-cupid-gray">
                    {badge.label || badge.badge_code}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 text-center text-sm text-cupid-gray shadow-sm">
            조건에 맞는 공개 프로필이 없습니다.
          </section>
        )}
      </div>
    </main>
  );
}

