# Vercel 배포 문제 해결 가이드

## 현재 상태 확인

### 빌드 로그 보는 방법

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. "Deployments" 탭
4. 진행 중인 배포 클릭
5. "Build Logs" 또는 "Function Logs" 확인

---

## 일반적인 문제들

### 1. 빌드 실패 (Build Failed)

**원인:**

- 의존성 설치 실패
- TypeScript 에러
- 환경 변수 누락

**해결:**

```bash
# 로컬에서 먼저 테스트
cd apps/team-dashboard
npm install
npm run build
```

### 2. 404 에러

**원인:**

- Root Directory 설정 오류
- 빌드 명령어 오류

**해결:**

- Vercel 설정에서 Root Directory: `apps/team-dashboard` 확인
- Build Command: `npm run build` 확인

### 3. 환경 변수 문제

**원인:**

- 환경 변수가 설정되지 않음
- 변수 이름 오타

**해결:**

1. Vercel → Settings → Environment Variables
2. 다음 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy

---

## 빌드 성공 확인 체크리스트

- [ ] Build Logs에 "Build successful" 메시지
- [ ] 배포 상태가 "Ready"
- [ ] 배포된 URL 접속 가능
- [ ] 앱이 정상적으로 로드됨

---

## 지역 설정

현재 빌드가 `iad1` (미국 동부)에서 실행 중입니다.

한국 서버로 배포하려면:

1. Vercel 대시보드 → Settings → General
2. "Region" 설정 확인
3. 또는 vercel.json에서 `regions: ["icn1"]` 설정

---

## 도움말

빌드 로그에서 에러 메시지가 보이면 그 내용을 알려주세요!
