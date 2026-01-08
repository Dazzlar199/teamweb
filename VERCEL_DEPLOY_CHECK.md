# Vercel 배포 문제 진단 및 해결 가이드

## 🔍 현재 상태 확인

### ✅ 로컬 빌드 성공
- 빌드가 정상적으로 완료됨
- 모든 페이지가 정상 생성됨

### ⚠️ Vercel 배포 문제

## 📋 확인해야 할 사항

### 1. Vercel 대시보드 확인

#### A. Root Directory 설정
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → General
3. **Root Directory** 확인:
   - ✅ 올바른 설정: `apps/team-dashboard` (monorepo인 경우)
   - ✅ 또는 비워두기 (루트가 team-dashboard인 경우)

#### B. Build & Development Settings
1. Settings → General → Build & Development Settings
2. 다음 설정 확인:
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

#### C. Environment Variables
1. Settings → Environment Variables
2. 다음 변수들이 **모든 환경(Production, Preview, Development)**에 설정되어 있는지 확인:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ldvfagbaxlispvhygpip.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. 배포 로그 확인

1. Vercel 대시보드 → Deployments 탭
2. 최신 배포 클릭
3. **Build Logs** 확인:
   - ❌ 빌드 실패 시: 에러 메시지 확인
   - ✅ 빌드 성공 시: 배포 URL 접속 테스트

### 3. 일반적인 문제 및 해결

#### 문제 1: 빌드 실패 (Build Failed)

**증상:**
```
Error: Build failed
```

**해결:**
1. Build Logs에서 에러 메시지 확인
2. 일반적인 원인:
   - TypeScript 에러 → 로컬에서 `npm run build` 실행하여 확인
   - 의존성 문제 → `package.json` 확인
   - 환경 변수 누락 → Environment Variables 확인

#### 문제 2: 배포는 성공했지만 404 에러

**증상:**
- 배포는 성공했지만 페이지가 404를 표시

**해결:**
1. Root Directory 설정 확인
2. `vercel.json` 파일 확인
3. 브라우저 캐시 삭제 후 재시도

#### 문제 3: 환경 변수 문제

**증상:**
- Supabase 연결 실패
- 빈 화면 또는 에러

**해결:**
1. Environment Variables에서 변수 이름 확인 (대소문자 정확히)
2. 모든 환경(Production, Preview, Development)에 설정되어 있는지 확인
3. 재배포 (Redeploy)

## 🚀 수동 재배포 방법

1. Vercel 대시보드 → Deployments
2. 최신 배포 옆 "..." 메뉴 클릭
3. **"Redeploy"** 선택
4. 빌드 로그 확인

## 📝 체크리스트

배포 전 확인:
- [ ] Git에 모든 변경사항 푸시됨
- [ ] Root Directory 올바르게 설정됨
- [ ] 환경 변수 모두 설정됨 (Production, Preview, Development)
- [ ] 로컬에서 `npm run build` 성공
- [ ] `vercel.json` 파일이 올바름

배포 후 확인:
- [ ] 빌드 로그에 "Build successful" 메시지
- [ ] 배포 상태가 "Ready"
- [ ] 배포된 URL 접속 가능
- [ ] 페이지가 정상적으로 로드됨
- [ ] Supabase 연결 정상 작동

## 🔧 추가 설정 (선택사항)

### 한국 서버로 배포
`vercel.json`에 다음 추가:
```json
{
  "regions": ["icn1"]
}
```

### 빌드 최적화
`next.config.ts`에서 이미 설정됨:
```typescript
trailingSlash: false
```

## 💡 도움말

문제가 계속되면:
1. Vercel 대시보드의 Build Logs 전체 내용을 확인
2. 에러 메시지를 복사하여 공유
3. 로컬 빌드 로그와 비교

---

**마지막 업데이트**: 2025-01-16


