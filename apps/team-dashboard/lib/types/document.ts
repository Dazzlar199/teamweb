// 증빙 자료 관련 타입 정의

export type DocumentCategory = 'corporate' | 'team' | 'technical' | 'validation' | 'market';
export type DocumentStatus = 'pending' | 'uploaded' | 'expired';

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  type: string; // '법인등기부등본', '사업자등록증', '이력서', ...
  fileUrl: string;
  fileSize: number;
  fileType: string; // 'pdf', 'docx', 'jpg', ...
  expiryDate?: number; // timestamp
  required: boolean; // 필수 여부
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: number; // timestamp
  tags: string[];
  description?: string;
}

export interface DocumentChecklist {
  category: DocumentCategory;
  items: {
    type: string;
    required: boolean;
    status: 'pending' | 'uploaded' | 'expired';
    documentId?: string;
  }[];
}

