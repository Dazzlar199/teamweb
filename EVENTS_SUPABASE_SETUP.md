# 일정 공유 기능 설정 가이드

## 📋 개요

일정 데이터를 Supabase를 통해 공유하도록 변경했습니다. 이제 팀원 모두가 같은 일정을 볼 수 있습니다.

## 🔧 Supabase 설정

### 1. Supabase SQL Editor에서 스키마 실행

1. Supabase 대시보드 → SQL Editor 열기
2. 다음 SQL 실행:

```sql
-- 일정 테이블 생성
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
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  created_timestamp TIMESTAMP DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 읽기/쓰기 가능
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
CREATE POLICY "Allow all operations on events" ON events
  FOR ALL USING (true) WITH CHECK (true);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_events_year_month ON events(year, month);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
```

또는 `lib/supabase/schema.sql` 파일의 events 관련 부분만 실행하세요.

### 2. 확인

SQL 실행 후:
- Table Editor에서 `events` 테이블이 생성되었는지 확인
- 테이블 구조가 올바른지 확인

## ✅ 완료

설정이 완료되면:
- 일정룸에서 일정 추가 시 모든 팀원에게 표시됩니다
- 일정 삭제도 모든 팀원에게 반영됩니다
- localStorage는 Supabase가 설정되지 않은 경우에만 사용됩니다

## 📝 참고

- 기존 localStorage의 일정 데이터는 자동으로 마이그레이션되지 않습니다
- 필요시 수동으로 Supabase에 데이터를 입력하거나, 일정을 다시 추가하세요
- Supabase가 설정되지 않은 경우 localStorage를 계속 사용합니다


