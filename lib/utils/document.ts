// 증빙 자료 관리 유틸리티 함수

import type { Document, DocumentCategory, DocumentStatus } from "@/lib/types/document";
import { saveFile, getFile, deleteFile } from "./storage";

const STORAGE_KEY = "documents";

export function getDocuments(): Document[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("증빙 자료 데이터 로드 실패:", error);
    return [];
  }
}

export async function saveDocument(document: Document, file?: File): Promise<void> {
  try {
    let fileUrl = document.fileUrl;
    
    // 파일이 있으면 저장
    if (file) {
      const fileMetadata = {
        id: document.id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedBy: document.uploadedBy,
        date: new Date().toISOString(),
        isImage: file.type.startsWith('image/'),
      };
      await saveFile(fileMetadata, file);
      fileUrl = document.id; // ID를 URL로 사용
    }
    
    const updatedDocument: Document = {
      ...document,
      fileUrl,
    };
    
    const documents = getDocuments();
    const existingIndex = documents.findIndex((d) => d.id === document.id);
    
    if (existingIndex >= 0) {
      documents[existingIndex] = updatedDocument;
    } else {
      documents.push(updatedDocument);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error("증빙 자료 저장 실패:", error);
    throw error;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const documents = getDocuments();
    const document = documents.find((d) => d.id === id);
    
    if (document) {
      // 파일도 삭제
      try {
        await deleteFile(document.fileUrl);
      } catch (error) {
        console.warn("파일 삭제 실패:", error);
      }
    }
    
    const filtered = documents.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("증빙 자료 삭제 실패:", error);
    throw error;
  }
}

export function getDocumentsByCategory(category: DocumentCategory): Document[] {
  return getDocuments().filter((d) => d.category === category);
}

export function getRequiredDocuments(): Document[] {
  return getDocuments().filter((d) => d.required);
}

export function getExpiredDocuments(): Document[] {
  const now = Date.now();
  return getDocuments().filter((d) => {
    if (!d.expiryDate) return false;
    return d.expiryDate < now && d.status !== "expired";
  });
}

export function getDocumentChecklist(): {
  category: DocumentCategory;
  items: { type: string; required: boolean; status: "pending" | "uploaded" | "expired"; documentId?: string }[];
}[] {
  const documents = getDocuments();
  
  // 가이드북 기준 필수 증빙 자료 체크리스트
  const checklist: {
    category: DocumentCategory;
    items: { type: string; required: boolean; status: "pending" | "uploaded" | "expired"; documentId?: string }[];
  }[] = [
    {
      category: "corporate",
      items: [
        { type: "법인등기부등본", required: true, status: "pending" },
        { type: "사업자등록증", required: true, status: "pending" },
      ],
    },
    {
      category: "team",
      items: [
        { type: "팀원 이력서", required: true, status: "pending" },
        { type: "팀원 증명서", required: false, status: "pending" },
      ],
    },
    {
      category: "technical",
      items: [
        { type: "기술 역량 증빙", required: true, status: "pending" },
        { type: "포트폴리오", required: false, status: "pending" },
      ],
    },
    {
      category: "validation",
      items: [
        { type: "고객 인터뷰 요약본", required: true, status: "pending" },
        { type: "프리랜서 등록 의향서", required: false, status: "pending" },
      ],
    },
    {
      category: "market",
      items: [
        { type: "시장 조사 자료", required: true, status: "pending" },
      ],
    },
  ];
  
  // 실제 문서와 매칭
  checklist.forEach((category) => {
    category.items.forEach((item) => {
      const doc = documents.find((d) => d.category === category.category && d.type === item.type);
      if (doc) {
        item.documentId = doc.id;
        if (doc.status === "expired") {
          item.status = "expired";
        } else {
          item.status = "uploaded";
        }
      }
    });
  });
  
  return checklist;
}

export function getDocumentStats() {
  const documents = getDocuments();
  const required = documents.filter((d) => d.required);
  const expired = getExpiredDocuments();
  
  const byCategory = {
    corporate: documents.filter((d) => d.category === "corporate").length,
    team: documents.filter((d) => d.category === "team").length,
    technical: documents.filter((d) => d.category === "technical").length,
    validation: documents.filter((d) => d.category === "validation").length,
    market: documents.filter((d) => d.category === "market").length,
  };
  
  return {
    total: documents.length,
    required: required.length,
    expired: expired.length,
    byCategory,
  };
}

