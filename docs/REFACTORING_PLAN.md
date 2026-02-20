# Cupidudu 코드베이스 리팩터링 계획서

## 1. 현재 코드 구조 문제 분류

### 1.1 중복 (Duplication)

| 유형 | 위치 | 내용 |
|------|------|------|
| `translateError()` | `LandingWithLogin.tsx`, `login/page.tsx`, `signup/page.tsx` | 동일 함수 3곳 중복, errorMap 일부만 차이 |
| `isInsufficientCoinError()` | `CardArrived.tsx`, `CardDetail.tsx` | 완전 동일 구현 |
| `user_id` → `id` 컬럼 fallback | `profile/save`, `profile/submit`, `onboarding/details/submit`, `admin/users/approve`, `admin/approve`, `admin/reject`, `me/route.ts` | `.eq("user_id")` 실패 시 `.eq("id")` 재시도 패턴 7곳 |
| `MAX_IMAGE_SIZE_BYTES`, `ALLOWED_IMAGE_EXTENSIONS` | `ProfileEditForm.tsx`, `OnboardingDetailsForm.tsx` | 이미지 검증 상수/로직 동일 |
| API catch 블록 | 다수 API 라우트 | `error instanceof Error ? error.message : "..."` 반복 |
| 코인/wallet 조회 | `Header`, `CardArrived`, `CardDetail`, `StoreCharge`, `store/page.tsx`, `cards/[id]/page.tsx` | 유사한 패턴으로 wallet 조회 |
| 카드 언락 플로우 | `CardArrived`, `CardDetail` | `REQUIRED_COINS=5`, `InsufficientCoinModal`, `MatchingApplyModal` 등 동일 구조 |

---

### 1.2 폴더/구조 (Folder & Structure)

| 문제 | 내용 |
|------|------|
| API 라우트 산재 | `api/admin/*`, `api/auth/*`, `api/profile/*`, `api/payment/*` 등 일관된 그룹핑 없음 |
| 컴포넌트 평탄 구조 | `components/` 하위 22개 컴포넌트가 한 레벨에 혼재 |
| lib 혼합 | `admin.ts`, `auth-username.ts`, `password-validation.ts` 등 도메인별 유틸이 한 폴더에 |
| admin API 토큰 불일치 | `admin/users/approve`는 `body.token`, 나머지는 `x-admin-token` 헤더 사용 |
| members vs members/[id] | members 관련 페이지가 members/ 폴더에만 있고 일부는 다른 경로와 혼재 |

---

### 1.3 데이터 fetch (Data Fetching)

| 문제 | 내용 |
|------|------|
| 페이지별 직접 Supabase 호출 | `members/page.tsx`, `members/[id]/page.tsx` 등에서 공유 훅 없이 직접 쿼리 |
| `createAdminClient()` 사용처 혼재 | `cards/page.tsx`, `cards/[id]/page.tsx`에서 admin client로 프로필 목록 조회 |
| 서버/클라이언트 혼용 | 서버 컴포넌트에서 `createClient(server)` vs 클라이언트에서 `createClient(client)` |
| fetch 응답 처리 불일치 | `{ message }` vs `{ error }` vs `{ error, detail }` 등 API 응답 형식 상이 |

---

### 1.4 Auth & 권한 (Auth & Permissions)

| 문제 | 내용 |
|------|------|
| 페이지별 개별 인증 | 각 보호 페이지가 `getUser()` 후 직접 redirect |
| 미들웨어 미활용 | `middleware.ts`는 세션 갱신만, 경로 보호/리다이렉트 없음 |
| members 미보호 | `members/page.tsx`, `members/[id]/page.tsx`가 인증 체크 없음(또는 불완전) |
| API 인증 반복 | 대부분 API가 `getUser()` → 401 동일 패턴 |
| admin 인증 분리 | Supabase auth와 별도 `lib/admin.ts` 기반 토큰, 코드 내 하드코딩 credentials |

---

### 1.5 RLS (Row Level Security)

| 상태 | 내용 |
|------|------|
| 정책 존재 | `user_profiles`, `profile_verifications`, `values_answers`, `user_badges` 등 RLS 정책 정의됨 |
| service_role 우회 | admin API, payment 등은 `createAdminClient()`로 RLS 우회 |
| user_wallets | migrations에서 RLS 정책 명시 없음, service_role 우회 의존 가능 |
| 스키마 불일치 | `user_id` vs `id` 컬럼 사용처 혼재로 인해 정책/애플리케이션 로직 괴리 |

---

### 1.6 결제 (Payment)

| 구분 | 내용 |
|------|------|
| 서버 검증 | `api/payment/confirm`에서 PortOne 확인, 금액/상태/orderId 검증, idempotency 처리 |
| 클라이언트 | PortOne SDK `StoreCharge.tsx`에서 `requestPayment()` 후 confirm API 호출 |
| 코인 차감 | `unlock_profile_card` RPC에서 5코인 차감 (서버 강제) |
| 위험 요소 | payment API는 서버 검증 있음. 리팩터 시 이 경로 변경 금지 |

---

### 1.7 채팅 4회 제한 (Chat 4-Time Limit)

| 상태 | 내용 |
|------|------|
| 현재 | `app/chat/page.tsx`는 stub. 프로필 체크 후 빈 UI만 표시. 4회 제한 로직 없음 |
| 제약 | 향후 채팅 구현 시 **총 4회 제한**은 반드시 **서버에서** 강제할 것 (클라이언트만 신뢰 금지) |

---

### 1.8 관리자 영역 (Admin Area)

| 문제 | 내용 |
|------|------|
| 토큰 불일치 | `admin/users/approve`만 `body.token`, 나머지는 `x-admin-token` |
| credentials 하드코딩 | `lib/admin.ts`에 `ADMIN_CREDENTIALS` 상수 |
| 토큰 검증 약함 | `admin_` 접두사만 체크, 만료/HMAC 없음 |
| API 분산 | `api/admin/users`, `api/admin/approve`, `api/admin/reject` 등 유사 기능 라우트 분산 |

---

## 2. 목표 폴더 구조 (레이어링 포함)

```
c:\ui\
├── app/
│   ├── (auth)/                    # 인증 레이아웃 그룹
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (protected)/               # 보호 페이지 그룹 (layout에서 auth 체크)
│   │   ├── cards/
│   │   ├── chat/
│   │   ├── me/
│   │   ├── mypage/
│   │   ├── onboarding/
│   │   ├── store/
│   │   └── members/
│   ├── (admin)/                  # 관리자 전용 그룹
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── users/
│   │   │   └── reviews/
│   │   └── api/admin/
│   ├── api/
│   │   ├── auth/
│   │   ├── payment/
│   │   ├── profile/
│   │   ├── onboarding/
│   │   ├── cards/
│   │   └── me/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # 재사용 UI (버튼, 인풋 등)
│   ├── layout/                   # Header, BottomNav, NavWrapper
│   ├── auth/                     # LandingWithLogin, LogoutButton
│   ├── cards/                    # CardArrived, CardDetail, CardBoxList
│   ├── profile/                  # ProfileEditForm, GenderSelector
│   ├── store/                    # StoreCharge, InsufficientCoinModal
│   └── admin/                    # AdminDashboard
├── lib/
│   ├── supabase/                 # client, server, admin, middleware
│   ├── auth/                     # auth-username, getCurrentUser 유틸
│   ├── admin/                    # admin, admin-api (통일)
│   ├── payment/                  # 결제 관련 상수/유틸 (필요 시)
│   ├── constants/                # MAX_IMAGE_SIZE, ALLOWED_EXTENSIONS 등
│   └── utils/                    # translateError, 에러 메시지 유틸
├── hooks/                        # useCoins, useProfile, useAuth 등 (신규)
└── supabase/
```

---

## 3. 리팩터링 PR 체크리스트 (10개 PR)

### PR #1: 공통 유틸 추출 (에러/상수)

**목표**: 중복 제거, ESLint/타입 정리

**변경 범위**:
- 신규: `lib/utils/translate-error.ts`
- 신규: `lib/constants/images.ts` (MAX_IMAGE_SIZE, ALLOWED_EXTENSIONS)
- 수정: `LandingWithLogin.tsx`, `login/page.tsx`, `signup/page.tsx` → `translateError` import
- 수정: `ProfileEditForm.tsx`, `OnboardingDetailsForm.tsx` → 상수 import

**위험도**: 낮음

**검증**:
- `npm run build`
- 로그인/회원가입/프로필폼 에러 메시지 표시 확인
- 이미지 업로드 검증 동작 확인

---

### PR #2: user_id / id 컬럼 fallback 헬퍼

**목표**: 7곳에 흩어진 fallback 로직을 한 헬퍼로 통합

**변경 범위**:
- 신규: `lib/supabase/profile-update.ts` 또는 `lib/supabase/update-by-user.ts`
- 수정: `api/profile/save`, `api/profile/submit`, `api/onboarding/details/submit`, `api/admin/users/approve`, `api/admin/approve`, `api/admin/reject`, `api/me/route.ts`

**위험도**: 중간 (DB 스키마 의존)

**검증**:
- `npm run build`
- 프로필 저장/온보딩 제출/me API 호출
- admin 승인/거절
- `user_id` / `id` 둘 다 있는 스키마와 `id`만 있는 스키마 환경에서 각각 테스트 권장

---

### PR #3: 카드 관련 중복 제거 (CardArrived, CardDetail)

**목표**: `isInsufficientCoinError`, 코인 상수, 언락 플로우 공통화

**변경 범위**:
- 신규: `lib/utils/coin-errors.ts` (또는 `components/cards/utils.ts`)
- 수정: `CardArrived.tsx`, `CardDetail.tsx` → 공통 함수/상수 사용

**위험도**: 중간 (결제/코인 차감 흐름)

**검증**:
- `npm run build`
- 카드함 목록, 카드 상세, 코인 부족 시 모달, 5코인 unlock 플로우
- `unlock_profile_card` RPC 호출 정상 동작 확인

---

### PR #4: 컴포넌트 폴더 재구성 (물리적 이동만)

**목표**: `components/` 하위를 도메인별 서브폴더로 이동

**변경 범위**:
- 이동: `CardArrived`, `CardDetail`, `CardBoxList` → `components/cards/`
- 이동: `ProfileEditForm`, `GenderSelector` → `components/profile/`
- 이동: `StoreCharge`, `InsufficientCoinModal`, `MatchingApplyModal` → `components/store/` (또는 `components/modals/`)
- 이동: `AdminDashboard` → `components/admin/`
- 이동: `Header`, `BottomNav`, `NavWrapper` → `components/layout/`
- 이동: `LandingWithLogin`, `LogoutButton` → `components/auth/`
- 수정: 해당 컴포넌트를 import하는 모든 파일의 경로

**위험도**: 낮음

**검증**:
- `npm run build`
- 전체 페이지 네비게이션 및 렌더링 확인

---

### PR #5: API 응답 형식 표준화

**목표**: `{ message }` vs `{ error }` 통일

**변경 범위**:
- 정책: 모든 API는 실패 시 `{ message: string }` 반환으로 통일
- 수정: `{ error }` 또는 `{ error, detail }` 사용 중인 라우트 → `{ message }`로 변경
- 클라이언트: `data.error` 사용처 → `data.message`로 변경

**위험도**: 낮음

**검증**:
- `npm run build`
- 각 API 실패 시 클라이언트 에러 표시 확인

---

### PR #6: 관리자 API 토큰 통일

**목표**: `body.token` 제거, `x-admin-token` 헤더만 사용

**변경 범위**:
- 수정: `lib/admin-api.ts` — `getAdminTokenFromRequest`가 헤더만 확인
- 수정: `api/admin/users/approve/route.ts` — `body.token` 대신 `x-admin-token` 사용
- 수정: `AdminDashboard.tsx` (또는 approve 호출处) — 요청 시 `headers: { "x-admin-token": token }` 전달
- 참고: AdminDashboard에서 approve 관련 호출이 제거된 상태라면, 해당 호출부 복원 시 이 방식 적용

**위험도**: 낮음 (admin 기능만 영향)

**검증**:
- `npm run build`
- 관리자 로그인 → 사용자 승인 API 호출 (헤더 기반) 확인

---

### PR #7: 인증 유틸 통합 (getCurrentUser, requireAuth)

**목표**: 페이지/API의 반복 인증 로직을 유틸로 추출

**변경 범위**:
- 신규: `lib/auth/get-current-user.ts` (server용)
- 신규: `lib/auth/require-auth-api.ts` (API route용 래퍼 또는 유틸)
- 수정: 보호 페이지들 — `getCurrentUser()` → redirect 패턴 공통화
- 수정: API 라우트들 — `requireAuth()` 같은 래퍼 사용 (선택)

**위험도**: 중간

**검증**:
- `npm run build`
- 비로그인 시 보호 페이지 → `/login` 리다이렉트
- 비로그인 API 호출 → 401
- `members` 페이지 인증 필요 시 체크 추가

---

### PR #8: useCoins / useWallet 훅 도입

**목표**: wallet/coins 조회 로직을 훅으로 통합

**변경 범위**:
- 신규: `hooks/use-coins.ts` (또는 `hooks/use-wallet.ts`)
- 수정: `Header`, `CardArrived`, `CardDetail`, `StoreCharge`, `store/page.tsx`, `cards/[id]/page.tsx` → 훅 사용

**위험도**: 중간 (코인 표시/결제 플로우)

**검증**:
- `npm run build`
- 상단 코인 표시, 스토어, 카드 언락 시 잔액 갱신
- 결제 후 코인 증가 반영 확인

---

### PR #9: lib 폴더 재구성

**목표**: `lib/` 하위를 auth, admin, constants, utils로 분리

**변경 범위**:
- 이동: `auth-username.ts` → `lib/auth/` (또는 `lib/supabase/` 유지)
- 이동: `admin.ts`, `admin-api.ts` → `lib/admin/`
- 이동: PR#1에서 만든 `constants/`, `utils/` 유지
- 수정: 모든 import 경로

**위험도**: 낮음

**검증**:
- `npm run build`
- 로그인, 회원가입, admin, 프로필 등 전반 동작 확인

---

### PR #10: app 라우트 그룹 정리 (선택)

**목표**: `(auth)`, `(protected)`, `(admin)` 라우트 그룹 도입

**변경 범위**:
- `app/(auth)/login`, `(auth)/signup` 등 생성
- `app/(protected)/cards` 등 생성
- layout에서 그룹별 공통 auth 체크
- 기존 경로 유지 (`/login`, `/cards` 등)

**위험도**: 중간 (라우팅/레이아웃)

**검증**:
- `npm run build`
- 전체 경로 접근, 레이아웃 적용 확인
- 미들웨어와 충돌 없는지 확인

---

### PR #11: members 페이지 인증 보강 (선택)

**목표**: `members` 경로에 인증 필수 적용

**변경 범위**:
- `app/members/page.tsx`, `app/members/[id]/page.tsx`
- `getUser()` 체크 추가, 미인증 시 `/login` 리다이렉트

**위험도**: 낮음

**검증**:
- `npm run build`
- 비로그인 시 members 접근 → 로그인 페이지 리다이렉트

---

### PR #12: 채팅 4회 제한 설계/문서화 (선택)

**목표**: 향후 채팅 구현 시 제약 명시

**변경 범위**:
- 신규: `docs/CHAT_CONSTRAINTS.md` — 4회 제한은 서버에서 강제한다는 원칙 명시
- 또는 `app/chat/page.tsx` 주석으로 제약 문서화

**위험도**: 없음

**검증**:
- 문서 검토

---

## 4. PR별 요약표

| PR | 제목 | 파일 수 | 위험도 | 검증 |
|----|------|---------|--------|------|
| 1 | 공통 유틸 추출 (translateError, 이미지 상수) | ~6 | 낮음 | build, 로그인/회원가입/이미지 업로드 |
| 2 | user_id/id fallback 헬퍼 | ~8 | 중간 | build, 프로필/온보딩/admin |
| 3 | 카드 컴포넌트 중복 제거 | ~4 | 중간 | build, 카드함/언락/코인 |
| 4 | 컴포넌트 폴더 재구성 | ~30+ | 낮음 | build, 전체 페이지 |
| 5 | API 응답 형식 표준화 | ~15 | 낮음 | build, API 실패 처리 |
| 6 | 관리자 API 토큰 통일 | ~3 | 낮음 | build, admin 승인 |
| 7 | 인증 유틸 통합 | ~15 | 중간 | build, 보호 페이지/API |
| 8 | useCoins 훅 도입 | ~7 | 중간 | build, 코인/결제 |
| 9 | lib 폴더 재구성 | ~20 | 낮음 | build, 전반 |
| 10 | app 라우트 그룹 | ~25 | 중간 | build, 라우팅/레이아웃 |
| 11 | members 인증 보강 | 2 | 낮음 | build, members |
| 12 | 채팅 제약 문서화 | 1 | 없음 | 문서 검토 |

---

## 5. 핵심 제약 체크리스트 (모든 PR)

- [ ] **결제**: `api/payment/confirm` 경로 및 서버 검증 로직 변경 금지
- [ ] **코인 차감**: `unlock_profile_card` RPC 호출 및 5코인 차감 로직 변경 금지
- [ ] **채팅 4회 제한**: 향후 구현 시 서버 강제 원칙 유지
- [ ] **RLS**: `createAdminClient()` 사용처는 admin/결제 등 서버 전용으로 제한
- [ ] **기능 회귀**: 각 PR 후 로그인, 회원가입, 프로필, 결제, 카드 언락, admin 동작 스모크 테스트
