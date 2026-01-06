# 팀 대시보드 추가 기능 필요 사항 분석

> **분석 일자**: 2025-01-16  
> **기준 문서**: `inbloom/index.html` (26년 예비창업패키지 합격 가이드북)  
> **현재 프로젝트**: `apps/team-dashboard`

---

## 📊 현재 구현된 기능

### ✅ 완료된 기능
1. **대시보드** (`/`)
   - 전체 일정 요약
   - 진행 중인 작업
   - 최근 업로드 파일
   - 팀원 활동 로그

2. **일정 관리** (`/calendar`)
   - 캘린더 뷰
   - 일정 등록/수정/삭제
   - 팀원별 일정 표시
   - 공휴일 표시

3. **작업 관리** (`/tasks`)
   - 작업 등록/수정/삭제
   - 상태 관리 (할 일, 진행 중, 완료)
   - 담당자 지정
   - 우선순위 설정
   - 프로젝트룸 기능

4. **파일 공유** (`/files`)
   - 파일 업로드
   - 파일 다운로드
   - 파일 목록 조회
   - 파일 검색

5. **예창패 페이지** (`/yechangpack`)
   - 로드맵 관리 (Phase별)
   - 작업 관리 (태스크)
   - 체크리스트
   - 문서 탭
   - 노트 탭
   - 평가 기준 점수 입력

6. **재무 관리** (`/finance`)
   - 아카데미 지원금 관리 (2,000만원)
   - 구독목록 관리
   - 구매목록 관리
   - 통계 대시보드

---

## ❌ 가이드북 기준 추가 필요 기능

### 🔴 우선순위 1: 즉시 필요 (1월 내)

#### 1. 인터뷰 관리 시스템 (`/interviews`)
**필요성**: 가이드북 PART 1 - 고객검증
- 예비부부 심층 인터뷰 35명 진행
- 프리랜서 인터뷰 진행
- 인터뷰 결과 기록 및 분석

**필요 기능**:
- [ ] 인터뷰 일정 예약 및 관리
- [ ] 인터뷰 스크립트 템플릿 (가이드북에 포함됨)
- [ ] 인터뷰 결과 입력 폼
  - 인터뷰 대상자 정보 (익명화)
  - 주요 답변 기록
  - 페인포인트 추출
  - 인용구 추출 및 태깅
- [ ] 인터뷰 분석 대시보드
  - 페인포인트 통계
  - 인용구 모음
  - 인터뷰 진행률
- [ ] 인터뷰 녹음/녹취록 업로드
- [ ] 인터뷰 요약본 생성 (사업계획서용)

**데이터 구조**:
```typescript
interface Interview {
  id: string;
  type: 'couple' | 'freelancer';
  interviewee: {
    name: string; // 익명화 가능
    age?: number;
    region?: string;
    // ...
  };
  scheduledDate: Date;
  completedDate?: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  script: string; // 가이드북 스크립트
  responses: {
    question: string;
    answer: string;
    painPoint?: boolean;
    quote?: boolean; // 인용 가능 여부
  }[];
  painPoints: string[];
  quotes: string[]; // 인용구
  recordingUrl?: string;
  summary?: string; // 요약본
  createdBy: string;
  createdAt: Date;
}
```

**UI 구성**:
- 인터뷰 목록 (필터: 예비부부/프리랜서, 진행상태)
- 인터뷰 상세 페이지
- 인터뷰 일정 캘린더
- 페인포인트 분석 차트
- 인용구 데이터베이스

---

#### 2. 설문조사 관리 시스템 (`/surveys`)
**필요성**: 가이드북 PART 1 - 고객검증
- 정량 설문조사 150명+ 진행
- PMF 측정
- 설문 결과 분석 및 시각화

**필요 기능**:
- [ ] 설문 양식 빌더
  - 질문 추가/수정/삭제
  - 질문 유형 (단일선택, 다중선택, 주관식, 척도)
  - 필수/선택 질문 설정
- [ ] 설문 배포
  - 링크 생성
  - QR 코드 생성
  - 외부 플랫폼 연동 (Google Forms, Typeform 등)
- [ ] 응답 수집 및 관리
- [ ] 설문 결과 분석
  - 통계 분석 (빈도, 평균, 교차분석)
  - 시각화 (차트, 그래프)
  - PMF 지표 계산
- [ ] 설문 결과 내보내기 (CSV, PDF)
- [ ] 설문 진행률 추적

**데이터 구조**:
```typescript
interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  targetCount: number; // 목표 응답 수 (150명+)
  responseCount: number;
  status: 'draft' | 'active' | 'closed';
  createdAt: Date;
  createdBy: string;
}

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'scale';
  question: string;
  options?: string[];
  required: boolean;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  responses: {
    questionId: string;
    answer: string | string[] | number;
  }[];
  submittedAt: Date;
}
```

**UI 구성**:
- 설문 목록
- 설문 생성/편집 페이지
- 설문 결과 분석 대시보드
- PMF 지표 표시
- 차트/그래프 시각화

---

#### 3. 사업계획서 협업 도구 (`/business-plan`)
**필요성**: 가이드북 PART 6 - 심사 준비
- 사업계획서 초안 작성
- 예창패 공고 기준에 맞춘 수정
- 팀원별 리뷰 및 피드백
- 버전 관리

**필요 기능**:
- [ ] 문서 에디터 (Rich Text Editor)
  - 섹션별 작성 (PART 0~7)
  - 템플릿 제공 (가이드북 기준)
- [ ] 버전 관리
  - 버전 히스토리
  - 버전 비교
  - 이전 버전 복원
- [ ] 협업 리뷰
  - 댓글 기능
  - 제안/수정 요청
  - 승인/거부 워크플로우
- [ ] PDF 생성 및 내보내기
- [ ] 공고 기준 체크리스트
  - 예창패 공고 기준 항목 체크
  - 누락 항목 알림
- [ ] 문서 템플릿 관리
  - 가이드북 섹션별 템플릿
  - 커스텀 템플릿

**데이터 구조**:
```typescript
interface BusinessPlan {
  id: string;
  title: string;
  version: number;
  sections: {
    part: string; // 'PART 0', 'PART 1', ...
    title: string;
    content: string; // Rich text
    status: 'draft' | 'review' | 'approved';
  }[];
  checklist: {
    item: string;
    checked: boolean;
    required: boolean;
  }[];
  reviews: Review[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface Review {
  id: string;
  sectionId: string;
  comment: string;
  suggestions: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewer: string;
  createdAt: Date;
}
```

**UI 구성**:
- 사업계획서 목록
- 문서 에디터 페이지
- 버전 히스토리
- 리뷰 패널
- 체크리스트 사이드바

---

#### 4. 증빙 자료 관리 시스템 (`/documents`)
**필요성**: 가이드북 PART 6 - 심사 준비
- 법인 등기부등본
- 사업자등록증
- 팀원 이력서/증명서
- 기술 역량 증빙 자료
- 고객 검증 증빙 (인터뷰 녹음/기록)
- 시장 조사 자료

**필요 기능**:
- [ ] 증빙 자료 카테고리별 분류
  - 법인 관련
  - 팀원 관련
  - 기술 증빙
  - 고객 검증
  - 시장 조사
- [ ] 파일 업로드 및 관리
- [ ] 만료일 관리 및 알림
- [ ] 접근 권한 관리
- [ ] 빠른 검색 기능
- [ ] 증빙 자료 체크리스트
  - 가이드북 기준 필수 항목
  - 준비 상태 표시
- [ ] 다운로드 이력 추적

**데이터 구조**:
```typescript
interface Document {
  id: string;
  name: string;
  category: 'corporate' | 'team' | 'technical' | 'validation' | 'market';
  type: string; // '법인등기부등본', '사업자등록증', ...
  fileUrl: string;
  fileSize: number;
  expiryDate?: Date;
  required: boolean; // 필수 여부
  status: 'pending' | 'uploaded' | 'expired';
  uploadedBy: string;
  uploadedAt: Date;
  tags: string[];
}
```

**UI 구성**:
- 증빙 자료 목록 (카테고리별 필터)
- 업로드 페이지
- 만료일 알림
- 체크리스트 뷰
- 검색 기능

---

### 🟡 우선순위 2: 단기 필요 (2~3월)

#### 5. 발표 준비 시스템 (`/presentation`)
**필요성**: 가이드북 PART 6 - 심사 준비
- 7분 발표 스크립트 작성
- 예상 질문 30개 준비
- 모의 발표 일정 관리
- 피드백 기록

**필요 기능**:
- [ ] 발표 스크립트 에디터
  - 시간별 구간 분할 (7분)
  - 슬라이드별 스크립트
  - 타이머 기능
- [ ] Q&A 데이터베이스
  - 예상 질문 30개 관리
  - 답변 작성
  - 카테고리별 분류
  - 검색 기능
- [ ] 모의 발표 일정 관리
  - 일정 예약
  - 피드백 기록
  - 개선 사항 추적
- [ ] 발표 자료 관리
  - 피칭덱 업로드
  - 버전 관리
- [ ] 발표 연습 도구
  - 타이머
  - 녹음/녹화
  - 피드백 입력

**데이터 구조**:
```typescript
interface Presentation {
  id: string;
  title: string;
  duration: number; // 7분 = 420초
  script: {
    section: string;
    time: number; // 초 단위
    content: string;
  }[];
  slides: {
    slideNumber: number;
    title: string;
    content: string;
    fileUrl?: string;
  }[];
  qa: QnA[];
  mockPresentations: MockPresentation[];
  createdAt: Date;
  updatedAt: Date;
}

interface QnA {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

interface MockPresentation {
  id: string;
  date: Date;
  duration: number;
  feedback: {
    reviewer: string;
    comments: string;
    improvements: string[];
    score?: number;
  }[];
  recordingUrl?: string;
}
```

**UI 구성**:
- 발표 스크립트 에디터
- Q&A 데이터베이스
- 모의 발표 일정 캘린더
- 피드백 기록 페이지
- 타이머/녹음 도구

---

#### 6. 프리랜서 CRM 시스템 (`/freelancers`)
**필요성**: 가이드북 PART 2, PART 5
- 프리랜서 200명 Pre-launch 확보 (Phase 1)
- 프리랜서 400명 (최소) / 1,000명 (스트레치) (Phase 2)
- 프리랜서 온보딩 관리
- 품질 관리

**필요 기능**:
- [ ] 프리랜서 정보 관리
  - 기본 정보 (이름, 연락처, 지역)
  - 포트폴리오
  - 스타일 태그
  - 가격대
- [ ] 프리랜서 섭외 관리
  - 컨택 일정
  - 응답 상태
  - 등록 의향서 관리
- [ ] 프리랜서 온보딩 프로세스
  - 가입 심사
  - 프로필 완성도
  - 온보딩 단계 추적
- [ ] 프리랜서 품질 관리
  - 응답률
  - 거래 완료율
  - 평점 관리
- [ ] 프리랜서 통계 대시보드
  - 등록 현황
  - 활성률
  - 지역별 분포
  - 스타일별 분포

**데이터 구조**:
```typescript
interface Freelancer {
  id: string;
  name: string;
  contact: string;
  region: string;
  category: string[]; // '스냅', '영상', '메이크업', ...
  styleTags: string[];
  priceRange: {
    min: number;
    max: number;
  };
  portfolio: {
    images: string[];
    description: string;
  };
  status: 'contacted' | 'interested' | 'onboarding' | 'active' | 'inactive';
  onboardingStage: 'application' | 'review' | 'profile' | 'approved';
  quality: {
    responseRate: number;
    completionRate: number;
    rating: number;
    reviewCount: number;
  };
  contactedAt?: Date;
  registeredAt?: Date;
  createdBy: string;
  createdAt: Date;
}
```

**UI 구성**:
- 프리랜서 목록 (필터, 검색)
- 프리랜서 상세 페이지
- 섭외 관리 대시보드
- 온보딩 프로세스 뷰
- 통계 대시보드

---

#### 7. 시장 데이터 관리 시스템 (`/market-data`)
**필요성**: 가이드북 PART 2 - 솔루션 & 시장
- 통계청/KOSIS 데이터 수집
- 학술 논문/연구자료 수집
- 경쟁사 분석 데이터
- 시장 규모 데이터 (TAM/SAM/SOM)

**필요 기능**:
- [ ] 시장 데이터 수집 및 저장
  - 데이터 출처 관리
  - 데이터 업로드
  - 데이터 분류
- [ ] 데이터 출처 관리
  - 출처 정보 (기관, 연도, 링크)
  - 신뢰도 평가
- [ ] 데이터 시각화
  - 차트/그래프
  - 비교 분석
- [ ] 자동 업데이트 알림
  - 새로운 데이터 출처 알림
  - 데이터 만료 알림
- [ ] 사업계획서 연동
  - 데이터 인용 기능
  - 출처 자동 표기

**데이터 구조**:
```typescript
interface MarketData {
  id: string;
  title: string;
  category: 'market_size' | 'competitor' | 'trend' | 'statistics';
  source: {
    organization: string;
    year: number;
    url?: string;
    reliability: 'high' | 'medium' | 'low';
  };
  data: {
    type: 'number' | 'percentage' | 'text' | 'chart';
    value: any;
    unit?: string;
  };
  tags: string[];
  usedIn: string[]; // 사업계획서 섹션 ID
  uploadedAt: Date;
  uploadedBy: string;
}
```

**UI 구성**:
- 시장 데이터 목록
- 데이터 상세 페이지
- 데이터 시각화
- 출처 관리
- 검색 기능

---

### 🟢 우선순위 3: 중장기 필요 (4월 이후)

#### 8. AI 매칭 프로토타입 데이터 관리 (`/ai-matching`)
**필요성**: 가이드북 PART 2 - AI 스타일 매칭
- 스타일 태그 수집
- 포트폴리오 분석 데이터
- 매칭 알고리즘 검증 데이터

**필요 기능**:
- [ ] 스타일 태그 관리
  - 태그 분류 체계 (Taxonomy)
  - 태그 수집 현황
- [ ] 포트폴리오 분석 데이터
  - 이미지 분석 결과
  - 스타일 태그 자동 추출
- [ ] 매칭 알고리즘 검증
  - 매칭 성공률 추적
  - 피드백 수집
- [ ] AI 데이터 대시보드
  - 태그 통계
  - 매칭 성능 지표

---

## 📋 기능 통합 제안

### 네비게이션 메뉴 추가
```typescript
const menuItems = [
  { name: "대시보드", href: "/", Icon: DashboardIcon },
  { name: "일정룸", href: "/calendar", Icon: CalendarIcon },
  { name: "프로젝트룸", href: "/tasks", Icon: TaskIcon },
  { name: "프로젝트 자료", href: "/files", Icon: FileIcon },
  { name: "2026 예비창업패키지", href: "/yechangpack", Icon: StartupIcon },
  { name: "재무 관리", href: "/finance", Icon: FinanceIcon },
  
  // 새로 추가
  { name: "인터뷰 관리", href: "/interviews", Icon: InterviewIcon },
  { name: "설문조사", href: "/surveys", Icon: SurveyIcon },
  { name: "사업계획서", href: "/business-plan", Icon: DocumentIcon },
  { name: "증빙 자료", href: "/documents", Icon: FileIcon },
  { name: "발표 준비", href: "/presentation", Icon: PresentationIcon },
  { name: "프리랜서 CRM", href: "/freelancers", Icon: UsersIcon },
  { name: "시장 데이터", href: "/market-data", Icon: ChartIcon },
];
```

---

## 🎯 구현 우선순위

### Phase 1: 즉시 구현 (1월)
1. **인터뷰 관리 시스템** ⭐⭐⭐
   - 예비부부 35명 인터뷰 진행 필요
   - 인터뷰 결과 기록 필수
   - 사업계획서 작성에 직접 활용

2. **설문조사 관리 시스템** ⭐⭐⭐
   - 정량 설문조사 150명+ 진행 필요
   - PMF 측정 필수
   - 검증 데이터 확보

3. **증빙 자료 관리** ⭐⭐
   - 법인 등기 등 서류 준비 필요
   - 체계적 관리로 누락 방지

### Phase 2: 단기 구현 (2~3월)
4. **사업계획서 협업 도구** ⭐⭐⭐
   - 3월 신청 전 필수
   - 팀원 협업 필요

5. **발표 준비 시스템** ⭐⭐
   - 5월 발표평가 대비
   - 모의 발표 필요

6. **프리랜서 CRM** ⭐⭐
   - Phase 1 목표: 200명 확보
   - 섭외 및 관리 필요

### Phase 3: 중장기 구현 (4월 이후)
7. **시장 데이터 관리** ⭐
   - 사업계획서 작성 시 활용
   - 지속적 업데이트 필요

8. **AI 매칭 프로토타입 데이터** ⭐
   - MVP 개발 시 활용
   - 검증 데이터 수집

---

## 🔧 기술적 고려사항

### 데이터 저장
- **LocalStorage**: 현재 방식 유지 (클라이언트 사이드)
- **IndexedDB**: 대용량 파일 저장 (인터뷰 녹음, 포트폴리오 이미지)
- **Supabase**: 향후 백엔드 연동 시 활용

### 성능 최적화
- 페이지별 코드 스플리팅
- 대용량 데이터 페이징
- 이미지 최적화

### 보안
- 개인정보 익명화 (인터뷰 데이터)
- 접근 권한 관리
- 데이터 암호화 (민감 정보)

---

## 📊 예상 개발 시간

| 기능 | 예상 시간 | 우선순위 |
|------|----------|----------|
| 인터뷰 관리 시스템 | 3-4일 | 🔴 높음 |
| 설문조사 관리 시스템 | 4-5일 | 🔴 높음 |
| 증빙 자료 관리 | 2-3일 | 🔴 높음 |
| 사업계획서 협업 도구 | 5-6일 | 🟡 중간 |
| 발표 준비 시스템 | 3-4일 | 🟡 중간 |
| 프리랜서 CRM | 4-5일 | 🟡 중간 |
| 시장 데이터 관리 | 2-3일 | 🟢 낮음 |
| AI 매칭 데이터 관리 | 2-3일 | 🟢 낮음 |

**총 예상 시간**: 약 25-33일 (1개월~1.5개월)

---

## ✅ 다음 단계

1. **즉시 시작**: 인터뷰 관리 시스템 개발
2. **병행 개발**: 설문조사 관리 시스템
3. **단계적 확장**: 나머지 기능 순차적 구현

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-01-16

