import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PORTONE_GET_PAYMENT_URL = "https://api.portone.io/payments";

function log(...args: unknown[]) {
  console.log("[payment/confirm]", ...args);
}

function logError(...args: unknown[]) {
  console.error("[payment/confirm]", ...args);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, coinsToAdd, totalAmount: requestedTotalAmount, orderId: clientOrderId, orderName, currency } = body as {
      paymentId?: string;
      coinsToAdd?: number;
      totalAmount?: number;
      orderId?: string;
      orderName?: string;
      currency?: string;
    };

    log("요청 수신:", { paymentId: paymentId ?? "없음", coinsToAdd, requestedTotalAmount, orderId: clientOrderId, orderName, currency });

    if (!paymentId || typeof coinsToAdd !== "number" || coinsToAdd <= 0) {
      logError("잘못된 파라미터:", body);
      return NextResponse.json(
        { error: "paymentId, coinsToAdd(양수) 필요" },
        { status: 400 }
      );
    }

    const apiSecret = process.env.PORTONE_API_SECRET;
    if (!apiSecret) {
      logError("PORTONE_API_SECRET 환경 변수 누락");
      return NextResponse.json({ error: "결제 설정 오류" }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logError("인증되지 않은 요청");
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    log("PortOne 결제 조회:", paymentId);
    const res = await fetch(`${PORTONE_GET_PAYMENT_URL}/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: {
        Authorization: `PortOne ${apiSecret}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      logError("PortOne 조회 실패:", res.status, err);
      return NextResponse.json(
        { error: "결제 정보 조회 실패", detail: err },
        { status: 402 }
      );
    }

    const payment = await res.json();
    const status = payment?.status ?? payment?.payment?.status;
    const paidAmountRaw = payment?.totalAmount ?? payment?.payment?.totalAmount ?? payment?.amount?.total ?? 0;
    const paidAmount = Number(paidAmountRaw);
    const serverOrderId =
      payment?.orderId ??
      payment?.payment?.orderId ??
      payment?.customerOrderId ??
      payment?.merchant_order_ref ??
      payment?.channel?.merchantOrderId ??
      "";

    log("결제 정보:", { status, paidAmount, paidAmountRaw, serverOrderId, paymentKeys: Object.keys(payment ?? {}) });

    const requestedAmountNum = Number(requestedTotalAmount);
    if (Number.isNaN(requestedAmountNum) || paidAmount !== requestedAmountNum) {
      logError("금액 불일치 (Number 비교):", { paidAmount, requestedTotalAmount, requestedAmountNum });
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다" },
        { status: 403 }
      );
    }
    log("금액 검증 통과:", { paidAmount, requestedAmountNum });

    if (status !== "PAID" && status !== "paid") {
      return NextResponse.json(
        { error: "결제가 완료된 건이 아닙니다", status },
        { status: 400 }
      );
    }

    const expectedOrderPrefix = `coin-${user.id}-`;
    const serverId = String(serverOrderId ?? "");
    const clientId = String(clientOrderId ?? "");
    const orderIdValid =
      serverId.startsWith(expectedOrderPrefix) ||
      clientId.startsWith(expectedOrderPrefix) ||
      (clientId.length > 0 && clientId.includes(user.id));

    if (!orderIdValid) {
      logError("orderId 불일치:", {
        serverOrderId: serverId,
        clientOrderId: clientId,
        expectedPrefix: expectedOrderPrefix,
      });
      return NextResponse.json(
        { error: "주문 정보가 일치하지 않습니다" },
        { status: 403 }
      );
    }
    log("orderId 검증 통과");

    // Admin 전용 클라이언트: SUPABASE_SERVICE_ROLE_KEY 사용 → RLS 보안 정책 우회
    // user_wallets, payment_confirmations 쓰기는 반드시 admin으로 수행
    let admin;
    try {
      admin = createAdminClient();
      log("Admin 클라이언트 생성 완료 (SERVICE_ROLE_KEY 사용, RLS 우회)");
    } catch (adminErr) {
      logError("createAdminClient 실패 - SUPABASE_SERVICE_ROLE_KEY 확인:", adminErr);
      return NextResponse.json(
        { error: "서버 설정 오류 (SERVICE_ROLE_KEY 필요)" },
        { status: 500 }
      );
    }

    // 멱등: 이미 처리된 결제인지 확인 (admin 사용)
    const { data: existing, error: existingErr } = await admin
      .from("payment_confirmations")
      .select("user_id, coins_added")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (existingErr) {
      logError("payment_confirmations 조회 실패 - 테이블/RLS 확인:", {
        code: existingErr.code,
        message: existingErr.message,
        hint: existingErr.hint,
      });
      return NextResponse.json(
        { error: "결제 기록 조회 실패", detail: existingErr.message },
        { status: 500 }
      );
    }

    if (existing) {
      log("이미 처리된 결제 (멱등):", paymentId);
      const { data: w, error: wErr } = await admin
        .from("user_wallets")
        .select("coins")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wErr) logError("user_wallets 조회 에러 (멱등):", wErr);
      return NextResponse.json({
        success: true,
        new_coins: Number(w?.coins ?? 0),
      });
    }

    // 1) payment_confirmations에 영수증 기록 (admin, RLS 우회)
    // status: PortOne 표준(PAID, READY, FAILED) 그대로 저장
    const statusToStore = String(status ?? "PAID").toUpperCase();
    const receiptRecord = {
      payment_id: paymentId,
      user_id: user.id,
      coins_added: Number(coinsToAdd),
      amount: Number(paidAmount),
      status: statusToStore,
    };
    log("payment_confirmations insert 시도:", receiptRecord);

    const { error: insertErr } = await admin
      .from("payment_confirmations")
      .insert(receiptRecord);

    if (insertErr) {
      logError("payment_confirmations insert 실패:", {
        code: insertErr.code,
        message: insertErr.message,
        details: insertErr.details,
        hint: insertErr.hint,
      });
      if (insertErr.code === "23505") {
        // unique violation - 이미 처리됨 (멱등)
        const { data: w } = await admin.from("user_wallets").select("coins").eq("user_id", user.id).maybeSingle();
        log("멱등: 중복 payment_id로 인해 기존 결과 반환");
        return NextResponse.json({ success: true, new_coins: Number(w?.coins ?? 0) });
      }
      if (insertErr.code === "42703") {
        logError("컬럼명 불일치 - payment_confirmations 테이블 스키마 확인 필요:", insertErr.message);
      }
      return NextResponse.json(
        { error: "결제 기록 실패", detail: insertErr.message },
        { status: 500 }
      );
    }
    log("payment_confirmations insert 성공:", { payment_id: paymentId, user_id: user.id, coins_added: coinsToAdd, amount: paidAmount });

    // 2) user_wallets Upsert: admin으로 코인 추가 (없으면 insert, 있으면 update, RLS 우회)
    const { data: wallet, error: walletSelErr } = await admin
      .from("user_wallets")
      .select("coins")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletSelErr) {
      logError("user_wallets 조회 실패:", {
        code: walletSelErr.code,
        message: walletSelErr.message,
        hint: walletSelErr.hint,
      });
      return NextResponse.json(
        { error: "지갑 조회 실패", detail: walletSelErr.message },
        { status: 500 }
      );
    }

    const currentCoins = wallet?.coins ?? 0;
    const newCoins = Number(currentCoins) + Number(coinsToAdd);

    const { error: upsertErr } = await admin
      .from("user_wallets")
      .upsert(
        { user_id: user.id, coins: newCoins },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      logError("user_wallets upsert 실패:", {
        code: upsertErr.code,
        message: upsertErr.message,
        hint: upsertErr.hint,
        user_id: user.id,
        newCoins,
      });
      return NextResponse.json(
        { error: "코인 적립 실패", detail: upsertErr.message },
        { status: 500 }
      );
    }

    log("user_wallets upsert 성공:", { userId: user.id, previousCoins: currentCoins, added: coinsToAdd, newCoins });

    return NextResponse.json({
      success: true,
      new_coins: newCoins,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    logError("처리 중 예외:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    return NextResponse.json(
      { error: "결제 확인 중 오류가 발생했습니다", detail: err.message },
      { status: 500 }
    );
  }
}
