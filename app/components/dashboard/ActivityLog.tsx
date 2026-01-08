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
  
  const displayActivities = isExpanded ? activities : activities.slice(0, 5);

  const getMemberInfo = (userName: string) => {
    return TEAM_MEMBERS[userName as keyof typeof TEAM_MEMBERS] || {
      color: "#6B7280",
      initial: userName[0] || "?",
    };
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
      <div className="p-4 border-b border-[#E5E7EB]">
        <h2 className="text-base font-bold text-[#111827]">최근 활동</h2>
      </div>
      <div className="p-4">
        {activities.length > 0 ? (
          <>
            <div className="space-y-4">
              {displayActivities.map((activity) => {
                const member = getMemberInfo(activity.user);
                return (
                  <div key={activity.id} className="flex items-start gap-3 group">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#111827] leading-relaxed">
                        <span className="font-bold">{activity.user}</span>
                        <span className="text-[#6B7280]"> {activity.action}</span>
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-medium">
                        {formatActivityTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {activities.length > 5 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-4 py-2 text-xs font-bold text-[#3B82F6] hover:bg-[#F0F7FF] rounded-lg transition-all border border-dashed border-[#BFDBFE] flex items-center justify-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                    </svg>
                    접기
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                    더 보기 ({activities.length - 5}개 더 있음)
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-[#9CA3AF]">기록된 활동이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
