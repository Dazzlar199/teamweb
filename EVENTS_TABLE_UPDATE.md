# Events 테이블 업데이트 가이드

## 문제
Supabase의 `events` 테이블에 `completed`, `description`, `participants` 컬럼이 없어서 일정 저장이 실패하고 있습니다.

## 해결 방법

### 1. Supabase SQL Editor 열기
1. Supabase 대시보드 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭

### 2. 다음 SQL 실행

```sql
-- events 테이블에 completed 컬럼 추가
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

-- events 테이블에 description 컬럼 추가
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

-- events 테이블에 participants 컬럼 추가
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
```

### 3. 실행 확인
- SQL Editor에서 **Run** 버튼 클릭
- "Success. No rows returned" 메시지 확인
- 또는 각 컬럼 추가 완료 메시지 확인

### 4. 테이블 구조 확인
다음 SQL로 테이블 구조를 확인할 수 있습니다:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

## 참고
- `schema.sql` 파일에도 이 업데이트가 포함되어 있습니다.
- 다음에 전체 스키마를 다시 실행하면 자동으로 컬럼이 추가됩니다.

