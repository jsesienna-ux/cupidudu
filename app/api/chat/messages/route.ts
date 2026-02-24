import { NextRequest } from "next/server";
import { fail, unauthorized, serverError, ok } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { CHAT_POLICY } from "@/lib/constants/chat";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized("로그인이 필요합니다.");
  }

  let body: { delivered_card_id?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return fail("요청 본문이 올바르지 않습니다.", 400);
  }

  const deliveredCardId = body.delivered_card_id;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!deliveredCardId || typeof deliveredCardId !== "string") {
    return fail("delivered_card_id가 필요합니다.", 400);
  }

  if (!content) {
    return fail("content가 필요합니다.", 400);
  }

  // RPC: 권한 검사 + 제한 검사(선택) + 원자적 insert
  // enforceServerLimit === false 일 때는 p_max_messages에 큰 값 전달하여 제한 미적용
  const maxMessages = CHAT_POLICY.enforceServerLimit
    ? CHAT_POLICY.maxMessagesBeforeMeeting
    : Number.MAX_SAFE_INTEGER;

  const { data, error } = await supabase.rpc("send_chat_message", {
    p_delivered_card_id: deliveredCardId,
    p_sender_id: user.id,
    p_content: content,
    p_max_messages: maxMessages,
  });

  if (error) {
    if (error.code === "P0001") {
      return fail("해당 대화를 찾을 수 없거나 권한이 없습니다.", 404);
    }
    if (error.code === "P0002") {
      return fail("약속 전 채팅 가능 횟수를 초과했습니다.", 409);
    }
    console.error("[chat/messages]", error.message);
    return serverError("메시지 전송에 실패했습니다.");
  }

  return ok(data ?? { success: true });
}
