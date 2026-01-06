# ✅ 환경 변수 설정 완료 가이드

## 1. .env.local 파일 생성

`apps/team-dashboard/` 폴더에 `.env.local` 파일을 생성하세요.

## 2. 다음 내용을 복사해서 붙여넣기

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ldvfagbaxlispvhygpip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdmZhZ2JheGxpc3B2aHlncGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODA2MjAsImV4cCI6MjA4MzI1NjYyMH0.KCXo2DjcCo1sNL-8YUCrBzvmqoaWVqACWH_JinBOL5s
```

## 3. 파일 저장

파일을 저장하세요.

## 4. 개발 서버 재시작

```bash
cd apps/team-dashboard
npm run dev
```

## 5. 테스트

1. 브라우저에서 앱 열기
2. 소통공간 페이지로 이동
3. 게시글 작성해보기
4. Supabase 대시보드 → Table Editor → posts 테이블 확인
5. 데이터가 저장되었는지 확인 ✅

---

## 다음 단계: SQL 스키마 실행

이제 데이터베이스 테이블을 만들어야 합니다!

1. Supabase 대시보드 → **SQL Editor** 클릭
2. **"New query"** 클릭
3. `apps/team-dashboard/lib/supabase/schema.sql` 파일의 전체 내용 복사
4. SQL Editor에 붙여넣기
5. **"Run"** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)
6. ✅ 성공 메시지 확인

---

## Vercel 배포 시

Vercel에 배포할 때도 환경 변수를 설정해야 합니다:

1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. 다음 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://ldvfagbaxlispvhygpip.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **Redeploy** 클릭

---

## 완료! 🎉

이제 팀원들이 데이터를 공유할 수 있습니다!

