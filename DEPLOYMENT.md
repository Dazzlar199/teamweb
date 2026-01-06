# 배포 가이드

## 📋 목차
1. [Vercel 무료 배포](#vercel-무료-배포)
2. [Supabase 연결 (선택사항)](#supabase-연결-선택사항)
3. [환경 변수 설정](#환경-변수-설정)
4. [GitHub 연동](#github-연동)

---

## Vercel 무료 배포

### ✅ 무료로 사용 가능한 것들
- **무료 도메인**: `your-project.vercel.app` (HTTPS 자동 제공)
- **커스텀 도메인**: 나중에 연결 가능 (무료)
- **빌드**: 월 100회 무료
- **대역폭**: 월 100GB 무료
- **서버리스 함수**: 100GB-hour 무료

### 🚀 배포 단계

#### 1. GitHub 저장소에 푸시
```bash
# 현재 디렉토리에서
cd apps/team-dashboard

# Git 초기화 (아직 안했다면)
git init

# 원격 저장소 추가
git remote add origin https://github.com/Dazzlar199/teamweb.git

# 파일 추가
git add .

# 커밋
git commit -m "Initial commit: Team Dashboard"

# 푸시 (main 브랜치가 없다면)
git branch -M main
git push -u origin main
```

#### 2. Vercel에서 프로젝트 연결
1. [Vercel](https://vercel.com)에 가입/로그인
2. **"Add New..." → "Project"** 클릭
3. **"Import Git Repository"** 클릭
4. GitHub 계정 연동 (처음이라면)
5. `Dazzlar199/teamweb` 저장소 선택
6. **Root Directory** 설정:
   - `apps/team-dashboard`로 설정
7. **Framework Preset**: Next.js 자동 감지
8. **Build Settings**:
   - Build Command: `npm run build` (자동 감지됨)
   - Output Directory: `.next` (자동 감지됨)
   - Install Command: `npm install` (자동 감지됨)
9. **"Deploy"** 클릭

#### 3. 배포 완료
- 배포가 완료되면 `https://your-project.vercel.app` 형태의 URL이 제공됩니다
- 이 URL을 팀원들과 공유하면 바로 사용 가능합니다!

---

## Supabase 연결 (선택사항)

> **현재는 localStorage를 사용 중이므로 각 사용자의 브라우저에만 데이터가 저장됩니다.**  
> 팀원들이 데이터를 공유하려면 Supabase 연결이 필요합니다.

### 왜 Supabase를 사용해야 하나요?

**현재 문제점:**
- 각 사용자의 브라우저에만 데이터 저장
- 다른 팀원과 데이터 공유 불가
- 새 기기/브라우저에서 데이터 접근 불가

**Supabase 연결 후:**
- 모든 팀원이 동일한 데이터베이스 사용
- 실시간 데이터 동기화
- 인증 시스템 (로그인/로그아웃)
- 파일 저장소 (이미지, 문서 등)

### 📝 Supabase 설정 방법

#### 1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 가입/로그인
2. **"New Project"** 클릭
3. 프로젝트 정보 입력:
   - Name: `team-dashboard` (원하는 이름)
   - Database Password: 강력한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택
4. **"Create new project"** 클릭 (약 2분 소요)

#### 2. API 키 확인
프로젝트가 생성되면:
1. 왼쪽 메뉴에서 **"Settings" → "API"** 클릭
2. 다음 정보를 복사해둡니다:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (공개 키)
   - **service_role key**: `eyJhbGc...` (서버 키, 민감 정보)

#### 3. 데이터베이스 스키마 설정
Supabase SQL Editor에서 다음 스키마 실행:

```sql
-- 사용자 확장 (이미 있을 수 있음)
CREATE TABLE IF NOT EXISTS team_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 게시글 (소통공간)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  views INTEGER DEFAULT 0,
  likes TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT FALSE
);

-- 댓글
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  likes TEXT[] DEFAULT '{}'
);

-- Row Level Security 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Allow all operations" ON posts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON comments FOR ALL USING (true);
```

#### 4. 환경 변수 설정

**로컬 개발:**
```bash
# apps/team-dashboard/.env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Vercel 배포:**
1. Vercel 프로젝트 페이지 → **"Settings" → "Environment Variables"**
2. 다음 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`: 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key
3. **"Redeploy"** 클릭

#### 5. 코드 수정 필요
현재 localStorage 기반 코드를 Supabase로 전환해야 합니다.  
이 작업은 별도로 진행이 필요합니다.

---

## 환경 변수 설정

### 로컬 개발용 (.env.local)
```bash
# apps/team-dashboard/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Vercel 환경 변수
Vercel 대시보드에서 설정:
1. 프로젝트 → Settings → Environment Variables
2. 변수 추가 후 Redeploy

**⚠️ 중요**: `.env.local`은 절대 Git에 커밋하지 마세요! (이미 .gitignore에 포함됨)

---

## GitHub 연동

### 자동 배포 설정
Vercel에서 GitHub 저장소를 연결하면:
- ✅ `main` 브랜치에 푸시하면 자동 배포
- ✅ Pull Request 생성 시 프리뷰 배포
- ✅ 배포 상태를 GitHub에서 확인 가능

### 배포 설정
1. Vercel 프로젝트 → **Settings → Git**
2. **Production Branch**: `main`
3. **Auto-deploy**: 활성화

---

## 배포 체크리스트

### 배포 전 확인
- [ ] `npm run build` 성공 확인
- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] 환경 변수 확인 (Supabase 사용 시)
- [ ] GitHub에 코드 푸시 완료

### 배포 후 확인
- [ ] Vercel에서 빌드 성공 확인
- [ ] 배포된 URL 접속 테스트
- [ ] 주요 기능 작동 확인
- [ ] 팀원들과 URL 공유

---

## 문제 해결

### 빌드 실패 시
```bash
# 로컬에서 빌드 테스트
cd apps/team-dashboard
npm run build

# 에러 확인 후 수정
```

### 환경 변수 문제
- Vercel에서 환경 변수가 제대로 설정되었는지 확인
- 환경 변수 이름 앞에 `NEXT_PUBLIC_`가 필요한지 확인
- 배포 후 Redeploy 필요

### 도메인 설정
1. Vercel 프로젝트 → **Settings → Domains**
2. 원하는 도메인 추가 (예: `dashboard.yourdomain.com`)
3. DNS 설정 가이드 따라하기

---

## 다음 단계

1. ✅ **Vercel 배포 완료** → 팀원들과 공유
2. 🔄 **Supabase 연결** (데이터 공유 필요 시)
3. 🎨 **커스텀 도메인 연결** (선택사항)

질문이나 문제가 있으면 언제든지 문의하세요!

