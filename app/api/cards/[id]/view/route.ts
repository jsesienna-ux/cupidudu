import { NextRequest } from "next/server";
import { fail, unauthorized, serverError, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return fail("카드 ID 필요", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return unauthorized("로그인 필요");
  }

  const { error } = await supabase
    .from("delivered_cards")
    .update({
      viewed_at: new Date().toISOString(),
      is_read: true,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[cards/view]", error.message);
    return serverError(error.message);
  }

  return ok({ success: true });
}
