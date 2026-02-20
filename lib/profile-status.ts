export type MembershipLevel = "REGULAR" | "VERIFIED" | "VIP";
export type ProfileStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export function normalizeMembershipLevel(
  level?: string | null,
  legacyGrade?: string | null
): MembershipLevel {
  const normalizedLevel = (level ?? "").toUpperCase();
  if (normalizedLevel === "VIP") return "VIP";
  if (normalizedLevel === "VERIFIED") return "VERIFIED";
  if (normalizedLevel === "REGULAR") return "REGULAR";

  if (legacyGrade === "VIP회원") return "VIP";
  if (legacyGrade === "우수회원") return "VERIFIED";
  return "REGULAR";
}

export function normalizeProfileStatus(
  status?: string | null,
  legacyStatus?: string | null
): ProfileStatus {
  const normalizedStatus = (status ?? "").toUpperCase();
  if (normalizedStatus === "PENDING") return "PENDING";
  if (normalizedStatus === "APPROVED") return "APPROVED";
  if (normalizedStatus === "REJECTED") return "REJECTED";
  if (normalizedStatus === "SUSPENDED") return "SUSPENDED";
  if (normalizedStatus === "DRAFT") return "DRAFT";

  const normalizedLegacy = (legacyStatus ?? "").toUpperCase();
  if (normalizedLegacy === "APPROVED") return "APPROVED";
  if (normalizedLegacy === "PENDING") return "PENDING";
  if (normalizedLegacy === "REJECTED") return "REJECTED";
  if (normalizedLegacy === "SUSPENDED") return "SUSPENDED";
  return "DRAFT";
}

export function getLevelLabel(level: MembershipLevel): string {
  if (level === "VIP") return "VIP";
  if (level === "VERIFIED") return "인증회원";
  return "정회원";
}

