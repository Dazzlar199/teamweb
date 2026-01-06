// 설문조사 관련 타입 정의

export type QuestionType = 'single' | 'multiple' | 'text' | 'scale';
export type SurveyStatus = 'draft' | 'active' | 'closed';
export type SurveyTargetType = 'couple' | 'freelancer' | 'all'; // 설문 대상 타입

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // 단일선택, 다중선택, 척도용
  required: boolean;
  order: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  responses: {
    questionId: string;
    answer: string | string[] | number;
  }[];
  submittedAt: number; // timestamp
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  targetType: SurveyTargetType; // 예비부부/프리랜서 구분
  questions: Question[];
  targetCount: number; // 목표 응답 수
  responseCount: number;
  status: SurveyStatus;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  createdBy: string;
}

