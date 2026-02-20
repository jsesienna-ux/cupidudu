/**
 * Supabase "user_id 먼저 시도, 실패 시 id로 재시도" 패턴 공통 유틸
 *
 * user_id 컬럼 미존재 시(마이그레이션 중) id로 fallback.
 * 실패 판단: error 존재 시 "could not find the 'user_id' column" 메시지면 id로 재시도.
 */

const USER_ID_COLUMN_ERROR = "could not find the 'user_id' column";

function isUserIdColumnError(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.toLowerCase().includes(USER_ID_COLUMN_ERROR));
}

/** Supabase createClient / createAdminClient 호환 최소 인터페이스 */
type UpdateChain = {
  eq: (col: string, val: string) => Promise<{ data: unknown; error: { message?: string } | null }>;
};
type SelectChain = {
  eq: (col: string, val: string) => {
    maybeSingle: () => Promise<{ data: unknown; error: { message?: string } | null }>;
  };
};
type TableRef = {
  update: (payload: Record<string, unknown>) => UpdateChain;
  select: (columns?: string) => SelectChain;
};
export type SupabaseLikeClient = {
  from: (table: string) => TableRef;
};

export type UpdateByUserOptions = {
  /** 추가 옵션 (향후 확장용) */
  _?: never;
};

/**
 * user_id로 update 시도, user_id 컬럼 관련 에러 시 id로 재시도
 *
 * @param client - createClient() 또는 createAdminClient() 반환값
 * @param tableName - 테이블명
 * @param userId - user_id 또는 id 값
 * @param payload - update할 필드 객체
 * @param options - (선택) 향후 확장용
 * @returns 마지막 시도 결과
 */
export async function updateByUserOrId(
  client: SupabaseLikeClient,
  tableName: string,
  userId: string,
  payload: Record<string, unknown>,
  options?: UpdateByUserOptions
): Promise<{ data: unknown; error: { message?: string } | null }> {
  void options; // reserved for future extensibility
  let result = await client
    .from(tableName)
    .update(payload)
    .eq("user_id", userId);

  if (result.error && isUserIdColumnError(result.error)) {
    result = await client.from(tableName).update(payload).eq("id", userId);
  }

  return { data: result.data, error: result.error };
}

export type SelectByUserOptions = {
  /** select할 컬럼 (쉼표 구분). 미지정 시 '*' */
  columns?: string;
};

/**
 * user_id로 select 시도, user_id 컬럼 관련 에러 시 id로 재시도 (maybeSingle)
 *
 * @param client - createClient() 또는 createAdminClient() 반환값
 * @param tableName - 테이블명
 * @param userId - user_id 또는 id 값
 * @param options - columns 등
 * @returns 마지막 시도 결과
 */
export async function selectByUserOrId(
  client: SupabaseLikeClient,
  tableName: string,
  userId: string,
  options?: SelectByUserOptions
): Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }> {
  const columns = options?.columns ?? "*";

  let result = await client
    .from(tableName)
    .select(columns)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error && isUserIdColumnError(result.error)) {
    result = await client
      .from(tableName)
      .select(columns)
      .eq("id", userId)
      .maybeSingle();
  }

  return {
    data: result.data as Record<string, unknown> | null,
    error: result.error,
  };
}

/*
  === 사용 예시 (실제 라우트에서는 아직 적용하지 않음) ===

  // 예시 1: admin approve - user_profiles update
  const admin = createAdminClient();
  const payload = {
    profile_status: "APPROVED",
    approval_status: "approved",
    membership_level: "REGULAR",
    membership_grade: "정회원",
    approved_at: new Date().toISOString(),
  };
  const { error } = await updateByUserOrId(admin, "user_profiles", userId, payload);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // 예시 2: me API - user_profiles select
  const supabase = await createClient();
  const { data: profile, error } = await selectByUserOrId(supabase, "user_profiles", user.id, {
    columns: "user_id, id, full_name, username, gender, age",
  });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
*/
