"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@/lib/context/UserContext";
import { handleError } from "@/lib/utils/errorHandler";
import {
  getDocuments,
  saveDocument,
  deleteDocument,
  getDocumentStats,
  getDocumentChecklist,
  getExpiredDocuments,
} from "@/lib/utils/document";
import { getFile } from "@/lib/utils/storage";
import type { Document, DocumentCategory } from "@/lib/types/document";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  corporate: "법인 관련",
  team: "팀원 관련",
  technical: "기술 증빙",
  validation: "고객 검증",
  market: "시장 조사",
  공고: "공고문",
  양식: "제출 양식",
  참고: "참고 자료",
  증빙: "실적 증빙",
  기타: "기타 자료",
};

export default function DocumentsPage() {
  const { user } = useUser();
  const currentUser = user?.name || "김찬주";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [filterCategory, setFilterCategory] = useState<
    DocumentCategory | "all"
  >("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [showChecklist, setShowChecklist] = useState(true);
  const [stats, setStats] = useState(getDocumentStats());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newDocument, setNewDocument] = useState({
    name: "",
    category: "corporate" as DocumentCategory,
    type: "",
    required: false,
    expiryDate: "",
    description: "",
  });

  const loadDocuments = () => {
    try {
      const loaded = getDocuments();
      setDocuments(loaded);
      setStats(getDocumentStats());
    } catch (e) {
      console.error("문서 로드 실패:", e);
    }
  };

  const checkExpired = () => {
    const expired = getExpiredDocuments();
    if (expired.length > 0) {
      // 만료된 문서가 있으면 알림 표시 (실제 구현 시 Toast 등 사용)
      console.warn("만료된 문서가 있습니다:", expired.map(d => d.name));
      // 상태 업데이트를 통해 UI에 표시 가능
      // 예: setShowExpiredAlert(true);
      
      // 만료 상태 업데이트 (필요시)
      const updatedDocs = getDocuments(); // 최신 상태 다시 가져옴
      setDocuments(updatedDocs);
    }
  };

  useEffect(() => {
    loadDocuments();
    checkExpired();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const document: Document = {
        id: `doc-${Date.now()}`,
        name: newDocument.name || file.name,
        category: newDocument.category,
        type: newDocument.type || file.name.split(".").pop() || "",
        fileUrl: "",
        fileSize: file.size,
        fileType: file.type || file.name.split(".").pop() || "",
        required: newDocument.required,
        expiryDate: newDocument.expiryDate
          ? new Date(newDocument.expiryDate).getTime()
          : undefined,
        status: "uploaded",
        uploadedBy: currentUser,
        uploadedAt: Date.now(),
        tags: [],
        description: newDocument.description,
      };

      await saveDocument(document, file);
      loadDocuments();
      setShowAddForm(false);
      setNewDocument({
        name: "",
        category: "corporate",
        type: "",
        required: false,
        expiryDate: "",
        description: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      handleError(error as Error, {
        component: "DocumentsPage",
        action: "증빙 자료 업로드",
      });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteDocument(id);
      loadDocuments();
      if (selectedDocument?.id === id) {
        setSelectedDocument(null);
      }
    } catch (error) {
      handleError(error as Error, {
        component: "DocumentsPage",
        action: "증빙 자료 삭제",
      });
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const file = await getFile(doc.fileUrl);
      if (file) {
        const url = URL.createObjectURL(file);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      handleError(error as Error, {
        component: "DocumentsPage",
        action: "파일 다운로드",
      });
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filterCategory !== "all" && doc.category !== filterCategory)
      return false;
    return true;
  });

  const checklist = getDocumentChecklist();
  const expiredCount = getExpiredDocuments().length;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#111827]">
            증빙 자료 관리
          </h1>
          <p className="text-xs text-[#6B7280]">
            예창패 신청에 필요한 증빙 자료를 체계적으로 관리합니다
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              전체 문서
            </div>
            <div className="text-2xl font-semibold text-[#111827]">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              필수 문서
            </div>
            <div className="text-2xl font-semibold text-[#111827]">
              {stats.required}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              만료 문서
            </div>
            <div className="text-2xl font-semibold text-[#DC2626]">
              {expiredCount}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              준비 완료
            </div>
            <div className="text-2xl font-semibold text-[#059669]">
              {
                checklist
                  .flatMap((c) => c.items)
                  .filter((i) => i.status === "uploaded" && i.required).length
              }{" "}
              /{" "}
              {
                checklist.flatMap((c) => c.items).filter((i) => i.required)
                  .length
              }
            </div>
          </div>
        </div>

        {/* 체크리스트 */}
        {showChecklist && (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111827]">
                증빙 자료 체크리스트
              </h2>
              <button
                onClick={() => setShowChecklist(false)}
                className="text-sm font-medium text-[#6B7280]"
              >
                접기
              </button>
            </div>
            <div className="space-y-4">
              {checklist.map((category) => (
                <div key={category.category}>
                  <h3 className="font-semibold text-[#111827]">
                    {CATEGORY_LABELS[category.category]}
                  </h3>
                  <div className="space-y-2">
                    {category.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-[#F9FAFB]"
                      >
                        <input
                          type="checkbox"
                          checked={item.status === "uploaded"}
                          disabled
                          className="w-4 h-4 text-[#111827]"
                        />
                        <span className="flex-1 text-sm font-medium text-[#111827]">
                          {item.type}
                          {item.required && (
                            <span className="text-[#DC2626]">*</span>
                          )}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded ${
                            item.status === "uploaded"
                              ? "bg-[#10B981] text-white"
                              : item.status === "expired"
                              ? "bg-[#DC2626] text-white"
                              : "bg-[#6B7280] text-white"
                          }`}
                        >
                          {item.status === "uploaded"
                            ? "업로드됨"
                            : item.status === "expired"
                            ? "만료됨"
                            : "대기중"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showChecklist && (
          <button
            onClick={() => setShowChecklist(true)}
            className="mb-4 text-sm font-semibold text-blue-600"
          >
            체크리스트 보기
          </button>
        )}

        {/* 필터 및 추가 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <select
            value={filterCategory}
            onChange={(e) =>
              setFilterCategory(e.target.value as DocumentCategory | "all")
            }
            className="px-3 py-2 bg-white border border-[#D1D5DB] rounded text-sm"
          >
            <option value="all">전체 카테고리</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            + 증빙 자료 추가
          </button>
        </div>

        {/* 문서 목록 */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
            <p className="text-sm text-[#6B7280]">
              증빙 자료가 없습니다. 증빙 자료를 추가해주세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredDocuments.map((document) => {
              const isExpired =
                document.expiryDate && document.expiryDate < Date.now();
              const expiryDate = document.expiryDate
                ? new Date(document.expiryDate)
                : null;

              return (
                <div
                  key={document.id}
                  onClick={() => setSelectedDocument(document)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer ${
                    isExpired ? "border-[#DC2626]" : "border-[#E5E7EB]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-[#111827]">
                        {document.name}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {CATEGORY_LABELS[document.category]} • {document.type}
                      </div>
                    </div>
                    {document.required && (
                      <span className="px-2 py-1 bg-[#DC2626]">필수</span>
                    )}
                  </div>
                  {expiryDate && (
                    <div
                      className={`text-xs mb-2 ${
                        isExpired ? "text-[#DC2626]" : "text-[#6B7280]"
                      }`}
                    >
                      만료일: {expiryDate.toLocaleDateString("ko-KR")}
                      {isExpired && " (만료됨)"}
                    </div>
                  )}
                  <div className="text-xs text-[#6B7280]">
                    {(document.fileSize / 1024).toFixed(1)} KB •{" "}
                    {new Date(document.uploadedAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 증빙 자료 추가 모달 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">
                증빙 자료 추가
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]">
                    파일 선택 *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-[#E2E8F0]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]">
                    문서명 *
                  </label>
                  <input
                    type="text"
                    value={newDocument.name}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E2E8F0]"
                    placeholder="문서명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]">
                    카테고리 *
                  </label>
                  <select
                    value={newDocument.category}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        category: e.target.value as DocumentCategory,
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E2E8F0]"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]">
                    문서 유형
                  </label>
                  <input
                    type="text"
                    value={newDocument.type}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#E2E8F0]"
                    placeholder="예: 법인등기부등본, 사업자등록증"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]">
                    만료일 (선택)
                  </label>
                  <input
                    type="date"
                    value={newDocument.expiryDate}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        expiryDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E2E8F0]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a]">
                    설명
                  </label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-[#E2E8F0]"
                    placeholder="설명을 입력하세요"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDocument.required}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        required: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-[#1a1a1a]">필수 문서</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[#F5F5F5]"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 문서 상세 모달 */}
        {selectedDocument && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#1a1a1a]">
                  {selectedDocument.name}
                </h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-[#6B7280] hover:text-[#1a1a1a] text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-[#6B7280]">카테고리: </span>
                  <span className="text-sm text-[#1a1a1a]">
                    {CATEGORY_LABELS[selectedDocument.category]}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-[#6B7280]">유형: </span>
                  <span className="text-sm text-[#1a1a1a]">
                    {selectedDocument.type}
                  </span>
                </div>
                {selectedDocument.expiryDate && (
                  <div>
                    <span className="text-sm text-[#6B7280]">만료일: </span>
                    <span className="text-sm text-[#1a1a1a]">
                      {new Date(selectedDocument.expiryDate).toLocaleDateString(
                        "ko-KR"
                      )}
                    </span>
                  </div>
                )}
                {selectedDocument.description && (
                  <div>
                    <span className="text-sm text-[#6B7280]">설명: </span>
                    <p className="text-sm text-[#1a1a1a]">
                      {selectedDocument.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => handleDownload(selectedDocument)}
                  className="px-4 py-2 bg-[#2563EB]"
                >
                  다운로드
                </button>
                <button
                  onClick={() => handleDeleteDocument(selectedDocument.id)}
                  className="px-4 py-2 bg-[#EF4444] text-white rounded text-sm font-medium hover:bg-[#DC2626] transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
