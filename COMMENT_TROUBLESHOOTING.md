# 댓글 추가 문제 해결 가이드

## 🔍 문제 진단

댓글이 등록되지 않는 경우 다음을 확인하세요:

### 1. 브라우저 콘솔 확인
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭 확인
3. 다음과 같은 로그가 보이는지 확인:
   - `[handleAddComment] 댓글 추가 시작:`
   - `[addComment] Supabase에 댓글 추가 시도:`
   - `[addComment] 댓글 추가 성공:`
   - `[handleAddComment] 업데이트된 게시글:`

### 2. Supabase 테이블 확인
1. Supabase 대시보드 → Table Editor
2. `comments` 테이블 확인
3. 댓글이 실제로 저장되었는지 확인

### 3. RLS 정책 확인
Supabase SQL Editor에서 다음 SQL 실행:

```sql
-- Comments 테이블 RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'comments';

-- Comments 정책 다시 설정 (모든 사용자가 읽기/쓰기 가능)
DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;
CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);
```

### 4. 외래 키 제약 조건 확인
```sql
-- posts 테이블에 해당 게시글이 존재하는지 확인
SELECT id FROM posts WHERE id = '게시글ID';

-- comments 테이블의 외래 키 제약 조건 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='comments';
```

## 🛠️ 해결 방법

### 방법 1: RLS 정책 재설정
```sql
-- Comments 테이블 RLS 비활성화 (테스트용)
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 또는 정책 수정
DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;
CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);
```

### 방법 2: Supabase 환경 변수 확인
`.env.local` 파일 확인:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 방법 3: 네트워크 탭 확인
1. 브라우저 개발자 도구 → Network 탭
2. 댓글 작성 시도
3. `comments` 관련 요청 확인
4. 요청 상태 코드 확인 (200 OK인지, 400/403/500 에러인지)

## 📝 디버깅 정보

콘솔에 다음 정보가 출력됩니다:
- 댓글 객체 내용
- Supabase insert 시도
- 성공/실패 여부
- 업데이트된 게시글 데이터

이 정보를 통해 어느 단계에서 문제가 발생하는지 확인할 수 있습니다.

