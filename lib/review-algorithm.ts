export type ReviewAlgorithmInput = {
  job?: string | null;
  school_name?: string | null;
  residence?: string | null;
  mbti?: string | null;
  image_url?: string | null;
  values_answers?: Array<{
    answer?: unknown;
  }>;
  internal_scores?: {
    manners_score?: number | null;
    photo_real_score?: number | null;
    manager_notes?: string | null;
  } | null;
};

export type ReviewAlgorithmResult = {
  total_score: number;
  profile_completeness_score: number;
  values_answer_score: number;
  values_keyword_score: number;
  internal_score: number;
  recommended_level: "REGULAR" | "VERIFIED" | "VIP";
  suggested_badges: string[];
};

const KOREAN_BADGE_KEYWORDS = {
  marriage_1y: ["1년", "12개월", "빠른 결혼"],
  marriage_2y: ["2년", "24개월"],
  remarriage: ["재혼"],
  accept_child: ["자녀 가능", "자녀 수용", "아이 가능"],
  finance_transparent: ["경제관 투명", "재정 공유", "재무 공개"],
  parent_independent: ["부모 독립", "독립적", "분가"],
  long_distance: ["장거리 가능", "원거리 가능", "롱디 가능"],
  overseas_work: ["해외근무", "글로벌", "외국계"],
  entrepreneur: ["사업", "대표", "창업"],
  professional: ["의사", "변호사", "회계사", "약사", "전문직"],
  review_good: ["후기 좋", "리뷰 좋", "평가 좋"],
  gentle: ["다정", "스윗", "친절"],
  reliable: ["든든", "책임감", "테토남"],
  manager_meeting_done: ["직접 미팅", "미팅 완료", "대면 완료"],
};

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((v) => toText(v)).join(" ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function toLevel(score: number): "REGULAR" | "VERIFIED" | "VIP" {
  if (score >= 88) return "VIP";
  if (score >= 72) return "VERIFIED";
  return "REGULAR";
}

export function calculateReviewAlgorithm(input: ReviewAlgorithmInput): ReviewAlgorithmResult {
  const manners = input.internal_scores?.manners_score ?? 50;
  const photo = input.internal_scores?.photo_real_score ?? 50;
  const managerNotes = input.internal_scores?.manager_notes ?? "";

  const profileFields = [input.job, input.school_name, input.residence, input.mbti, input.image_url];
  const profileFilled = profileFields.filter((v) => Boolean(v && String(v).trim())).length;
  const profileCompletenessScore = Math.round((profileFilled / profileFields.length) * 100);

  const answers = input.values_answers ?? [];
  const valuesAnswerScore = Math.min(100, answers.length * 10);
  const answersText = answers.map((a) => toText(a.answer)).join(" ").toLowerCase();
  const totalText = `${answersText} ${managerNotes.toLowerCase()} ${toText(input.job).toLowerCase()} ${toText(input.school_name).toLowerCase()}`;

  let valuesKeywordScore = 50;
  const keywordHits = [
    hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.accept_child),
    hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.finance_transparent),
    hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.parent_independent),
    hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.long_distance),
  ].filter(Boolean).length;
  valuesKeywordScore = Math.min(100, 50 + keywordHits * 12);

  const internalScore = Math.round((manners + photo) / 2);
  const totalScore = Math.round(
    internalScore * 0.45 +
      profileCompletenessScore * 0.2 +
      valuesAnswerScore * 0.2 +
      valuesKeywordScore * 0.15
  );

  const suggested = new Set<string>();

  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.marriage_1y)) suggested.add("MARRIAGE_INTENT_1Y");
  else if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.marriage_2y))
    suggested.add("MARRIAGE_INTENT_2Y");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.remarriage)) suggested.add("REMARRIAGE_READY");

  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.accept_child)) suggested.add("VALUE_ACCEPT_CHILD");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.finance_transparent))
    suggested.add("VALUE_FINANCE_TRANSPARENT");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.parent_independent))
    suggested.add("VALUE_PARENT_INDEPENDENT");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.long_distance))
    suggested.add("VALUE_LONG_DISTANCE_OK");

  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.manager_meeting_done))
    suggested.add("MANAGER_MEETING_DONE");
  if (manners >= 90) suggested.add("MANAGER_MANNERS_TOP");
  if (photo >= 90) suggested.add("MANAGER_PHOTO_TOP");

  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.professional)) suggested.add("PROFESSIONAL");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.overseas_work)) suggested.add("OVERSEAS_WORK");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.entrepreneur)) suggested.add("ENTREPRENEUR");
  if (/석사|박사|mba|master|phd/i.test(totalText)) suggested.add("MASTER_PLUS");

  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.review_good)) suggested.add("POPULAR_REVIEW_GOOD");
  if (manners >= 85) suggested.add("POPULAR_MANNER_GOOD");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.gentle)) suggested.add("POPULAR_GENTLE_MAN");
  if (hasAnyKeyword(totalText, KOREAN_BADGE_KEYWORDS.reliable)) suggested.add("POPULAR_RELIABLE_MAN");

  return {
    total_score: totalScore,
    profile_completeness_score: profileCompletenessScore,
    values_answer_score: valuesAnswerScore,
    values_keyword_score: valuesKeywordScore,
    internal_score: internalScore,
    recommended_level: toLevel(totalScore),
    suggested_badges: Array.from(suggested),
  };
}
