# 🔑 Supabase API 키 찾기 가이드

## anon public key 찾는 방법

### 방법 1: Settings → API (가장 일반적)

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택 (또는 프로젝트로 이동)
3. 왼쪽 사이드바에서 **Settings** (⚙️ 아이콘) 클릭
4. **API** 메뉴 클릭
5. **Project API keys** 섹션에서 찾기:
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (이것을 사용!)
   - **service_role**: (이건 사용하지 마세요, 서버 전용)

### 방법 2: Table Editor에서 확인

1. 왼쪽 메뉴 **Table Editor** 클릭
2. 상단에 "API" 링크가 있을 수 있음

### 방법 3: 프로젝트 홈에서

1. 프로젝트 대시보드 홈
2. 오른쪽 상단 또는 중앙에 "API Settings" 또는 "Get API keys" 버튼

### 방법 4: 직접 URL 접속

다음 URL로 직접 접속해보세요:
```
https://supabase.com/dashboard/project/ldvfagbaxlispvhygpip/settings/api
```

(프로젝트 ID는 URL에서 확인 가능)

---

## ⚠️ 키가 보이지 않는 경우

### 1. 프로젝트가 아직 생성 중일 수 있음
- 프로젝트 생성 후 2-3분 정도 기다려보세요
- 페이지를 새로고침해보세요

### 2. 권한 문제
- 프로젝트 소유자인지 확인
- 다른 팀원이 만든 프로젝트라면 권한 요청 필요

### 3. 다른 위치에 있을 수 있음
- **Authentication** → **Settings**에서 확인
- **Project Settings** → **General**에서 확인

---

## 🔍 키 형식 확인

올바른 anon public key는:
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식 (JWT 토큰)
- 보통 200자 이상의 긴 문자열
- `sb_publishable_` 같은 형식이 아님

---

## 📝 환경 변수 설정

키를 찾으셨다면:

1. `apps/team-dashboard/.env.local` 파일 생성
2. 다음 내용 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ldvfagbaxlispvhygpip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_찾은_키_붙여넣기
```

3. 개발 서버 재시작:
```bash
npm run dev
```

---

## 🆘 여전히 찾을 수 없다면

1. Supabase 지원팀에 문의
2. 또는 새 프로젝트 생성 (5분 정도 소요)
3. 프로젝트 생성 시 API 키가 자동으로 생성됨

---

## ✅ 확인 방법

키를 설정한 후, 브라우저 콘솔에서 확인:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

둘 다 값이 출력되면 성공!

