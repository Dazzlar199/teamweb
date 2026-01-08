import React from "react";
import Link from "next/link";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import type { Task } from "@/lib/types/task";

interface RecentTasksProps {
  tasks: Task[];
}

export default function RecentTasks({ tasks }: RecentTasksProps) {
  return (
    <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100/60 bg-white/50 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            진행 중인 프로젝트
          </h2>
        </div>
        <Link href="/tasks" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
          전체 보기
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-1">
            {tasks.map((task) => {
              const member = TEAM_MEMBERS[task.assignedTo as keyof typeof TEAM_MEMBERS] || { role: "팀원", color: "#64748b" };
              return (
                <Link key={task.id} href="/tasks" className="flex items-center gap-4 p-4 hover:bg-slate-50/80 rounded-xl transition-all group border border-transparent hover:border-slate-100/50">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                    task.priority === "high" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-tight ${
                        task.priority === "high" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                      }`}>
                        {task.priority === "high" ? "High" : "Mid"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1 text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.color }}></div>
                        {task.assignedTo}
                      </span>
                      <span>•</span>
                      <span>D-day {task.dueDate}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-16 opacity-40">
            <p className="text-sm font-medium">대기 중인 작업이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}