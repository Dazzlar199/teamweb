# Vercel 배포 문제 해결

## 문제: 빌드가 너무 빨리 완료됨 (125ms)

### 원인
- `vercel.json` 파일이 잘못 설정되어 실제 빌드가 실행되지 않음
- Root Directory가 제대로 설정되지 않음

### 해결 방법

#### 1. vercel.json 삭제 (완료 ✅)
- Vercel은 Next.js를 자동으로 감지하므로 `vercel.json`이 불필요
- 삭제 후 Vercel이 자동으로 올바른 설정 감지

#### 2. Vercel 프로젝트 설정 확인

**중요**: Vercel 대시보드에서 다음을 확인하세요:

1. **Settings → General**
   - **Root Directory**: `apps/team-dashboard` 설정 ⚠️ 매우 중요!
   - 이 설정이 없으면 빌드가 실행되지 않음

2. **Settings → Build & Development Settings**
   - **Build Command**: `npm run build` (자동 감지됨)
   - **Output Directory**: `.next` (자동 감지됨)
   - **Install Command**: `npm install` (자동 감지됨)

3. **Settings → Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 3. 수동 재배포

설정을 변경한 후:
1. Vercel 대시보드 → Deployments
2. 최신 배포 옆 "..." → "Redeploy"
3. 빌드 로그 확인 (이제 실제 빌드가 실행되어야 함)

#### 4. 빌드 로그 확인

정상적인 빌드는 다음과 같이 보입니다:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

**현재 문제**: 125ms는 너무 짧음 (보통 30초~2분 소요)

---

## Git Submodule 경고

```
Warning: Failed to fetch one or more git submodules
```

이 경고는 무시해도 됩니다:
- `public/inbloom` 폴더가 submodule로 인식됨
- 기능에는 영향 없음
- 나중에 정리 가능

---

## 다음 단계

1. ✅ vercel.json 삭제 완료
2. ⏳ Vercel에서 Root Directory 설정 확인
3. ⏳ 환경 변수 설정 확인
4. ⏳ 재배포 후 빌드 로그 확인

설정 후에도 문제가 계속되면 알려주세요!

