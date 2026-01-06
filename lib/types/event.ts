// 일정 관련 타입 정의
export interface Event {
  id: string;
  title: string;
  date: number;
  time: string;
  type: string;
  createdBy: string;
  location?: string;
  repeat?: "none" | "daily" | "weekly" | "monthly";
  repeatEndDate?: string;
  isBookmarked?: boolean;
  year?: number; // 년도 (선택적, 없으면 현재 년도로 간주)
  month?: number; // 월 (선택적, 없으면 현재 월로 간주, 0-11)
}

export interface Holiday {
  id: string;
  title: string;
  date: number;
  month: number;
  year?: number;
  createdBy: "시스템";
}

