# Cupidudu UI

Next.js App Router + Supabase Auth 기반 로그인 및 메인 대시보드입니다.

## 실행 방법

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**  
   `.env.local.example`을 복사해 `.env.local`을 만들고 Supabase 값을 채우세요.
   ```bash
   cp .env.local.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key  

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 후, 로그인은 `/login`에서 할 수 있습니다.

## 페이지 구성

| 경로 | 설명 |
|------|------|
| `/login` | 이메일/비밀번호 로그인 (Supabase Auth) |
| `/` | 메인 대시보드 (로그인 필요) |
| `/cards` | 카드함 (플레이스홀더) |
| `/chat` | 채팅 (플레이스홀더) |
| `/mypage` | 마이페이지 (로그인 사용자 정보) |

## Supabase 설정

### Auth
- Supabase 대시보드에서 **Authentication > Providers** 에서 Email 사용 설정
- **Authentication > URL Configuration** 에서 Site URL / Redirect URLs에 `http://localhost:3000` 등 추가

### `delivered_cards` 테이블
대시보드에서 “오늘의 인연이 도착했습니다” 카드를 보여주려면 아래 컬럼을 가진 `delivered_cards` 테이블이 필요합니다.

- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users.id) — 카드를 받는 사용자
- `sender_name` (text, 선택) — 보낸 사람 이름
- `sender_job` (text, 선택) — 보낸 사람 직업
- `sender_greeting` (text, 선택) — 인사말
- `sender_thumbnail` (text, 선택) — 프로필 이미지 URL
- `created_at` (timestamptz, 선택)

다른 스키마(예: `sender_id`로 profiles 조인)를 쓰는 경우 `app/page.tsx`의 `select`와 `components/DashboardContent.tsx`·`CardArrived.tsx`의 필드 매핑만 수정하면 됩니다.

### RLS (Row Level Security)
- `delivered_cards`에 RLS를 켠 경우, “본인에게 배정된 카드만 읽기” 규칙을 추가하세요.  
  예: `user_id = auth.uid()` 인 행만 `SELECT` 허용.

## UI 가이드

- **모바일 퍼스트**: 작은 화면 기준 레이아웃, `max-w-lg` 등으로 큰 화면에서도 가독 유지
- **하단 네비게이션**: 홈, 카드함, 채팅, 마이페이지 — 로그인 페이지(`/login`)에서는 숨김
- **Cupidudu 톤**: 핑크·화이트·크림 계열 (`tailwind.config.ts`의 `cupid` 색상)
