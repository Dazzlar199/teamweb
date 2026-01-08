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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">필수 행정 체크리스트</h2>
          <p className="text-sm text-slate-400 font-bold mt-1">서류 제출 및 주요 일정을 누락 없이 관리하세요</p>
        </div>
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          + 항목 추가
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {roadmapPhases.map((phase) => {
          const phaseItems = checklistItems.filter((item) => item.phase === phase.id);
          if (phaseItems.length === 0) return null;

          const completedCount = phaseItems.filter((i) => i.completed).length;
          const progress = Math.round((completedCount / phaseItems.length) * 100);

          return (
            <div key={phase.id} className="glass-card rounded-3xl bg-white p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">{phase.title}</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{phase.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-indigo-600">{progress}%</span>
                  <div className="w-32 h-1.5 bg-slate-50 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {phaseItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onToggle(item.id)}
                      className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${item.completed ? "text-slate-300 line-through" : "text-slate-700"}`}>
                        {item.title}
                      </p>
                      {item.dueDate && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">~ {item.dueDate}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}