-- 채팅 메시지 테이블 (4회 제한 정책: docs/chat-constraints.md)
-- delivered_card_id = 대화방/매칭 단위 (카드 수신자 ↔ 카드)

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  delivered_card_id uuid not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- delivered_cards 참조 (존재하는 delivered_card만)
create index if not exists idx_chat_messages_delivered_card_id
  on public.chat_messages(delivered_card_id);

create index if not exists idx_chat_messages_created_at
  on public.chat_messages(created_at);

-- RLS: 인증된 사용자만 조회/삽입 (본인 대화만)
alter table public.chat_messages enable row level security;

-- delivered_card 수신자만 해당 대화에 메시지 삽입
create policy "chat_messages_insert_receiver"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.delivered_cards dc
      where dc.id = delivered_card_id and dc.user_id = auth.uid()
    )
  );

-- delivered_card 수신자만 해당 대화 메시지 조회 (user_id = delivered_cards.user_id)
create policy "chat_messages_select_receiver"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.delivered_cards dc
      where dc.id = delivered_card_id and dc.user_id = auth.uid()
    )
  );

-- 메시지 전송: 제한 검사 + 원자적 insert (race condition 방지)
-- p_max_messages: 정책 상수 (기본 4, API에서 lib/constants/chat 값 전달)
create or replace function public.send_chat_message(
  p_delivered_card_id uuid,
  p_sender_id uuid,
  p_content text,
  p_max_messages int default 4
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_meeting_done timestamptz;
  v_count int;
begin
  -- 1) 권한: 수신자만 전송 가능
  select user_id, meeting_completed_at into v_user_id, v_meeting_done
  from delivered_cards
  where id = p_delivered_card_id and user_id = p_sender_id
  for update;

  if v_user_id is null then
    raise exception 'DELIVERED_CARD_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 2) 만남 완료 후면 제한 없이 insert
  if v_meeting_done is not null then
    insert into chat_messages (delivered_card_id, sender_id, content)
    values (p_delivered_card_id, p_sender_id, p_content);
    return '{"success": true}'::jsonb;
  end if;

  -- 3) 만나기 전: p_max_messages 제한
  select count(*)::int into v_count
  from chat_messages
  where delivered_card_id = p_delivered_card_id;

  if v_count >= p_max_messages then
    raise exception 'CHAT_LIMIT_EXCEEDED' using errcode = 'P0002';
  end if;

  -- 4) insert
  insert into chat_messages (delivered_card_id, sender_id, content)
  values (p_delivered_card_id, p_sender_id, p_content);

  return '{"success": true}'::jsonb;
end;
$$;

-- RPC: authenticated만 호출
grant execute on function public.send_chat_message(uuid, uuid, text, int) to authenticated;
