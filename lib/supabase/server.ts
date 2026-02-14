import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return createStubServerClient();
  }

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    return createStubServerClient();
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 set은 무시
        }
      },
    },
  });
}

function createStubServerClient() {
  const empty = Promise.resolve({ data: null, error: null });
  const emptyList = Promise.resolve({ data: [], error: null });
  const chain = () => ({
    eq: () => chain(),
    order: () => ({ limit: () => emptyList }),
    limit: () => emptyList,
    maybeSingle: () => empty,
    single: () => empty,
  });
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () =>
      ({
        select: () => chain(),
      }) as ReturnType<Awaited<ReturnType<typeof createServerClient>>["from"]>,
  } as Awaited<ReturnType<typeof createServerClient>>;
}
