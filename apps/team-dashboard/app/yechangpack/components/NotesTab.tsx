"use client";

import React, { useState } from "react";
import type { Note } from "@/lib/types/yechangpack";

interface NotesTabProps {
  notes: Note[];
  onAdd: (note: Note) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export default function NotesTab({ notes, onAdd, onUpdate, onDelete }: NotesTabProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", category: "메모" as Note["category"] });

  const handleAddClick = () => {
    if (!newNote.title.trim()) return;
    const note: Note = { id: Date.now().toString(), title: newNote.title, content: newNote.content, category: newNote.category, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    onAdd(note);
    setNewNote({ title: "", content: "", category: "메모" });
    setShowAddNote(false);
    setSelectedNote(note);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      
      {/* 1. 사이드바: 노트 목록 */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Archive</h3>
          <button
            onClick={() => setShowAddNote(true)}
            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {showAddNote && (
          <div className="bg-white p-5 rounded-2xl border-2 border-indigo-500 shadow-xl space-y-4 animate-slide-in">
            <input
              type="text"
              placeholder="제목"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full text-sm font-bold bg-transparent outline-none border-b border-slate-100 pb-2"
            />
            <textarea
              placeholder="자유롭게 기록하세요..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={4}
              className="w-full text-xs font-medium bg-transparent outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleAddClick} className="flex-1 py-2 bg-indigo-600 text-white text-[11px] font-black rounded-lg">저장</button>
              <button onClick={() => setShowAddNote(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 text-[11px] font-black rounded-lg">취소</button>
            </div>
          </div>
        )}

        <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`group p-4 rounded-2xl cursor-pointer transition-all border ${
                selectedNote?.id === note.id ? "bg-white border-indigo-200 shadow-md ring-4 ring-indigo-50/50" : "bg-white/50 border-transparent hover:border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-slate-900 truncate mb-1">{note.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{note.content}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                  className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 메인: 노트 에디터 뷰 */}
      <div className="flex-1">
        {selectedNote ? (
          <div className="glass-card rounded-3xl bg-white p-10 h-full flex flex-col animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-md">{selectedNote.category}</span>
              <span className="text-[11px] font-bold text-slate-300">Updated {new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
            </div>
            <input
              type="text"
              value={selectedNote.title}
              onChange={(e) => onUpdate(selectedNote.id, { title: e.target.value })}
              className="w-full text-2xl font-black text-slate-900 outline-none mb-8 bg-transparent tracking-tight"
            />
            <textarea
              value={selectedNote.content}
              onChange={(e) => onUpdate(selectedNote.id, { content: e.target.value })}
              className="w-full flex-1 text-[15px] font-medium text-slate-600 leading-relaxed outline-none resize-none bg-transparent"
              placeholder="내용을 입력하세요..."
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 opacity-40">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm font-bold">노트를 선택하거나 새로 추가하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}