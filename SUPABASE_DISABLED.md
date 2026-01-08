# Supabase 일시적으로 비활성화됨

댓글 기능의 400 에러를 방지하기 위해 Supabase 동기화를 일시적으로 비활성화했습니다.

## 현재 상태

- ✅ **localStorage 사용**: 모든 댓글 기능이 localStorage에서 작동
- ❌ **Supabase 동기화 비활성화**: `isSupabaseConfigured()`가 항상 `false` 반환

## 해결 방법

브라우저에서 **하드 리프레시**를 해주세요:

- **Windows/Linux**: `Ctrl + Shift + R` 또는 `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

또는 개발 서버를 재시작:

```bash
# 개발 서버 중지 (Ctrl+C)
# 그리고 다시 시작
npm run dev
```

## 나중에 Supabase 활성화하려면

`lib/supabase/client.ts` 파일에서:

```typescript
export function isSupabaseConfigured(): boolean {
  // return false;  // 이 줄을 주석 처리
  return !!supabaseUrl && !!supabaseAnonKey;  // 이 줄의 주석 해제
}
```

## 참고

현재는 localStorage만 사용하므로:
- ✅ 댓글 추가/수정/삭제 모두 작동
- ✅ 브라우저별로 데이터가 저장됨
- ⚠️ 다른 브라우저/기기와 동기화 안 됨

