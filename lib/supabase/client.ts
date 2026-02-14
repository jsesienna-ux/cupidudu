import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return createStubBrowserClient();
  }
  return createBrowserClient(url, key);
}

function createStubBrowserClient() {
  const noUser = async () => ({ data: { user: null }, error: null });
  const emptyFrom = () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
      }),
    }),
  });
  return {
    auth: {
      signInWithPassword: async () => ({
        data: null,
        error: { message: "Supabase URL과 Key를 .env.local에 설정해주세요." },
      }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: noUser,
    },
    from: emptyFrom,
    rpc: () => Promise.resolve({ data: null, error: { message: "Supabase가 설정되지 않았습니다." } }),
  } as ReturnType<typeof createBrowserClient>;
}
