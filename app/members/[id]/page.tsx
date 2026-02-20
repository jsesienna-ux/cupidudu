import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLevelLabel, normalizeMembershipLevel } from "@/lib/profile-status";

type PageProps = { params: { id: string } };

export default async function MemberDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_profiles_view")
    .select("*")
    .eq("user_id", params.id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const level = normalizeMembershipLevel(data.membership_level as string | null, null);
  const badges = Array.isArray(data.public_badges) ? data.public_badges : [];

  return (
    <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-4">
        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">{(data.full_name as string) || "익명 회원"}</h1>
          <p className="mt-2 text-sm text-cupid-gray">
            {data.age ? `${data.age}세` : "나이 미공개"} · {(data.residence as string) || "지역 미공개"}
          </p>
          <p className="mt-2 text-xs font-semibold text-cupid-pinkDark">{getLevelLabel(level)}</p>
        </section>

        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">소개</h2>
          <p className="mt-2 text-sm text-gray-700">{(data.introduction as string) || "-"}</p>
          <p className="mt-3 text-sm text-cupid-gray">한마디: {(data.greeting as string) || "-"}</p>
        </section>

        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">공개 배지</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.length ? (
              badges.map((badge: { badge_code?: string; label?: string }, idx: number) => (
                <span key={`badge-${idx}`} className="rounded-full bg-cupid-cream px-3 py-1 text-xs text-cupid-gray">
                  {badge.label || badge.badge_code}
                </span>
              ))
            ) : (
              <p className="text-sm text-cupid-gray">공개 배지가 없습니다.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

