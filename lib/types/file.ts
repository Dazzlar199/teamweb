// 파일 관련 타입 정의
export type FileCategory =
  | "이미지"
  | "음악"
  | "비디오"
  | "일러스트"
  | "문서"
  | "스프레드시트"
  | "기타";

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  date: string;
  isImage: boolean;
  category: FileCategory;
  url?: string;
  isBookmarked?: boolean;
}

