import React from "react";
import type { YechangpackDocument } from "@/lib/types/yechangpack";

interface DocumentsTabProps {
  documents: YechangpackDocument[];
  onDownload: (doc: YechangpackDocument) => void;
}

export default function DocumentsTab({
  documents,
  onDownload,
}: DocumentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#111827]">문서 다운로드</h2>
        <div className="text-sm text-[#6B7280]">
          총 {documents.length}개 문서
        </div>
      </div>

      {/* 카테고리별 그룹 */}
      {["공고", "양식", "가이드", "참고"].map((category) => {
        const categoryDocs = documents.filter(
          (doc) => doc.category === category
        );
        if (categoryDocs.length === 0) return null;

        return (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-[#E5E7EB] p-4 hover:border-[#3B82F6] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {doc.type === "pdf" && (
                          <svg
                            className="w-5 h-5 text-[#DC2626] flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        )}
                        {doc.type === "docx" && (
                          <svg
                            className="w-5 h-5 text-[#2B579A] flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        )}
                        {doc.type === "hwp" && (
                          <svg
                            className="w-5 h-5 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        )}
                        {doc.type === "md" && (
                          <svg
                            className="w-5 h-5 text-[#6B7280] flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        )}
                        <span className="text-sm font-medium text-[#111827] truncate">
                          {doc.name}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B7280]">{doc.size}</div>
                    </div>
                    <button
                      onClick={() => onDownload(doc)}
                      className="ml-3 px-3 py-1.5 bg-[#3B82F6] text-white text-xs font-medium rounded hover:bg-[#2563EB] transition-colors flex-shrink-0"
                    >
                      다운로드
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
