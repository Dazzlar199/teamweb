export interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TaskNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  attachments?: TaskAttachment[];
}

export interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
  category: "아카데미" | "예창패" | "공통";
  description?: string;
  details?: {
    목표?: string;
    방법?: string;
    기간?: string;
    담당자?: string;
    참고자료?: string[];
    체크리스트?: string[];
  };
  notes?: TaskNote[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  period: string;
  status: "completed" | "in_progress" | "upcoming";
  tasks: RoadmapTask[];
  description: string;
}

export interface YechangpackDocument {
  id: string;
  name: string;
  type: "pdf" | "docx" | "hwp" | "md";
  size: string;
  path: string;
  category: "공고" | "양식" | "가이드" | "참고";
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: "일정" | "체크리스트" | "메모" | "아이디어";
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  category: string;
  phase: string;
}
