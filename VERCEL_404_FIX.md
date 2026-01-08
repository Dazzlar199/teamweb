# Vercel 404 에러 해결 가이드

## 현재 상황

- ✅ 빌드 성공 (28초)
- ✅ 14개 페이지 정상 생성
- ❌ 배포 후 404 에러 발생

## 해결 방법

### 1. Vercel 대시보드 설정 확인

**Settings → General**:

- **Root Directory**: **비워두기** (이미 루트가 `team-dashboard`)
- ❌ `apps/team-dashboard`로 설정하면 안 됨

**Settings → Build & Development Settings**:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (자동 감지 또는 명시)
- **Output Directory**: `.next` (자동 감지 또는 명시)
- **Install Command**: `npm install`

### 2. vercel.json 확인 (추가 완료 ✅)

이제 `vercel.json` 파일이 프로젝트 루트에 있습니다:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### 3. 환경 변수 확인

**Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. 프로젝트 재연결 (필요시)

1. Vercel → Settings → General
2. "Disconnect" 클릭
3. GitHub 저장소 다시 연결
4. **Root Directory**: 비워두기 (중요!)
5. 환경 변수 재설정
6. 배포

### 5. 배포 로그 확인

Vercel 대시보드 → Deployments → 최신 배포 → "View Build Logs"

확인할 점:

- `Installing dependencies...` ✅
- `Running "npm run build"` ✅
- `Build Completed` ✅
- `Deploying outputs...` ✅

### 6. 브라우저 캐시 클리어

404 에러가 계속되면:

- 하드 리프레시: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
- 시크릿 모드에서 접속

## 예상 원인

1. **Root Directory 설정 오류**: `apps/team-dashboard`로 설정되어 있으면 안 됨
2. **빌드 출력 경로 문제**: `.next` 디렉토리를 찾지 못함
3. **캐시 문제**: 이전 배포의 캐시가 남아있음

## 다음 단계

1. ✅ `vercel.json` 추가 완료
2. ⏳ Vercel에서 Root Directory 확인 및 제거
3. ⏳ 재배포
4. ⏳ 브라우저에서 확인

---

**가장 중요한 점**: Root Directory를 **비워두세요**! 저장소 루트가 이미 `apps/team-dashboard`이므로 추가 경로 설정이 필요 없습니다.
