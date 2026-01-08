"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getActivityLogs } from "@/lib/utils/activityLog";
import { checkDeadlines } from "@/lib/utils/notifications";
import { getEvents } from "@/lib/utils/event";
import { getLocalStorage } from "@/lib/utils/localStorage";
import { getToday, filterTodayEvents } from "@/lib/utils/date";
import type { ActivityLog as ActivityLogType } from "@/lib/utils/activityLog";
import type { Event, Holiday } from "@/lib/types/event";
import type { Task } from "@/lib/types/task";

// 리팩토링된 하위 컴포넌트들
import DashboardStats from "./components/dashboard/DashboardStats";
import MiniCalendar from "./components/dashboard/MiniCalendar";
import TodayEvents from "./components/dashboard/TodayEvents";
import RecentTasks from "./components/dashboard/RecentTasks";
import RecentFiles from "./components/dashboard/RecentFiles";
import ActivityLog from "./components/dashboard/ActivityLog";

export default function DashboardPage() {
  const [events, setEvents] = useState<(Event | Holiday)[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLogType[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [selectedDateEvents, setSelectedDateEvents] = useState<(Event | Holiday)[]>([]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 일정 로드
        const loadedEvents = await getEvents();
        setEvents(loadedEvents);
        
        // 초기 로드 시 오늘 날짜의 일정 필터링
        const today = new Date().getDate();
        const todayEvents = filterTodayEvents(loadedEvents);
        setSelectedDateEvents(todayEvents);

        // 2. 작업 로드
        const savedTasks = localStorage.getItem("team-dashboard-tasks");
        if (savedTasks) {
          const loadedTasks = JSON.parse(savedTasks);
          setTasks(loadedTasks);
          // 마감일 체크 및 알림
          checkDeadlines(loadedTasks, loadedEvents);
        }

        // 3. 최근 활동 로드
        const logs = await getActivityLogs(20);
        setRecentActivities(logs);

        // 4. 최근 파일 로드
        const savedFiles = localStorage.getItem("team-dashboard-files");
        if (savedFiles) {
          setRecentFiles(JSON.parse(savedFiles).slice(0, 5));
        }
      } catch (error) {
        console.error("대시보드 데이터 로드 실패:", error);
      }
    };

    loadData();
  }, []);

  // 통계 계산
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const pendingTasks = totalTasks - completedTasks;
    const urgentTasks = tasks.filter((t) => t.priority === "high" && t.status !== "done").length;

    return [
      {
        label: "전체 작업",
        value: totalTasks,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
        color: "bg-blue-500",
        desc: "프로젝트 진행도: " + (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0) + "%"
      },
      {
        label: "진행 중",
        value: pendingTasks,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        color: "bg-amber-500",
        desc: "미완료된 작업들"
      },
      {
        label: "긴급 작업",
        value: urgentTasks,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
        color: "bg-red-500",
        desc: "높은 우선순위"
      },
      {
        label: "등록된 일정",
        value: events.filter(e => e.createdBy !== "시스템").length,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        color: "bg-green-500",
        desc: "이번 달 주요 일정"
      },
    ];
  }, [tasks, events]);

  const handleDateSelect = (date: number, dateEvents: (Event | Holiday)[]) => {
    setSelectedDate(date);
    setSelectedDateEvents(dateEvents);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 섹션 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">팀 대시보드</h1>
            <p className="text-sm text-[#6B7280]">특별시 팀의 프로젝트 현황 및 활동 요약</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tasks" className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-bold rounded-lg hover:bg-[#2563EB] transition-all shadow-sm">
              새 작업 추가
            </Link>
          </div>
        </div>

        {/* 통계 섹션 */}
        <DashboardStats stats={stats} />

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 왼쪽: 일정 및 작업 (2/3 영역) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 일정 관리 카드 */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E5E7EB]">
                <h2 className="text-base font-bold text-[#111827]">프로젝트 일정</h2>
              </div>
              <div className="flex flex-col md:flex-row h-full">
                <div className="p-4 border-b md:border-b-0 md:border-r border-[#E5E7EB] w-full md:w-1/2">
                  <MiniCalendar events={events} onDateSelect={handleDateSelect} />
                </div>
                <div className="w-full md:w-1/2">
                  <TodayEvents date={selectedDate} events={selectedDateEvents} />
                </div>
              </div>
            </div>

            {/* 진행 중인 작업 */}
            <RecentTasks tasks={tasks.filter(t => t.status !== "done").slice(0, 5)} />
          </div>

          {/* 오른쪽: 최근 파일 및 활동 (1/3 영역) */}
          <div className="space-y-6">
            <RecentFiles files={recentFiles} />
            <ActivityLog activities={recentActivities} />
          </div>

        </div>
      </div>
    </div>
  );
}