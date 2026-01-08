# Vercel 배포 설정 가이드

## ✅ 완료된 작업

`teamweb` 저장소가 이제 `apps/team-dashboard`만 포함합니다.

## 🔧 Vercel 설정 업데이트

### 1. Root Directory 제거 또는 변경

**이전**: `apps/team-dashboard` (monorepo 구조)
**현재**: `.` 또는 **설정 불필요** (이미 루트가 `team-dashboard`)

**Vercel 대시보드에서**:
1. Settings → General
2. **Root Directory**: 비워두거나 `.` 로 설정
3. 저장

### 2. Build & Development Settings 확인

다음 설정들이 자동으로 감지되어야 합니다:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (자동 감지)
- **Output Directory**: `.next` (자동 감지)
- **Install Command**: `npm install` (자동 감지)

### 3. Environment Variables 확인

Settings → Environment Variables에서 다음이 설정되어 있는지 확인:

```
NEXT_PUBLIC_SUPABASE_URL=https://ldvfagbaxlispvhygpip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 재배포

1. Vercel 대시보드 → Deployments
2. 최신 배포 옆 "..." → "Redeploy"
3. 빌드 로그 확인

## 📊 예상 빌드 시간

정상적인 Next.js 빌드는 **30초 ~ 2분** 정도 소요됩니다.

**이전 문제**: 125ms (빌드가 실행되지 않음)
**예상 결과**: 30초 이상 (실제 빌드 실행)

## 🔍 빌드 로그 확인 포인트

정상적인 빌드 로그에는 다음이 포함됩니다:

```
✓ Installing dependencies
✓ Running "npm run build"
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

## ❓ 문제 해결

### 빌드가 여전히 너무 빠름 (125ms)

1. Root Directory가 비어있는지 확인
2. Git 저장소가 올바르게 연결되었는지 확인
3. Vercel 프로젝트를 삭제하고 다시 연결

### Git Submodule 경고

```
Warning: Failed to fetch one or more git submodules
```

이 경고는 무시해도 됩니다. `public/inbloom` 폴더가 submodule로 인식되지만 기능에는 영향 없습니다.

---

**다음 단계**: Vercel에서 Root Directory를 제거하고 재배포하세요!

