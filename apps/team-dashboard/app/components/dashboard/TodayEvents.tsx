"use client";

import React from "react";
import Link from "next/link";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import type { Event, Holiday } from "@/lib/types/event";

interface TodayEventsProps {
  date: number;
  events: (Event | Holiday)[];
}

export default function TodayEvents({ date, events }: TodayEventsProps) {
  return (
    <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#111827]">
          {date}일의 일정 <span className="text-[#6B7280] font-normal ml-1">({events.length})</span>
        </h2>
        <Link href="/calendar" className="text-[11px] text-[#3B82F6] font-bold hover:underline">일정룸 이동 →</Link>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {events.length > 0 ? (
          events.map((event) => {
            const isHoliday = event.createdBy === "시스템";
            const member = isHoliday ? { color: "#EF4444" } : TEAM_MEMBERS[event.createdBy as keyof typeof TEAM_MEMBERS] || { color: "#3B82F6" };
            
            return (
              <div key={event.id} className="bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-sm flex items-start gap-3">
                <div className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0" style={{ backgroundColor: member.color }} />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-[#111827] truncate leading-tight">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {!isHoliday && <span className="text-[10px] text-[#6B7280]">{(event as Event).time}</span>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isHoliday ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                      {isHoliday ? "공휴일" : event.createdBy}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center py-10 opacity-40">
            <p className="text-xs text-center">일정이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
