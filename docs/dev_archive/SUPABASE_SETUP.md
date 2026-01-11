# Supabase 설정 가이드

## 🎯 목표

팀원들이 데이터를 공유할 수 있도록 Supabase 무료 티어를 설정합니다.

---

## 📋 단계별 설정

### 1️⃣ Supabase 프로젝트 생성

1. **Supabase 가입/로그인**

   - [https://supabase.com](https://supabase.com) 접속
   - GitHub 계정으로 로그인 (권장)

2. **새 프로젝트 생성**
   - 대시보드에서 **"New Project"** 클릭
   - 프로젝트 정보 입력:
     - **Organization**: 선택 (없으면 새로 생성)
     - **Name**: `team-dashboard` (원하는 이름)
     - **Database Password**: **강력한 비밀번호 설정** (나중에 변경 불가!)
       - 예: `MySecurePassword123!@#`
     - **Region**: `Northeast Asia (Seoul)` 선택 (한국 서버)
     - **Pricing Plan**: Free 선택
   - **"Create new project"** 클릭
   - ⏱️ 약 2분 대기 (프로젝트 생성 중)

---

### 2️⃣ API 키 확인

프로젝트가 생성되면:

1. 왼쪽 메뉴에서 **"Settings"** (⚙️) 클릭
2. **"API"** 메뉴 클릭
3. 다음 정보를 복사해둡니다:

   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (보안 주의!)
   ```

   ⚠️ **주의**: `service_role key`는 절대 공개하지 마세요! 서버에서만 사용합니다.

---

### 3️⃣ 데이터베이스 스키마 생성

1. Supabase 대시보드에서 왼쪽 메뉴 **"SQL Editor"** 클릭
2. **"New query"** 클릭
3. `apps/team-dashboard/lib/supabase/schema.sql` 파일의 전체 내용을 복사
4. SQL Editor에 붙여넣기
5. **"Run"** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)
6. ✅ 성공 메시지 확인

---

### 4️⃣ 환경 변수 설정

#### 로컬 개발용

1. `apps/team-dashboard/` 폴더에 `.env.local` 파일 생성:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. 실제 값으로 변경:
   - `NEXT_PUBLIC_SUPABASE_URL`: 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key

#### Vercel 배포용

1. Vercel 프로젝트 페이지 → **"Settings"** → **"Environment Variables"**
2. 다음 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key
3. **"Redeploy"** 클릭

---

### 5️⃣ 테스트

1. 로컬 개발 서버 재시작:

   ```bash
   cd apps/team-dashboard
   npm run dev
   ```

2. 브라우저에서 앱 접속
3. 소통공간에서 게시글 작성
4. Supabase 대시보드 → **"Table Editor"** → **"posts"** 테이블 확인
5. 데이터가 저장되었는지 확인 ✅

---

## 🔍 확인 사항

### Supabase 대시보드에서 확인

- ✅ **Table Editor**: 모든 테이블이 생성되었는지 확인
- ✅ **Authentication**: (나중에 인증 사용 시)
- ✅ **Storage**: (나중에 파일 업로드 사용 시)
- ✅ **SQL Editor**: 스키마가 정상적으로 실행되었는지 확인

### 코드에서 확인

- ✅ `.env.local` 파일이 올바르게 설정되었는지
- ✅ 브라우저 콘솔에 에러가 없는지
- ✅ 데이터가 저장되고 불러와지는지

---

## 🆘 문제 해결

### 환경 변수가 인식되지 않음

```bash
# .env.local 파일이 올바른 위치에 있는지 확인
# apps/team-dashboard/.env.local

# 개발 서버 재시작
npm run dev
```

### 테이블이 생성되지 않음

- SQL Editor에서 에러 메시지 확인
- 한 번에 하나씩 실행해보기
- 이미 테이블이 있다면 `CREATE TABLE IF NOT EXISTS`로 자동 스킵됨

### 데이터가 저장되지 않음

- Supabase 연결 확인:
  - 브라우저 콘솔에서 `NEXT_PUBLIC_SUPABASE_URL` 확인
  - 환경 변수가 제대로 설정되었는지 확인
- RLS 정책 확인:
  - Settings → API → Row Level Security 확인
  - 정책이 활성화되어 있는지 확인

---

## 📊 Supabase 무료 티어 제한

### ✅ 무료로 제공되는 것들

- **Database**: 500MB 저장 공간
- **Bandwidth**: 5GB/월
- **API 요청**: 무제한 (합리적 사용)
- **Realtime**: 200 동시 연결
- **Storage**: 1GB
- **Edge Functions**: 500K invocations/월

### 💡 권장사항

- 데이터 정기 정리 (오래된 활동 로그 삭제 등)
- 이미지는 외부 저장소 사용 고려 (Cloudinary, Imgur 등)
- 사용자가 많아지면 유료 플랜 고려

---

## 🎉 완료!

이제 팀원들이 데이터를 공유할 수 있습니다!

다음 단계:

1. ✅ Supabase 설정 완료
2. 🔄 코드 마이그레이션 (localStorage → Supabase)
3. 🚀 Vercel에 배포

질문이나 문제가 있으면 언제든지 문의하세요!
