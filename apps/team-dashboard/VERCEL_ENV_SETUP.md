# Vercel 환경 변수 설정 가이드

## ❌ 현재 문제
Vercel에 설정된 Supabase URL이 잘못되었습니다:
- 설정된 값: `ecandbavbykvjoyxuxye.supabase.co` (접속 불가)
- 올바른 값: `ldvfagbaxlispvhygpip.supabase.co`

## ✅ 해결 방법

### 1. Vercel 대시보드 접속
https://vercel.com/dashboard

### 2. 프로젝트 선택
팀 대시보드 프로젝트 클릭

### 3. Settings → Environment Variables
왼쪽 메뉴에서 "Settings" → "Environment Variables"

### 4. 환경 변수 수정/추가

#### 방법 A: 기존 변수 수정
- `NEXT_PUBLIC_SUPABASE_URL` 찾기
- "Edit" 클릭
- 값을 `https://ldvfagbaxlispvhygpip.supabase.co`로 변경
- Save

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 찾기
- "Edit" 클릭
- 값을 아래로 변경:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdmZhZ2JheGxpc3B2aHlncGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODA2MjAsImV4cCI6MjA4MzI1NjYyMH0.KCXo2DjcCo1sNL-8YUCrBzvmqoaWVqACWH_JinBOL5s
```
- Save

#### 방법 B: 새로 추가 (없는 경우)
"Add New" 버튼 클릭:

**변수 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://ldvfagbaxlispvhygpip.supabase.co`
- Environments: ✓ Production ✓ Preview ✓ Development
- Save

**변수 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkdmZhZ2JheGxpc3B2aHlncGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODA2MjAsImV4cCI6MjA4MzI1NjYyMH0.KCXo2DjcCo1sNL-8YUCrBzvmqoaWVqACWH_JinBOL5s`
- Environments: ✓ Production ✓ Preview ✓ Development
- Save

### 5. 재배포
- "Deployments" 탭으로 이동
- 최신 배포 찾기
- 오른쪽 ⋯ (점 3개) 클릭
- "Redeploy" 선택
- 확인

### 6. 완료!
2-3분 후 배포 완료되면 사이트가 정상 작동합니다.

## 🧪 테스트
배포 완료 후:
1. 사이트 접속
2. 로그인: 박건희 / nca1234
3. 버튼 클릭 → 모두 작동 ✅
4. 브라우저 콘솔 → 에러 없어야 함 ✅

## 📞 문제 해결
여전히 문제가 있다면:
- 브라우저 캐시 완전 삭제 (Ctrl+Shift+Delete)
- 시크릿 모드로 접속
- 환경 변수가 모든 환경(Production/Preview/Development)에 설정되었는지 확인
