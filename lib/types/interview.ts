// 인터뷰 관련 타입 정의

export type InterviewType = 'couple' | 'freelancer';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Interviewee {
  name: string;
  age?: number;
  region?: string;
  contact?: string;
  anonymous?: boolean; // 익명화 여부
}

export interface InterviewResponse {
  question: string;
  answer: string;
  painPoint?: boolean; // 페인포인트 여부
  quote?: boolean; // 인용 가능 여부
}

export interface Interview {
  id: string;
  type: InterviewType;
  interviewee: Interviewee;
  scheduledDate: number; // timestamp
  completedDate?: number; // timestamp
  status: InterviewStatus;
  script: string; // 가이드북 스크립트
  responses: InterviewResponse[];
  painPoints: string[]; // 추출된 페인포인트
  quotes: string[]; // 인용구
  recordingUrl?: string; // 녹음 파일 URL
  summary?: string; // 요약본
  notes?: string; // 추가 메모
  createdBy: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

