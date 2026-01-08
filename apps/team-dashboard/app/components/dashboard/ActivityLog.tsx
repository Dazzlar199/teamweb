"use client";

import { useState } from "react";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import { formatActivityTime } from "@/lib/utils/activityLog";
import type { ActivityLog as ActivityLogType } from "@/lib/utils/activityLog";

interface ActivityLogProps {
  activities: ActivityLogType[];
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 생산적인 활동만 필터링 (취소, 삭제 등 제외)
  const filteredActivities = activities.filter(a => 
    !a.action.includes("취소") && 
    !a.action.includes("삭제") && 
    !a.action.includes("거부")
  );

  const displayActivities = isExpanded ? filteredActivities : filteredActivities.slice(0, 6);

  const getMemberInfo = (userName: string) => {
    return TEAM_MEMBERS[userName as keyof typeof TEAM_MEMBERS] || {
      color: "#64748b",
      initial: userName[0] || "?",
    };
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100/60 bg-white/50">
        <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
          최근 팀 활동
        </h2>
      </div>
      <div className="p-5 flex-1 bg-white/30 backdrop-blur-sm">
        {activities.length > 0 ? (
          <div className="relative">
            {/* 타임라인 점선 */}
            <div className="absolute left-[15px] top-2 bottom-2 w-[1px] bg-slate-100"></div>
            
            <div className="space-y-6">
              {displayActivities.map((activity) => {
                const member = getMemberInfo(activity.user);
                return (
                  <div key={activity.id} className="relative flex items-start gap-4 group">
                    <div
                      className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-md ring-4 ring-white transition-transform group-hover:scale-110"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initial}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[13px] text-slate-700 leading-snug">
                          <span className="font-bold text-slate-900">{activity.user}</span>
                          <span className="text-slate-500"> {activity.action}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {formatActivityTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {activities.length > 6 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-6 py-2.5 text-[12px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100/50 flex items-center justify-center gap-2 group"
              >
                {isExpanded ? (
                  <>
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                    </svg>
                    활동 요약하기
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                    {activities.length - 6}개의 활동 더 보기
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[13px] text-slate-400 font-medium">활동 기록이 비어있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}