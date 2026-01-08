/**
 * 예비부부용 설문조사 구글폼 자동 생성 스크립트
 *
 * 사용법:
 * 1. Google Drive에서 "새로 만들기" > "더보기" > "Google Apps Script" 클릭
 * 2. 이 코드 전체를 복사해서 붙여넣기
 * 3. 상단 "실행" 버튼 클릭
 * 4. 권한 승인 후 자동으로 폼 생성됨
 * 5. Google Drive에서 생성된 폼 확인
 */

function createCoupleSurvey() {
  // 폼 생성
  var form = FormApp.create('결혼 준비 경험 설문조사');
  form.setDescription('결혼 준비 중이시거나 최근 결혼하신 분들의 경험을 듣고 싶습니다.\n응답해주신 분들 중 추첨을 통해 스타벅스 기프티콘(5천원)을 드립니다.\n소요시간: 약 3분');

  // ===== Section 1: 기본정보 =====
  form.addSectionHeaderItem().setTitle('Section 1. 기본정보');

  form.addMultipleChoiceItem()
    .setTitle('Q1. 결혼 예정 시기는 언제인가요?')
    .setChoiceValues(['3개월 이내', '6개월 이내', '1년 이내', '1년 이상', '이미 결혼함 (1년 이내)'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q2. 총 웨딩 예산은 얼마인가요?')
    .setChoiceValues(['3천만원 미만', '3천~5천만원', '5천~7천만원', '7천만원~1억원', '1억원 이상'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q3. 서브서비스(스냅/영상/축가 등) 예산은 얼마인가요?')
    .setChoiceValues(['100만원 미만', '100~300만원', '300~500만원', '500만원 이상'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Q4. 현재 알아보고 있거나 이용한 서브서비스는? (복수선택)')
    .setChoiceValues(['본식 스냅', '본식 영상', '축가', '사회자', '부케/꽃장식', '청첩장', '포토부스/이벤트', '추가 헤어메이크업', '기타'])
    .setRequired(true);

  // ===== Section 2: 문제 인식 =====
  form.addSectionHeaderItem().setTitle('Section 2. 문제 인식');

  form.addCheckboxItem()
    .setTitle('Q5. 서브서비스 업체를 주로 어떻게 찾으시나요? (복수선택)')
    .setChoiceValues(['블로그 검색', '인스타그램', '유튜브', '지인 추천', '웨딩앱 (웨딩북 등)', '숨고/크몽', '기타'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q6. 업체 찾을 때 가장 어려운 점은? (1순위)')
    .setChoiceValues(['가격이 불투명함', '후기/리뷰를 믿기 어려움', '선택지가 너무 많음', '업체와 소통이 어려움', '스타일에 맞는 업체 찾기', '기타'])
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Q7. "서브서비스 업체 찾기가 어렵다"에 동의하시나요?')
    .setBounds(1, 5)
    .setLabels('전혀 아니다', '매우 그렇다')
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Q8. 블로그/인스타 후기를 신뢰하시나요?')
    .setBounds(1, 5)
    .setLabels('전혀 신뢰 안함', '매우 신뢰함')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q9. 업체 선택 후 후회한 경험이 있나요?')
    .setChoiceValues(['있다', '없다'])
    .setRequired(true);

  // ===== Section 3: 솔루션 반응 =====
  form.addSectionHeaderItem().setTitle('Section 3. 솔루션 반응');

  form.addMultipleChoiceItem()
    .setTitle('Q10. AI가 스타일/예산에 맞는 업체를 추천해주는 서비스가 있다면?')
    .setChoiceValues(['꼭 사용하겠다', '사용해보겠다', '모르겠다', '사용 안할 것 같다', '절대 사용 안함'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q11. 가장 원하는 기능은? (1순위)')
    .setChoiceValues(['AI 스타일 매칭', '가격 비교', '실시간 채팅 상담', '검증된 실거래 리뷰', '예약/일정 관리'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q12. 이런 서비스에 비용을 낼 의향이 있나요?')
    .setChoiceValues(['있다', '무료만 사용', '모르겠다'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q12-1. (비용 의향 있는 경우) 얼마까지 지불할 수 있나요?')
    .setChoiceValues(['1만원', '3만원', '5만원', '10만원', '10만원 이상'])
    .setRequired(false);

  // ===== Section 4: 크루 시스템 =====
  form.addSectionHeaderItem()
    .setTitle('Section 4. 크루 시스템')
    .setHelpText('크루 설명: 스냅작가, 영상감독, 축가가수 등 3~5명이 한 팀(크루)으로 통합 패키지를 제공합니다. 개별 섭외 대비 10~15% 저렴하고 컨셉이 일관됩니다.');

  form.addMultipleChoiceItem()
    .setTitle('Q13. 현재 서브서비스 섭외 방식에서 가장 불편한 점은?')
    .setChoiceValues(['각각 따로 연락해야 함', '업체 간 스타일이 안 맞음', '일정 조율이 어려움', '각각 비용 협상이 번거로움', '불편한 점 없음'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q14. 한 팀(크루)이 스냅+영상+축가를 통합 패키지로 제공한다면?')
    .setChoiceValues(['꼭 이용하겠다', '고려해보겠다', '모르겠다', '관심 없다', '절대 이용 안함'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q15. 크루 패키지 선택 시 가장 중요한 요소는? (1순위)')
    .setChoiceValues(['가격', '컨셉 통일성', '리뷰/평점', '포트폴리오', '소통 편의성'])
    .setRequired(true);

  // ===== Section 5: 커뮤니티 =====
  form.addSectionHeaderItem().setTitle('Section 5. 커뮤니티');

  form.addCheckboxItem()
    .setTitle('Q16. 웨딩 준비 정보를 주로 어디서 얻으시나요? (복수선택)')
    .setChoiceValues(['블로그', '인스타그램', '유튜브', '네이버 카페', '지인', '웨딩앱'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q17. 익명으로 웨딩 고민을 질문/상담할 수 있는 커뮤니티가 있다면?')
    .setChoiceValues(['꼭 이용하겠다', '가끔 이용하겠다', '모르겠다', '관심 없다'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q18. "실제 거래한 사람만 리뷰를 남길 수 있는" 검증 시스템이 있다면?')
    .setChoiceValues(['매우 신뢰할 것 같다', '신뢰할 것 같다', '보통', '별로 신뢰 안할 것 같다', '상관없다'])
    .setRequired(true);

  // ===== 마무리 =====
  form.addSectionHeaderItem().setTitle('마무리');

  form.addParagraphTextItem()
    .setTitle('Q19. 추가로 원하시는 기능이나 의견이 있으시면 자유롭게 적어주세요.')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Q20. 추첨 경품 수령을 위한 연락처 (이메일 또는 전화번호)')
    .setRequired(false);

  // 완료 메시지
  form.setConfirmationMessage('설문에 응해주셔서 감사합니다!\n추첨을 통해 스타벅스 기프티콘을 보내드리겠습니다.');

  Logger.log('폼 생성 완료: ' + form.getEditUrl());
  Logger.log('응답 URL: ' + form.getPublishedUrl());
}
