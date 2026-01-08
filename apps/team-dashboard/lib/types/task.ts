// 작업 관련 타입 정의
export interface Attachment {
  id: string;
  name: string;
  type: string; // 'image', 'file', 'html', etc.
  size: number;
  url?: string; // 파일 URL 또는 데이터 URL
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  date: string;
  isFeedbackRequest: boolean;
  attachments?: Attachment[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assignedTo: string;
  dueDate: string;
  comments: Comment[];
  tags?: string[];
  isBookmarked?: boolean;
  progress?: number; // 0-100
  createdBy?: string; // 작성자
  createdAt?: string; // 생성일 (ISO string)
  updatedAt?: string; // 수정일 (ISO string)
  attachments?: Attachment[];
}

