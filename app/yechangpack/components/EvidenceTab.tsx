import React, { useState } from "react";
import type {
  Document as EvidenceDocument,
  DocumentCategory,
} from "@/lib/types/document";
import { getDocumentStats, getDocumentChecklist } from "@/lib/utils/document";

interface EvidenceTabProps {
  evidenceDocuments: EvidenceDocument[];
  onDelete: (id: string) => void;
  onSave: (
    data: {
      name: string;
      category: DocumentCategory;
      type: string;
      required: boolean;
      description: string;
    },
    file: File | null
  ) => void;
  selectedCategory: DocumentCategory | "all";
  onCategoryChange: (category: DocumentCategory | "all") => void;
}

export default function EvidenceTab({
  evidenceDocuments,
  onDelete,
  onSave,
  selectedCategory,
  onCategoryChange,
}: EvidenceTabProps) {
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [newEvidence, setNewEvidence] = useState({
    name: "",
    category: "corporate" as DocumentCategory,
    type: "",
    required: false,
    description: "",
  });

  const handleAddEvidence = () => {
    if (!newEvidence.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    onSave(newEvidence, evidenceFile);
    setNewEvidence({
      name: "",
      category: "corporate",
      type: "",
      required: false,
      description: "",
    });
    setEvidenceFile(null);
    setShowAddEvidence(false);
  };

  return (
    <div className="space-y-6">
      {/* 증빙자료 관리 */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              증빙자료 관리
            </h2>
            <p className="text-sm text-[#6B7280]">
              예창패 지원에 필요한 증빙자료를 업로드하고 관리하세요
            </p>
          </div>
          <button
            onClick={() => setShowAddEvidence(true)}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
          >
            + 증빙자료 추가
          </button>
        </div>

        {/* 통계 */}
        {(() => {
          const stats = getDocumentStats();
          const checklist = getDocumentChecklist();
          const requiredCount = checklist.reduce(
            (sum, cat) => sum + cat.items.filter((i) => i.required).length,
            0
          );
          const uploadedCount = checklist.reduce(
            (sum, cat) =>
              sum + cat.items.filter((i) => i.status === "uploaded").length,
            0
          );

          return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <div className="text-xs font-medium text-[#6B7280] mb-1">
                  전체 증빙자료
                </div>
                <div className="text-2xl font-bold text-[#111827]">
                  {stats.total}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <div className="text-xs font-medium text-[#6B7280] mb-1">
                  필수 항목
                </div>
                <div className="text-2xl font-bold text-[#111827]">
                  {requiredCount}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <div className="text-xs font-medium text-[#6B7280] mb-1">
                  업로드 완료
                </div>
                <div className="text-2xl font-bold text-[#10B981]">
                  {uploadedCount}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                <div className="text-xs font-medium text-[#6B7280] mb-1">
                  진행률
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {requiredCount > 0
                    ? Math.round((uploadedCount / requiredCount) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>
          );
        })()}

        {/* 필터 */}
        <div className="mb-4">
          <select
            value={selectedCategory}
            onChange={(e) =>
              onCategoryChange(e.target.value as DocumentCategory | "all")
            }
            className="px-3 py-2 bg-white border border-[#D1D5DB] rounded text-sm"
          >
            <option value="all">전체 카테고리</option>
            <option value="corporate">법인/사업자</option>
            <option value="team">팀 구성</option>
            <option value="technical">기술 역량</option>
            <option value="validation">검증 자료</option>
            <option value="market">시장 조사</option>
          </select>
        </div>

        {/* 필수 증빙자료 체크리스트 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#111827]">
            필수 증빙자료 체크리스트
          </h3>
          <div className="space-y-4">
            {getDocumentChecklist().map((category) => {
              const categoryNames = {
                corporate: "법인/사업자",
                team: "팀 구성",
                technical: "기술 역량",
                validation: "검증 자료",
                market: "시장 조사",
              };

              if (
                selectedCategory !== "all" &&
                selectedCategory !== category.category
              ) {
                return null;
              }

              return (
                <div
                  key={category.category}
                  className="bg-white rounded-lg border border-[#E5E7EB] p-4"
                >
                  <h4 className="font-medium text-[#111827] mb-3">
                    {categoryNames[category.category]}
                  </h4>
                  <div className="space-y-2">
                    {category.items.map((item, idx) => {
                      const document = item.documentId
                        ? evidenceDocuments.find(
                            (d) => d.id === item.documentId
                          )
                        : null;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB] hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center ${
                                item.status === "uploaded"
                                  ? "bg-[#10B981]"
                                  : item.status === "expired"
                                  ? "bg-[#EF4444]"
                                  : "bg-[#E5E7EB]"
                              }`}
                            >
                              {item.status === "uploaded" && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[#111827]">
                                {item.type}
                                {item.required && (
                                  <span className="text-[#EF4444] ml-1">*</span>
                                )}
                              </div>
                              {document && (
                                <div className="text-xs text-[#6B7280]">
                                  {document.name} •{" "}
                                  {new Date(
                                    document.uploadedAt
                                  ).toLocaleDateString("ko-KR")}
                                </div>
                              )}
                            </div>
                          </div>
                          {document && (
                            <a
                              href={document.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            >
                              보기
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 업로드된 증빙자료 목록 */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-3">
            업로드된 증빙자료
          </h3>
          {evidenceDocuments.filter(
            (doc) =>
              selectedCategory === "all" || doc.category === selectedCategory
          ).length === 0 ? (
            <div className="text-center py-8 text-sm text-[#6B7280] bg-white rounded-lg border border-[#E5E7EB]">
              업로드된 증빙자료가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {evidenceDocuments
                .filter(
                  (doc) =>
                    selectedCategory === "all" ||
                    doc.category === selectedCategory
                )
                .map((doc) => {
                  const categoryNames = {
                    corporate: "법인/사업자",
                    team: "팀 구성",
                    technical: "기술 역량",
                    validation: "검증 자료",
                    market: "시장 조사",
                  };

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E5E7EB] hover:border-[#3B82F6] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#111827]">
                            {doc.name}
                          </span>
                          <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] text-xs font-medium rounded">
                            {/* @ts-ignore */}
                            {categoryNames[doc.category] || doc.category}
                          </span>
                          {doc.required && (
                            <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#991B1B] text-xs font-medium rounded">
                              필수
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {doc.fileType} • {(doc.fileSize / 1024).toFixed(1)} KB{" "}
                          •{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString("ko-KR")}{" "}
                          • {doc.uploadedBy}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#3B82F6] text-white text-xs font-medium rounded hover:bg-[#2563EB] transition-colors"
                          >
                            보기
                          </a>
                        )}
                        <button
                          onClick={() => onDelete(doc.id)}
                          className="text-[#EF4444] hover:text-[#DC2626] transition-colors p-1"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* 증빙자료 추가 모달 */}
      {showAddEvidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[#111827]">
              증빙자료 추가
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#111827]">
                  이름 *
                </label>
                <input
                  type="text"
                  value={newEvidence.name}
                  onChange={(e) =>
                    setNewEvidence({ ...newEvidence, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="예: 법인등기부등본"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#111827]">
                  카테고리 *
                </label>
                <select
                  value={newEvidence.category}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      category: e.target.value as DocumentCategory,
                    })
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                >
                  <option value="corporate">법인/사업자</option>
                  <option value="team">팀 구성</option>
                  <option value="technical">기술 역량</option>
                  <option value="validation">검증 자료</option>
                  <option value="market">시장 조사</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#111827]">
                  타입 *
                </label>
                <input
                  type="text"
                  value={newEvidence.type}
                  onChange={(e) =>
                    setNewEvidence({ ...newEvidence, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="예: 법인등기부등본"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#111827]">
                  파일
                </label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#111827]">
                  설명
                </label>
                <textarea
                  value={newEvidence.description}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="설명을 입력하세요"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvidence.required}
                  onChange={(e) =>
                    setNewEvidence({
                      ...newEvidence,
                      required: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#3B82F6] rounded border-[#D1D5DB] focus:ring-[#3B82F6]"
                />
                <label className="text-sm text-[#111827]">필수 증빙자료</label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddEvidence(false)}
                className="flex-1 px-4 py-2 border border-[#D1D5DB] rounded text-sm font-medium text-[#111827] hover:bg-[#F9FAFB] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddEvidence}
                className="flex-1 px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}