# 🚀 Supabase 빠른 시작 가이드

## 5분 안에 데이터 공유 설정하기

### 1️⃣ Supabase 프로젝트 생성 (2분)

1. [supabase.com](https://supabase.com) 접속 → **Sign in with GitHub**
2. **"New Project"** 클릭
3. 설정:
   - Name: `team-dashboard`
   - Password: **강력한 비밀번호** (예: `MyPassword123!@#`)
   - Region: **Northeast Asia (Seoul)**
   - Plan: **Free**
4. **"Create new project"** 클릭 → 2분 대기

### 2️⃣ API 키 복사 (30초)

프로젝트 생성 후:
1. 왼쪽 메뉴 **Settings** → **API**
2. 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

### 3️⃣ 데이터베이스 스키마 생성 (1분)

1. 왼쪽 메뉴 **SQL Editor** 클릭
2. **"New query"** 클릭
3. `apps/team-dashboard/lib/supabase/schema.sql` 파일 전체 내용 복사
4. SQL Editor에 붙여넣기
5. **"Run"** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)
6. ✅ "Success" 확인

### 4️⃣ 환경 변수 설정 (1분)

#### 로컬 개발용

`apps/team-dashboard/.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**실제 값으로 변경하세요!**

#### Vercel 배포용

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. 위 두 변수 추가
3. **Redeploy**

### 5️⃣ 테스트 (30초)

```bash
cd apps/team-dashboard
npm run dev
```

브라우저에서 앱 열기 → 소통공간에서 게시글 작성 → Supabase 대시보드에서 **Table Editor** → **posts** 테이블 확인

✅ 데이터가 저장되면 성공!

---

## ✅ 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] API 키 복사 완료
- [ ] SQL 스키마 실행 완료
- [ ] `.env.local` 파일 생성 완료
- [ ] 게시글 저장 테스트 성공

---

## 🆘 문제 해결

### 환경 변수가 인식 안 됨
```bash
# 서버 재시작
npm run dev
```

### 테이블이 안 만들어짐
- SQL Editor에서 에러 메시지 확인
- 한 줄씩 실행해보기

### 데이터가 안 저장됨
- 브라우저 콘솔 확인 (F12)
- 환경 변수가 올바른지 확인
- Supabase 대시보드 → Table Editor에서 테이블 존재 확인

---

## 📚 다음 단계

- [상세 가이드](./SUPABASE_SETUP.md) 참고
- 다른 기능들도 Supabase로 마이그레이션 (진행 중)

**질문 있으면 언제든지!** 🎉

