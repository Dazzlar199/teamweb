import React, { useState } from "react";
import type { Note } from "@/lib/types/yechangpack";

interface NotesTabProps {
  notes: Note[];
  onAdd: (note: Note) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export default function NotesTab({
  notes,
  onAdd,
  onUpdate,
  onDelete,
}: NotesTabProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "메모" as Note["category"],
  });

  const handleAddClick = () => {
    if (!newNote.title.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      category: newNote.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAdd(note);
    setNewNote({ title: "", content: "", category: "메모" });
    setShowAddNote(false);
    setSelectedNote(note);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 노트 목록 */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">기록</h2>
          <button
            onClick={() => setShowAddNote(true)}
            className="px-3 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
          >
            + 새 기록
          </button>
        </div>

        {/* 새 기록 폼 */}
        {showAddNote && (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 space-y-3 mb-4">
            <input
              type="text"
              placeholder="제목"
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
            <select
              value={newNote.category}
              onChange={(e) =>
                setNewNote({
                  ...newNote,
                  category: e.target.value as Note["category"],
                })
              }
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
            >
              <option value="메모">메모</option>
              <option value="일정">일정</option>
              <option value="체크리스트">체크리스트</option>
              <option value="아이디어">아이디어</option>
            </select>
            <textarea
              placeholder="내용"
              value={newNote.content}
              onChange={(e) =>
                setNewNote({ ...newNote, content: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddClick}
                className="flex-1 px-3 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setShowAddNote(false);
                  setNewNote({ title: "", content: "", category: "메모" });
                }}
                className="px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] text-sm font-medium rounded hover:bg-[#E5E7EB] transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 노트 목록 */}
        <div className="space-y-2">
          {notes.map((note) => {
            const categoryColors = {
              일정: "bg-[#3B82F6]",
              체크리스트: "bg-[#10B981]",
              메모: "bg-[#6B7280]",
              아이디어: "bg-[#F59E0B]",
            };

            return (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-3 bg-white rounded-lg border cursor-pointer transition-colors ${
                  selectedNote?.id === note.id
                    ? "border-blue-600"
                    : "border-[#E5E7EB] hover:border-[#D1D5DB]"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        categoryColors[note.category]
                      }`}
                    />
                    <span className="text-sm font-medium text-[#111827] truncate">
                      {note.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(note.id);
                      if (selectedNote?.id === note.id) {
                        setSelectedNote(null);
                      }
                    }}
                    className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors flex-shrink-0 ml-2"
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
                <div className="text-xs text-[#6B7280] mt-1">
                  {new Date(note.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
            );
          })}
          {notes.length === 0 && (
            <div className="text-center py-8 text-sm text-[#9CA3AF] bg-white rounded-lg border border-[#E5E7EB]">
              기록이 없습니다. 새 기록을 추가해보세요.
            </div>
          )}
        </div>
      </div>

      {/* 노트 상세 */}
      <div className="lg:col-span-2">
        {selectedNote ? (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <div className="mb-4">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => {
                  const val = e.target.value;
                  // Update local state for responsiveness
                  setSelectedNote({ ...selectedNote, title: val });
                  // Update parent state
                  onUpdate(selectedNote.id, { title: val });
                }}
                className="w-full text-lg font-semibold text-[#111827] border-none focus:outline-none focus:ring-0 pb-2 border-b border-[#E5E7EB] mb-3"
              />
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={selectedNote.category}
                  onChange={(e) => {
                    const val = e.target.value as Note["category"];
                    setSelectedNote({ ...selectedNote, category: val });
                    onUpdate(selectedNote.id, { category: val });
                  }}
                  className="px-2 py-1 text-xs border border-[#D1D5DB] rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                >
                  <option value="메모">메모</option>
                  <option value="일정">일정</option>
                  <option value="체크리스트">체크리스트</option>
                  <option value="아이디어">아이디어</option>
                </select>
                <span className="text-xs text-[#6B7280]">
                  {new Date(selectedNote.updatedAt).toLocaleString("ko-KR")}
                </span>
              </div>
            </div>
            <textarea
              value={selectedNote.content}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedNote({ ...selectedNote, content: val });
                onUpdate(selectedNote.id, { content: val });
              }}
              rows={20}
              className="w-full px-4 py-3 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              placeholder="내용을 입력하세요..."
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
            <svg
              className="w-16 h-16 text-[#D1D5DB] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm text-[#6B7280]">
              기록을 선택하거나 새 기록을 추가하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
