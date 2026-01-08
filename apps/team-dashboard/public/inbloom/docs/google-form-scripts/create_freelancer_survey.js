/**
 * 프리랜서용 설문조사 구글폼 자동 생성 스크립트
 *
 * 사용법:
 * 1. Google Drive에서 "새로 만들기" > "더보기" > "Google Apps Script" 클릭
 * 2. 이 코드 전체를 복사해서 붙여넣기
 * 3. 상단 "실행" 버튼 클릭
 * 4. 권한 승인 후 자동으로 폼 생성됨
 * 5. Google Drive에서 생성된 폼 확인
 */

function createFreelancerSurvey() {
  // 폼 생성
  var form = FormApp.create('웨딩 프리랜서 활동 경험 설문조사');
  form.setDescription('웨딩 분야에서 활동하시는 프리랜서분들의 경험을 듣고 싶습니다.\n응답해주신 분들 중 추첨을 통해 스타벅스 기프티콘(1만원)을 드립니다.\n소요시간: 약 3분');

  // ===== Section 1: 기본정보 =====
  form.addSectionHeaderItem().setTitle('Section 1. 기본정보');

  form.addCheckboxItem()
    .setTitle('Q1. 어떤 분야에서 활동하시나요? (복수선택)')
    .setChoiceValues(['스냅 촬영', '영상 촬영', '축가/연주', '사회/MC', '헤어메이크업', '부케/꽃장식', '청첩장/답례품', '기타'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q2. 활동 기간은 얼마나 되셨나요?')
    .setChoiceValues(['1년 미만', '1~3년', '3~5년', '5년 이상'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q3. 월 평균 웨딩 작업 건수는?')
    .setChoiceValues(['2건 미만', '2~5건', '5~10건', '10건 이상'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q4. 월 평균 매출은?')
    .setChoiceValues(['100만원 미만', '100~300만원', '300~500만원', '500만원 이상'])
    .setRequired(true);

  // ===== Section 2: 문제 인식 =====
  form.addSectionHeaderItem().setTitle('Section 2. 문제 인식');

  form.addCheckboxItem()
    .setTitle('Q5. 고객을 주로 어떻게 확보하시나요? (복수선택)')
    .setChoiceValues(['인스타그램', '블로그', '지인 추천', '숨고', '크몽', '웨딩박람회', '기타'])
    .setRequired(true);

  form.addScaleItem()
    .setTitle('Q6. "고객 확보가 어렵다"에 동의하시나요?')
    .setBounds(1, 5)
    .setLabels('전혀 아니다', '매우 그렇다')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q7. 기존 플랫폼(숨고/크몽) 이용 경험이 있다면, 만족도는?')
    .setChoiceValues(['매우 만족', '만족', '보통', '불만족', '매우 불만족', '사용해본 적 없음'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q8. 기존 플랫폼의 가장 큰 문제는? (1순위)')
    .setChoiceValues(['수수료가 너무 높음', '리드(고객문의) 품질이 낮음', '가격 경쟁이 심함', '차별화가 어려움', '문제없음'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q9. 진상 고객이나 노쇼로 피해본 경험이 있나요?')
    .setChoiceValues(['자주 있다', '가끔 있다', '드물게 있다', '없다'])
    .setRequired(true);

  // ===== Section 3: 솔루션 반응 =====
  form.addSectionHeaderItem().setTitle('Section 3. 솔루션 반응');

  form.addMultipleChoiceItem()
    .setTitle('Q10. 웨딩 전문 매칭 플랫폼에 입점 의향이 있나요?')
    .setChoiceValues(['꼭 입점하겠다', '고려해보겠다', '모르겠다', '관심 없다', '절대 안함'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q11. 플랫폼에서 가장 원하는 기능은? (1순위)')
    .setChoiceValues(['AI 스타일 매칭', '포트폴리오 관리', '결제 대행 (에스크로)', '일정/예약 관리', '리뷰 관리'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q12. 매칭 성사 시 수수료 몇 %까지 수용 가능하신가요?')
    .setChoiceValues(['5% 이하', '10% 이하', '15% 이하', '20% 이하', '20% 이상도 가능'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q13. 월 구독료라면 얼마까지 괜찮으세요?')
    .setChoiceValues(['무료만', '3만원', '5만원', '10만원', '10만원 이상'])
    .setRequired(true);

  // ===== Section 4: 크루 시스템 =====
  form.addSectionHeaderItem()
    .setTitle('Section 4. 크루 시스템')
    .setHelpText('크루 설명: 다른 분야 프리랜서 3~5명이 한 팀(크루)을 이루어 통합 웨딩 패키지를 제공합니다.\n예) 스냅작가 + 영상감독 + 축가가수 = "빈티지 로맨스 크루"');

  form.addMultipleChoiceItem()
    .setTitle('Q14. 다른 분야 프리랜서와 팀(크루)을 구성해 함께 활동할 의향이 있나요?')
    .setChoiceValues(['매우 있다', '있다', '모르겠다', '없다', '전혀 없다'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q15. 크루 활동 시 가장 기대되는 점은? (1순위)')
    .setChoiceValues(['대형 건 수주 가능', '안정적인 협업', '포트폴리오 확대', '네트워킹', '관심 없음'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q16. 크루 활동 시 가장 우려되는 점은? (1순위)')
    .setChoiceValues(['수익 분배 문제', '일정 조율 어려움', '스타일 충돌', '책임 소재 불명확', '우려 없음'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q17. 크루 멤버를 모집할 때 가장 중요한 기준은?')
    .setChoiceValues(['실력/포트폴리오', '성향/소통 능력', '가격대', '활동 지역', '기존 협업 경험'])
    .setRequired(true);

  // ===== Section 5: 커뮤니티 & 채널 =====
  form.addSectionHeaderItem()
    .setTitle('Section 5. 커뮤니티 & 채널')
    .setHelpText('프리랜서 채널: 플랫폼 내에서 자신만의 채널을 운영하며, 포트폴리오 공개, 팬/구독자 확보, 콘텐츠 발행이 가능합니다.');

  form.addMultipleChoiceItem()
    .setTitle('Q18. 플랫폼 내 전용 채널(포트폴리오+콘텐츠)을 운영할 의향이 있나요?')
    .setChoiceValues(['꼭 운영하겠다', '고려해보겠다', '모르겠다', '관심 없다'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('Q19. 채널에서 어떤 콘텐츠를 발행하고 싶나요? (복수선택)')
    .setChoiceValues(['포트폴리오', '작업 후기', '팁/노하우', '비하인드 스토리', '가격 안내'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q20. 고객이 남긴 "실거래 검증 리뷰"가 쌓이는 시스템이 있다면?')
    .setChoiceValues(['매우 도움될 것 같다', '도움될 것 같다', '보통', '별로', '필요 없다'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Q21. 예비부부들의 익명 Q&A에 전문가로서 답변할 의향이 있나요?')
    .setChoiceValues(['적극 참여하겠다', '가끔 참여하겠다', '모르겠다', '안할 것 같다'])
    .setRequired(true);

  // ===== 마무리 =====
  form.addSectionHeaderItem().setTitle('마무리');

  form.addParagraphTextItem()
    .setTitle('Q22. 추가로 원하시는 기능이나 의견이 있으시면 자유롭게 적어주세요.')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Q23. 추첨 경품 수령을 위한 연락처 (이메일 또는 전화번호)')
    .setRequired(false);

  // 완료 메시지
  form.setConfirmationMessage('설문에 응해주셔서 감사합니다!\n추첨을 통해 스타벅스 기프티콘을 보내드리겠습니다.');

  Logger.log('폼 생성 완료: ' + form.getEditUrl());
  Logger.log('응답 URL: ' + form.getPublishedUrl());
}
