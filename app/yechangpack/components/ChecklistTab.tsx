import React from "react";
import type { ChecklistItem, RoadmapPhase } from "@/lib/types/yechangpack";

interface ChecklistTabProps {
  checklistItems: ChecklistItem[];
  roadmapPhases: RoadmapPhase[];
  onToggle: (id: string) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function ChecklistTab({
  checklistItems,
  roadmapPhases,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
}: ChecklistTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#111827]">체크리스트</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-[#6B7280]">
            완료: {checklistItems.filter((i) => i.completed).length} /{" "}
            {checklistItems.length}
          </div>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
          >
            + 체크리스트 추가
          </button>
        </div>
      </div>

      {/* 단계별 체크리스트 */}
      {roadmapPhases.map((phase) => {
        const phaseItems = checklistItems.filter(
          (item) => item.phase === phase.id
        );
        if (phaseItems.length === 0) return null;

        const completedCount = phaseItems.filter((i) => i.completed).length;
        const progress =
          phaseItems.length > 0
            ? (completedCount / phaseItems.length) * 100
            : 0;

        return (
          <div
            key={phase.id}
            className="bg-white rounded-lg border border-[#E5E7EB] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#111827]">{phase.title}</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">{phase.period}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-[#111827]">
                  {Math.round(progress)}%
                </div>
                <div className="w-32 bg-[#E5E7EB] rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {phaseItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onToggle(item.id)}
                    className="w-4 h-4 text-[#3B82F6] rounded border-[#D1D5DB] focus:ring-[#3B82F6]"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.completed
                        ? "text-[#9CA3AF] line-through"
                        : "text-[#111827]"
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.dueDate && (
                    <span className="text-xs text-[#6B7280]">
                      {new Date(item.dueDate).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-1 text-[#6B7280] hover:text-[#3B82F6] transition-colors"
                      title="수정"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="p-1 text-[#6B7280] hover:text-[#EF4444] transition-colors"
                      title="삭제"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 전체 체크리스트 (단계 없음) */}
      {checklistItems.filter(
        (item) => !item.phase || !roadmapPhases.find((p) => p.id === item.phase)
      ).length > 0 && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
          <h3 className="font-semibold text-[#111827] mb-3">기타</h3>
          <div className="space-y-2">
            {checklistItems
              .filter(
                (item) =>
                  !item.phase || !roadmapPhases.find((p) => p.id === item.phase)
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onToggle(item.id)}
                    className="w-4 h-4 text-[#3B82F6] rounded border-[#D1D5DB] focus:ring-[#3B82F6]"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.completed
                        ? "text-[#9CA3AF] line-through"
                        : "text-[#111827]"
                    }`}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-1 text-[#6B7280] hover:text-[#3B82F6] transition-colors"
                      title="수정"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="p-1 text-[#6B7280] hover:text-[#EF4444] transition-colors"
                      title="삭제"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
