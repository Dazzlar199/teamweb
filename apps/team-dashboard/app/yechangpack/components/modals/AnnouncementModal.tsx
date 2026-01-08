import React from "react";
import type { YechangpackDocument } from "@/lib/types/yechangpack";

interface AnnouncementModalProps {
  document: YechangpackDocument;
  documents: YechangpackDocument[];
  onClose: () => void;
  onDownload: (doc: YechangpackDocument) => void;
}

export default function AnnouncementModal({
  document,
  documents,
  onClose,
  onDownload,
}: AnnouncementModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#3B82F6] to-[#2563EB]">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <h2 className="text-lg font-bold text-white">{document.name}</h2>
              <p className="text-sm text-blue-100">
                2025년도 예비창업패키지 공고문
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {/* 평가 기준 안내 */}
          <div className="mb-6 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] rounded-lg p-5 border border-[#BFDBFE]">
            <h3 className="text-lg font-bold text-[#1E40AF] mb-3 flex items-center gap-2">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              평가 기준 확인 가이드
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-[#BFDBFE]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EF4444] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#111827] mb-2">
                      문제인식 (25점)
                    </h4>
                    <ul className="text-sm text-[#4B5563] space-y-1.5 list-disc list-inside">
                      <li>시장 문제의 명확성과 구체성</li>
                      <li>문제의 규모와 영향력</li>
                      <li>문제의 시급성과 해결 필요성</li>
                      <li>문제 인식의 근거와 데이터</li>
                      <li>타겟 고객의 니즈와 페인 포인트</li>
                    </ul>
                    <p className="text-xs text-[#6B7280] mt-2 italic">
                      공고문에서 "사업의 필요성" 섹션을 참고하세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[#BFDBFE]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#111827] mb-2">
                      해결방안 (25점)
                    </h4>
                    <ul className="text-sm text-[#4B5563] space-y-1.5 list-disc list-inside">
                      <li>해결방안의 차별성과 혁신성</li>
                      <li>기술적/사업적 실현 가능성</li>
                      <li>해결방안의 효과성과 영향력</li>
                      <li>경쟁사 대비 우위점</li>
                      <li>구체적인 실행 계획과 방법론</li>
                    </ul>
                    <p className="text-xs text-[#6B7280] mt-2 italic">
                      공고문에서 "사업계획서 작성 가이드" 섹션을 참고하세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[#BFDBFE]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#111827] mb-2">
                      성장전략 (25점)
                    </h4>
                    <ul className="text-sm text-[#4B5563] space-y-1.5 list-disc list-inside">
                      <li>시장 진입 전략과 포지셔닝</li>
                      <li>마케팅 및 영업 전략</li>
                      <li>수익 모델과 사업화 계획</li>
                      <li>성장 로드맵과 단계별 목표</li>
                      <li>확장성과 지속가능성</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[#BFDBFE]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#111827] mb-2">
                      팀구성 (25점)
                    </h4>
                    <ul className="text-sm text-[#4B5563] space-y-1.5 list-disc list-inside">
                      <li>팀원의 전문성과 경력</li>
                      <li>역할 분담과 협업 체계</li>
                      <li>보유 기술과 역량</li>
                      <li>사업 추진 의지와 헌신도</li>
                      <li>과거 성과와 실적</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 공고문 다운로드 및 보기 */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
            <h3 className="text-base font-semibold text-[#111827] mb-3">
              공고문 다운로드
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-5 h-5 text-[#DC2626]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <span className="text-sm font-medium text-[#111827]">
                    {document.name}
                  </span>
                </div>
                <div className="text-xs text-[#6B7280]">{document.size}</div>
              </div>
              <button
                onClick={() => {
                  onDownload(document);
                }}
                className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded-lg hover:bg-[#2563EB] transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                다운로드
              </button>
              <button
                onClick={() => {
                  window.open(encodeURI(document.path), "_blank");
                }}
                className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] text-sm font-medium rounded-lg hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                새 창에서 보기
              </button>
            </div>
          </div>

          {/* 관련 문서 */}
          <div className="mt-4 bg-[#F9FAFB] rounded-lg p-4 border border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111827] mb-2">
              관련 문서
            </h3>
            <div className="space-y-2">
              {documents
                .filter(
                  (doc) =>
                    doc.category === "공고" ||
                    doc.category === "양식" ||
                    (doc.category === "가이드" && doc.name.includes("예창패"))
                )
                .slice(0, 5)
                .map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onDownload(doc)}
                    className="w-full text-left px-3 py-2 bg-white rounded border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg
                        className="w-4 h-4 text-[#6B7280] flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-xs text-[#111827] truncate group-hover:text-[#3B82F6]">
                        {doc.name}
                      </span>
                    </div>
                    <span className="text-xs text-[#9CA3AF] ml-2 flex-shrink-0">
                      {doc.size}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#3B82F6] text-white font-medium rounded-lg hover:bg-[#2563EB] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
