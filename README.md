# 팀 대시보드 (Team Dashboard)

특별시 팀의 내부 협업 및 관리 도구입니다.

## 🚀 빠른 시작

### 로컬 개발

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 환경 변수 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📦 배포

### Vercel 배포

1. GitHub 저장소 연결
2. Root Directory: `apps/team-dashboard` 설정
3. Environment Variables 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참고

## 📚 문서

- [배포 가이드](./DEPLOYMENT.md)
- [Supabase 설정](./SUPABASE_SETUP.md)
- [Supabase 빠른 시작](./SUPABASE_QUICK_START.md)

## 🛠️ 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase (선택사항)

## 📝 기능

- 대시보드
- 일정 관리
- 프로젝트 관리
- 문서 관리
- 2026 예비창업패키지 관리
- 재무 관리
- 고객 검증 (인터뷰, 설문조사)
- 소통공간 (게시판)
