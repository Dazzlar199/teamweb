# 환경 변수 설정 가이드

## 1. .env.local 파일 생성

`apps/team-dashboard/` 폴더에 `.env.local` 파일을 생성하세요.

## 2. 다음 내용 입력

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ldvfagbaxlispvhygpip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_키_입력
```

## 3. anon public key 찾기

### Supabase 대시보드에서:

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. 왼쪽 메뉴 **Settings** → **API** 클릭
4. **Project API keys** 섹션에서:
   - **anon public** 키 복사 (JWT 형식, `eyJhbGc...`로 시작)
   - ⚠️ **service_role** 키는 사용하지 마세요!

### 직접 URL로 접속:

```
https://supabase.com/dashboard/project/ldvfagbaxlispvhygpip/settings/api
```

## 4. 파일 저장 후 서버 재시작

```bash
cd apps/team-dashboard
npm run dev
```

## 5. 확인

브라우저 콘솔(F12)에서:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

값이 출력되면 성공!

---

## ⚠️ 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 키를 절대 공유하지 마세요
- Vercel 배포 시에도 환경 변수를 설정해야 합니다

