import React, { useState, useRef } from "react";
import type { RoadmapTask } from "@/lib/types/yechangpack";

interface TaskDetailModalProps {
  task: RoadmapTask;
  phaseId: string;
  currentUser: string;
  onClose: () => void;
  onToggleComplete: () => void;
  onAddNote: (content: string, files: File[]) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function TaskDetailModal({
  task,
  phaseId,
  currentUser,
  onClose,
  onToggleComplete,
  onAddNote,
  onDeleteNote,
}: TaskDetailModalProps) {
  const [noteContent, setNoteContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryColors: Record<string, string> = {
    "아카데미": "bg-amber-500 text-white",
    "예창패": "bg-purple-500 text-white",
    "공통": "bg-slate-500 text-white",
  };

  const handleAddNoteClick = () => {
    if (!noteContent.trim()) return;
    onAddNote(noteContent, attachments);
    setNoteContent("");
    setAttachments([]);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  categoryColors[task.category] || "bg-slate-100 text-slate-500"
                }`}
              >
                {task.category}
              </span>
              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleComplete();
                  }}
                  className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-500">
                  {task.completed ? "완료됨" : "진행중"}
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {task.title}
            </h2>
            {task.description && (
              <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">{task.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {task.details ? (
            <>
              {task.details.목표 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">
                    목표
                  </h3>
                  <p className="text-sm text-[#6B7280] bg-[#F9FAFB] p-3 rounded border border-[#E5E7EB]">
                    {task.details.목표}
                  </p>
                </div>
              )}

              {task.details.방법 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-2">
                    방법
                  </h3>
                  <p className="text-sm text-[#6B7280] bg-[#F9FAFB] p-3 rounded border border-[#E5E7EB]">
                    {task.details.방법}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {task.details.기간 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827] mb-2">
                      기간
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      {task.details.기간}
                    </p>
                  </div>
                )}

                {task.details.담당자 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827] mb-2">
                      담당자
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      {task.details.담당자}
                    </p>
                  </div>
                )}
              </div>

              {task.details.체크리스트 &&
                task.details.체크리스트.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827] mb-3">
                      체크리스트
                    </h3>
                    <div className="space-y-2">
                      {task.details.체크리스트.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]"
                        >
                          <div className="w-5 h-5 rounded border-2 border-[#D1D5DB] flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3 h-3 text-[#10B981] hidden"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-[#111827]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {task.details.참고자료 && task.details.참고자료.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#111827] mb-3">
                    참고자료
                  </h3>
                  <div className="space-y-2">
                    {task.details.참고자료.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]"
                      >
                        <svg
                          className="w-4 h-4 text-[#6B7280]"
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
                        <span className="text-sm text-[#111827]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-sm text-[#9CA3AF]">
              상세 내용이 없습니다.
            </div>
          )}

          {/* 노트 섹션 */}
          <div className="border-t border-[#E5E7EB] pt-6">
            <h3 className="text-sm font-semibold text-[#111827] mb-4">
              노트 및 기록 ({task.notes?.length || 0})
            </h3>

            {/* 노트 작성 폼 */}
            <div className="mb-6 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="노트를 작성하세요..."
                rows={4}
                className="w-full px-3 py-2 border border-[#D1D5DB]"
              />

              {/* 첨부파일 미리보기 */}
              {attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {attachments.map((file: File, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-white rounded border border-[#E5E7EB]"
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <svg
                          className="w-8 h-8 text-[#6B7280]"
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
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#111827] truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAttachments(
                            attachments.filter((_: File, i: number) => i !== index)
                          );
                        }}
                        className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachments([
                        ...attachments,
                        ...Array.from(e.target.files || []),
                      ]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-sm font-medium text-[#6B7280] rounded hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  파일 첨부
                </button>
                <button
                  onClick={handleAddNoteClick}
                  className="px-4 py-1.5 bg-[#3B82F6] text-white rounded text-sm hover:bg-[#2563EB] transition-colors"
                >
                  작성
                </button>
              </div>
            </div>

            {/* 노트 목록 */}
            <div className="space-y-4">
              {task.notes && task.notes.length > 0 ? (
                task.notes.map((note) => (
                  <div key={note.id} className="bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#3B82F6]">
                          <span className="text-xs font-medium text-white">
                            {note.author.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#111827]">
                            {note.author}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {new Date(note.createdAt).toLocaleString("ko-KR")}
                          </div>
                        </div>
                      </div>
                      {note.author === currentUser && (
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
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
                      )}
                    </div>
                    <div className="text-sm text-[#111827] whitespace-pre-wrap mb-3">
                      {note.content}
                    </div>

                    {/* 첨부파일 표시 */}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {note.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB] text-xs"
                            >
                              <div className="font-medium truncate">
                                {attachment.name}
                              </div>
                              <div className="text-[#6B7280]">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-[#9CA3AF]">
                  작성된 노트가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
