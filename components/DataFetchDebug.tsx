"use client";

import { useEffect } from "react";

type DataFetchDebugProps = {
  /** 서버에서 가져온 raw 배열의 첫 항목(직렬화된 복사) */
  rawFirst?: Record<string, unknown> | null;
  /** Supabase fetch 에러 메시지 */
  fetchError?: string | null;
};

export function DataFetchDebug({ rawFirst, fetchError }: DataFetchDebugProps) {
  useEffect(() => {
    console.log("가져온 데이터:", rawFirst ?? null);
    console.log("에러 내용:", fetchError ?? null);
    if (rawFirst) {
      const profile =
        rawFirst.profile_cards ?? rawFirst.profile_card ?? null;
      const imageUrl =
        profile != null && !Array.isArray(profile)
          ? (profile as Record<string, unknown>).image_url
          : Array.isArray(profile) && profile[0]
            ? (profile[0] as Record<string, unknown>).image_url
            : undefined;
      console.log("이미지 주소:", imageUrl);
    }
  }, [rawFirst, fetchError]);

  return null;
}
