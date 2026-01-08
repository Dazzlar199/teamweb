# 구글폼 자동 생성 스크립트

## 사용법 (1분 소요)

### 1. Google Apps Script 열기
- [Google Drive](https://drive.google.com) 접속
- 좌측 상단 **"새로 만들기"** > **"더보기"** > **"Google Apps Script"** 클릭

### 2. 코드 붙여넣기
- 기본 코드 전체 삭제
- 아래 파일 중 하나를 열어서 전체 복사 (Ctrl+A, Ctrl+C)
  - `create_couple_survey.js` - 예비부부용
  - `create_freelancer_survey.js` - 프리랜서용
- Apps Script에 붙여넣기 (Ctrl+V)

### 3. 실행
- 상단 **"실행"** 버튼 클릭 (또는 Ctrl+Enter)
- 처음 실행 시 **권한 승인** 팝업이 뜸
  - "권한 검토" 클릭
  - 구글 계정 선택
  - "고급" > "안전하지 않은 페이지로 이동" 클릭
  - "허용" 클릭

### 4. 완료
- 하단 **실행 로그**에서 폼 URL 확인
- **Google Drive 홈**에서 생성된 폼 확인

---

## 파일 설명

| 파일명 | 설명 | 문항 수 |
|--------|------|---------|
| `create_couple_survey.js` | 예비부부용 설문 | 20문항 |
| `create_freelancer_survey.js` | 프리랜서용 설문 | 23문항 |

---

## 문제 해결

### "권한이 필요합니다" 오류
- 실행 > 권한 검토 > 허용

### 폼이 안 보임
- Google Drive 홈에서 "최근 문서" 확인
- 또는 실행 로그에서 URL 직접 클릭

### 수정이 필요한 경우
- 생성된 폼을 직접 열어서 수정하면 됨
- 또는 스크립트 코드 수정 후 다시 실행 (새 폼 생성됨)
