"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-4 rounded-xl border border-cupid-pinkSoft bg-white px-5 py-2.5 text-sm font-medium text-cupid-pinkDark transition hover:bg-cupid-pinkSoft/50"
    >
      로그아웃
    </button>
  );
}
