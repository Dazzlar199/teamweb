-- =====================================================
-- Supabase 데이터베이스 스키마
-- =====================================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 게시글 테이블 (소통공간)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('질문', '일반', '공지', '아이디어')),
  author TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  views INTEGER DEFAULT 0,
  likes TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT FALSE,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 2. 댓글 테이블 (소통공간)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  likes TEXT[] DEFAULT '{}',
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 3. 문서 테이블 (증빙자료)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT,
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  required BOOLEAN DEFAULT FALSE,
  expiry_date BIGINT,
  status TEXT DEFAULT 'pending',
  uploaded_by TEXT NOT NULL,
  uploaded_at BIGINT NOT NULL,
  description TEXT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 4. 인터뷰 테이블 (고객 검증)
CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('couple', 'freelancer')),
  interviewee JSONB NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  script TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  completed_date BIGINT,
  responses JSONB DEFAULT '[]',
  pain_points TEXT[] DEFAULT '{}',
  quotes TEXT[] DEFAULT '{}',
  summary TEXT,
  created_at BIGINT NOT NULL,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 5. 설문조사 테이블 (고객 검증)
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('couple', 'freelancer', 'all')),
  target_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  questions JSONB NOT NULL DEFAULT '[]',
  created_at BIGINT NOT NULL,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 6. 설문 응답 테이블 (고객 검증)
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_name TEXT,
  responses JSONB NOT NULL DEFAULT '[]',
  created_at BIGINT NOT NULL,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 7. 일정 테이블 (일정룸)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date INTEGER NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  created_by TEXT NOT NULL,
  location TEXT,
  repeat_type TEXT CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly')),
  repeat_end_date TEXT,
  year INTEGER,
  month INTEGER,
  participants TEXT[] DEFAULT '{}',
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 8. 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  timestamp BIGINT NOT NULL,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 9. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at BIGINT NOT NULL,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 10. 메시지 테이블 (1:1 DM)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TEXT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 11. 2026 예비창업패키지 로드맵
CREATE TABLE IF NOT EXISTS yechangpack_roadmap (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  phase_data JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 11. 2026 예비창업패키지 체크리스트
CREATE TABLE IF NOT EXISTS yechangpack_checklist (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  checklist_data JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 12. 2026 예비창업패키지 노트
CREATE TABLE IF NOT EXISTS yechangpack_notes (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  notes_data JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- 13. 2026 예비창업패키지 증빙자료
CREATE TABLE IF NOT EXISTS yechangpack_evidence (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  evidence_data JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성 (성능 향상)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(pinned);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Events 인덱스
CREATE INDEX IF NOT EXISTS idx_events_year_month ON events(year, month);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_type ON interviews(type);

CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_target_type ON surveys(target_type);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_name ON activity_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_name ON notifications(user_name);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- Row Level Security (RLS) 정책 설정
-- =====================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE yechangpack_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE yechangpack_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE yechangpack_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE yechangpack_evidence ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 읽기/쓰기 가능 (팀 내부 도구이므로)
-- 필요시 나중에 인증 기반으로 제한 가능

-- Posts 정책
DROP POLICY IF EXISTS "Allow all operations on posts" ON posts;
CREATE POLICY "Allow all operations on posts" ON posts
  FOR ALL USING (true) WITH CHECK (true);

-- Comments 정책
DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;
CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- Events 정책
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
CREATE POLICY "Allow all operations on events" ON events
  FOR ALL USING (true) WITH CHECK (true);

-- Documents 정책
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;
CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);

-- Interviews 정책
DROP POLICY IF EXISTS "Allow all operations on interviews" ON interviews;
CREATE POLICY "Allow all operations on interviews" ON interviews
  FOR ALL USING (true) WITH CHECK (true);

-- Surveys 정책
DROP POLICY IF EXISTS "Allow all operations on surveys" ON surveys;
CREATE POLICY "Allow all operations on surveys" ON surveys
  FOR ALL USING (true) WITH CHECK (true);

-- Survey Responses 정책
DROP POLICY IF EXISTS "Allow all operations on survey_responses" ON survey_responses;
CREATE POLICY "Allow all operations on survey_responses" ON survey_responses
  FOR ALL USING (true) WITH CHECK (true);

-- Activity Logs 정책
DROP POLICY IF EXISTS "Allow all operations on activity_logs" ON activity_logs;
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Notifications 정책
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
CREATE POLICY "Allow all operations on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Messages 정책
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

-- Yechangpack 정책들
DROP POLICY IF EXISTS "Allow all operations on yechangpack_roadmap" ON yechangpack_roadmap;
CREATE POLICY "Allow all operations on yechangpack_roadmap" ON yechangpack_roadmap
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on yechangpack_checklist" ON yechangpack_checklist;
CREATE POLICY "Allow all operations on yechangpack_checklist" ON yechangpack_checklist
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on yechangpack_notes" ON yechangpack_notes;
CREATE POLICY "Allow all operations on yechangpack_notes" ON yechangpack_notes
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on yechangpack_evidence" ON yechangpack_evidence;
CREATE POLICY "Allow all operations on yechangpack_evidence" ON yechangpack_evidence
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 기존 테이블 업데이트 (컬럼 추가)
-- =====================================================

-- events 테이블에 completed 컬럼 추가 (없는 경우에만)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'completed'
  ) THEN
    ALTER TABLE events ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'events 테이블에 completed 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'events 테이블에 completed 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- events 테이블에 description 컬럼 추가 (없는 경우에만)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'description'
  ) THEN
    ALTER TABLE events ADD COLUMN description TEXT;
    RAISE NOTICE 'events 테이블에 description 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'events 테이블에 description 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- events 테이블에 participants 컬럼 추가 (없는 경우에만)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'participants'
  ) THEN
    ALTER TABLE events ADD COLUMN participants TEXT[] DEFAULT '{}';
    RAISE NOTICE 'events 테이블에 participants 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'events 테이블에 participants 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================
-- 모든 테이블과 정책이 성공적으로 생성되었습니다!
-- 이제 앱에서 Supabase를 사용할 수 있습니다.

