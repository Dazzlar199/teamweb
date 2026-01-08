import React from "react";
import Link from "next/link";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import type { Task } from "@/lib/types/task";

interface RecentTasksProps {
  tasks: Task[];
}

export default function RecentTasks({ tasks }: RecentTasksProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111827]">진행 중인 작업</h2>
          <p className="text-xs text-[#6B7280]">우선순위가 높은 작업들</p>
        </div>
        <Link href="/tasks" className="text-xs text-[#3B82F6] font-semibold hover:underline">전체 보기 →</Link>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => {
              const member = TEAM_MEMBERS[task.assignedTo as keyof typeof TEAM_MEMBERS] || { role: "팀원" };
              return (
                <Link key={task.id} href="/tasks" className="flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded-lg border border-transparent hover:border-[#E5E7EB] transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    task.priority === "high" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-[#111827] truncate">{task.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === "high" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                      }`}>
                        {task.priority === "high" ? "긴급" : "보통"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                      <span>{task.assignedTo} ({member.role})</span>
                      <span>•</span>
                      <span>{task.dueDate} 까지</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-10 opacity-50">
            <p className="text-sm">진행 중인 작업이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
