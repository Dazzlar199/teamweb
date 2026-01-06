"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import { getActivityLogs, formatActivityTime } from "@/lib/utils/activityLog";
import { checkDeadlines } from "@/lib/utils/notifications";
import type { ActivityLog } from "@/lib/utils/activityLog";
import type { Event, Holiday } from "@/lib/types/event";
import type { Task } from "@/lib/types/task";
import { useUser } from "@/lib/context/UserContext";
import { handleError } from "@/lib/utils/errorHandler";

// 작은 캘린더 컴포넌트
function MiniCalendar({
  events,
  onDateSelect,
}: {
  events: (Event | Holiday)[];
  onDateSelect: (date: number, dateEvents: (Event | Holiday)[]) => void;
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const currentDate = today.getDate();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  // 공휴일 초기화 (모든 년도에 적용)
  const initializeHolidays = (): Holiday[] => {
    // 고정 공휴일 (매년 동일)
    const fixedHolidays = [
      { title: "신정", date: 1, month: 0 },
      { title: "3·1절", date: 1, month: 2 },
      { title: "어린이날", date: 5, month: 4 },
      { title: "현충일", date: 6, month: 5 },
      { title: "광복절", date: 15, month: 7 },
      { title: "개천절", date: 3, month: 9 },
      { title: "한글날", date: 9, month: 9 },
      { title: "성탄절", date: 25, month: 11 },
    ];

    // 2026년 특정 공휴일
    const year2026Holidays = [
      { title: "설날", date: 17, month: 1, year: 2026 },
      { title: "석가탄신일", date: 24, month: 4, year: 2026 },
      { title: "추석", date: 25, month: 8, year: 2026 },
    ];

    const allHolidays: Holiday[] = [];

    // 고정 공휴일을 모든 년도에 추가 (2020-2030)
    for (let year = 2020; year <= 2030; year++) {
      fixedHolidays.forEach((holiday) => {
        allHolidays.push({
          id: `holiday-${year}-${holiday.month + 1}-${holiday.date}`,
          title: holiday.title,
          date: holiday.date,
          year,
          month: holiday.month,
          createdBy: "시스템",
        });
      });
    }

    // 2026년 특정 공휴일 추가
    year2026Holidays.forEach((holiday) => {
      allHolidays.push({
        id: `holiday-${holiday.year}-${holiday.month + 1}-${holiday.date}`,
        title: holiday.title,
        date: holiday.date,
        year: holiday.year,
        month: holiday.month,
        createdBy: "시스템",
      });
    });

    return allHolidays;
  };

  const [holidays] = useState(initializeHolidays());

  const changeMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getEventsForDate = (date: number) => {
    return events.filter((e) => {
      if (e.date !== date) return false;
      // year와 month가 있으면 정확히 매칭, 없으면 현재 월/년도로 간주
      if (e.year !== undefined && e.month !== undefined) {
        return e.year === currentYear && e.month === currentMonth;
      }
      return true;
    });
  };

  const getHolidaysForDate = (date: number) => {
    return holidays.filter((h) => {
      if (h.date !== date) return false;
      if (h.year !== undefined && h.month !== undefined) {
        return h.year === currentYear && h.month === currentMonth;
      }
      return true;
    });
  };

  const isToday = (date: number) => {
    return date === currentDate;
  };

  const handleDateClick = (date: number) => {
    const dateEvents = getEventsForDate(date);
    const dateHolidays = getHolidaysForDate(date);
    // 공휴일도 포함해서 전달
    const allDateItems = [...dateHolidays, ...dateEvents];
    setSelectedDate(date === selectedDate ? null : date);
    onDateSelect(date, allDateItems);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-[#111827] leading-tight">
          {currentYear}년 {monthNames[currentMonth]}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth("prev")}
            className="px-1 py-0.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded text-[10px]"
            title="이전 월"
          >
            ‹
          </button>
          <button
            onClick={goToToday}
            className="px-1.5 py-0.5 text-[#3B82F6] hover:bg-[#EFF6FF] rounded text-[10px] font-medium"
            title="오늘"
          >
            오늘
          </button>
          <button
            onClick={() => changeMonth("next")}
            className="px-1 py-0.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded text-[10px]"
            title="다음 월"
          >
            ›
          </button>
        </div>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`text-center text-[10px] font-semibold leading-tight py-1 ${
              index === 0
                ? "text-[#EF4444]"
                : index === 6
                ? "text-[#3B82F6]"
                : "text-[#6B7280]"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, index) => {
          if (date === null) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square bg-[#FAFAFA] rounded"
              />
            );
          }

          const dateEvents = getEventsForDate(date);
          const dateHolidays = getHolidaysForDate(date);
          const allDateItems = [...dateHolidays, ...dateEvents]; // 공휴일을 먼저 표시
          const isTodayDate = isToday(date);

          // 해당 날짜의 요일 계산 (0=일요일, 6=토요일)
          const dateObj = new Date(currentYear, currentMonth, date);
          const dayOfWeek = dateObj.getDay();
          const isSunday = dayOfWeek === 0;
          const hasHoliday = dateHolidays.length > 0;

          const isSelected = selectedDate === date;

          return (
            <div
              key={date}
              onClick={() => handleDateClick(date)}
              className={`aspect-square rounded flex flex-col items-center justify-center p-0.5 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-[#3B82F6] border-2 border-[#60A5FA]"
                  : isTodayDate
                  ? "bg-[#DBEAFE] border-2 border-[#2563EB]"
                  : "bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB]"
              }`}
            >
              <span
                className={`text-[10px] font-semibold leading-tight ${
                  isSelected
                    ? "text-white"
                    : isTodayDate
                    ? "text-[#3B82F6]"
                    : isSunday || hasHoliday
                    ? "text-[#EF4444]"
                    : "text-[#111827]"
                }`}
              >
                {date}
              </span>
              {allDateItems.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {allDateItems
                    .slice(0, 2)
                    .map((item: Event | Holiday, idx: number) => {
                      const isHoliday = item.createdBy === "시스템";
                      const member = isHoliday
                        ? { color: "#EF4444" }
                        : TEAM_MEMBERS[
                            item.createdBy as keyof typeof TEAM_MEMBERS
                          ] || { color: "#2563EB" };
                      return (
                        <div
                          key={idx}
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? "bg-white" : ""
                          }`}
                          style={
                            isSelected ? {} : { backgroundColor: member.color }
                          }
                          title={item.title}
                        />
                      );
                    })}
                  {allDateItems.length > 2 && (
                    <div
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? "bg-white opacity-70" : "bg-[#9CA3AF]"
                      }`}
                      title={`+${allDateItems.length - 2}개 더`}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useUser();
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<
    (Event | Holiday)[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    todayEvents: 0,
    weekEvents: 0,
    activeTasks: 0,
    urgentTasks: 0,
    recentFiles: 0,
    weekFiles: 0,
    totalFiles: 0,
    completionRate: 0,
    averageProgress: 0,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
      checkDeadlinesAndNotify();
    }, 60000); // 1분마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    // 일정 로드
    const eventsJson = localStorage.getItem("team-dashboard-events");
    if (eventsJson) {
      try {
        const events = JSON.parse(eventsJson) as (Event | Holiday)[];
        // 공휴일 제외 (createdBy가 "시스템"이 아닌 것만)
        const userEvents = events.filter(
          (e) => e.createdBy !== "시스템"
        ) as Event[];

        setAllEvents(userEvents);
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        const todayEventsList = userEvents.filter((e) => {
          if (e.date !== todayDate) return false;
          // year와 month가 있으면 정확히 매칭, 없으면 현재 월/년도로 간주
          if (e.year !== undefined && e.month !== undefined) {
            return e.year === todayYear && e.month === todayMonth;
          }
          return true;
        });
        const weekEventsList = userEvents.filter((e) => {
          const eventYear = e.year !== undefined ? e.year : today.getFullYear();
          const eventMonth = e.month !== undefined ? e.month : today.getMonth();
          const eventDate = new Date(eventYear, eventMonth, e.date);
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
        setTodayEvents(todayEventsList.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          todayEvents: todayEventsList.length,
          weekEvents: weekEventsList.length,
        }));
      } catch (e) {
        handleError(e instanceof Error ? e : new Error(String(e)), {
          component: "Home",
          action: "loadEvents",
        });
      }
    }

    // 작업 로드
    const tasksJson = localStorage.getItem("team-dashboard-tasks");
    if (tasksJson) {
      try {
        const tasks = JSON.parse(tasksJson) as Task[];
        const active = tasks.filter(
          (t: Task) => t.status === "in_progress" || t.status === "todo"
        );
        const now = new Date();
        const urgent = active.filter((t: Task) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          const diff = dueDate.getTime() - now.getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          return days <= 3 && days >= 0;
        });
        setActiveTasks(active.slice(0, 3));
        const doneCount = tasks.filter((t: Task) => t.status === "done").length;
        const completionRate =
          tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

        // 전체 프로젝트 진척도 계산 (모든 작업의 평균 진척도)
        const totalProgress = tasks.reduce((sum: number, t: Task) => {
          return sum + (t.progress || 0);
        }, 0);
        const averageProgress =
          tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0;

        setStats((prev) => ({
          ...prev,
          activeTasks: active.length,
          urgentTasks: urgent.length,
          completionRate,
          averageProgress,
        }));
      } catch (e) {
        handleError(e instanceof Error ? e : new Error(String(e)), {
          component: "Home",
          action: "loadTasks",
        });
      }
    }

    // 파일 로드 (IndexedDB는 비동기이므로 간단히 처리)
    try {
      const filesJson = localStorage.getItem("team-dashboard-images");
      if (filesJson) {
        const files = JSON.parse(filesJson) as Array<{
          id: string;
          name: string;
          date: string;
          uploadedBy: string;
        }>;
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekFiles = files.filter(
          (f: {
            id: string;
            name: string;
            date: string;
            uploadedBy: string;
          }) => {
            const fileDate = new Date(f.date);
            return fileDate >= weekAgo;
          }
        );
        setRecentFiles(files.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          recentFiles: files.length,
          weekFiles: weekFiles.length,
          totalFiles: files.length,
        }));
      }
    } catch (e) {
      handleError(e instanceof Error ? e : new Error(String(e)), {
        component: "Home",
        action: "loadFiles",
      });
    }

    // 활동 로그 로드
    const activities = getActivityLogs(10);
    setRecentActivities(activities);
  };

  const checkDeadlinesAndNotify = () => {
    const tasksJson = localStorage.getItem("team-dashboard-tasks");
    const eventsJson = localStorage.getItem("team-dashboard-events");
    if (tasksJson && eventsJson) {
      try {
        const tasks = JSON.parse(tasksJson);
        const events = JSON.parse(eventsJson);
        checkDeadlines(tasks, events);
      } catch (e) {
        handleError(e instanceof Error ? e : new Error(String(e)), {
          component: "Home",
          action: "checkDeadlines",
        });
      }
    }
  };

  const getMemberInfo = (name: string) => {
    return (
      TEAM_MEMBERS[name as keyof typeof TEAM_MEMBERS] || {
        initial: name[0],
        color: "#6B7280",
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#111827] leading-tight">
                대시보드
              </h1>
              <p className="text-xs text-[#6B7280] mt-1 leading-tight">
                전체 현황을 한눈에 확인하세요
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-3.5 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded-md hover:bg-[#60A5FA] transition-colors leading-tight"
            >
              새로고침
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <Link href="/calendar">
              <div className="bg-white rounded-lg p-4 border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#6B7280] font-medium leading-tight">
                    오늘 일정
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#3B82F6]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-[#111827] mb-0.5 leading-tight">
                  {stats.todayEvents}
                </div>
                <div className="text-xs text-[#10B981] leading-tight">
                  +{stats.weekEvents} 이번 주
                </div>
              </div>
            </Link>
            <Link href="/tasks">
              <div className="bg-white rounded-lg p-4 border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#6B7280] font-medium leading-tight">
                    진행 중 작업
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#F59E0B]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-[#111827] mb-0.5 leading-tight">
                  {stats.activeTasks}
                </div>
                <div className="text-xs text-[#F59E0B] leading-tight">
                  {stats.urgentTasks}개 마감 임박
                </div>
              </div>
            </Link>
            <Link href="/files">
              <div className="bg-white rounded-lg p-4 border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#6B7280] font-medium leading-tight">
                    최근 파일
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#E0E7FF] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#6366F1]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-[#111827] mb-0.5 leading-tight">
                  {stats.weekFiles}
                </div>
                <div className="text-xs text-[#6B7280] leading-tight">
                  이번 주 업로드
                </div>
              </div>
            </Link>
            <Link href="/tasks">
              <div className="bg-white rounded-lg p-4 border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[#6B7280] font-medium leading-tight">
                    프로젝트 진척도
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[#3B82F6]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-[#111827] mb-0.5 leading-tight">
                  {stats.averageProgress}%
                </div>
                <div className="mt-2">
                  <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B82F6] transition-all duration-300 rounded-full"
                      style={{ width: `${stats.averageProgress}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-[#6B7280] leading-tight mt-1">
                  전체 작업 평균
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 왼쪽: 일정 & 작업 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 오늘 일정 & 캘린더 */}
              <div className="bg-white rounded-lg border border-[#E5E7EB]">
                <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#111827] leading-tight">
                      오늘 일정
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-tight">
                      총 {stats.todayEvents}개 일정
                    </p>
                  </div>
                  <Link
                    href="/calendar"
                    className="text-xs text-[#3B82F6] hover:underline font-medium leading-tight"
                  >
                    전체 보기 →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  {/* 왼쪽: 오늘 일정 리스트 또는 선택한 날짜 일정 */}
                  <div>
                    {selectedDate ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-[#111827] leading-tight">
                            {selectedDate}일 일정
                          </h3>
                          <button
                            onClick={() => {
                              setSelectedDate(null);
                              setSelectedDateEvents([]);
                            }}
                            className="text-[10px] text-[#6B7280] hover:text-[#111827] leading-tight"
                          >
                            ✕
                          </button>
                        </div>
                        {selectedDateEvents.length > 0 ? (
                          <div className="space-y-2">
                            {selectedDateEvents.map((event) => {
                              const isHoliday = event.createdBy === "시스템";
                              const member = isHoliday
                                ? { color: "#EF4444", initial: "공" }
                                : getMemberInfo(event.createdBy);
                              return (
                                <Link
                                  key={event.id}
                                  href="/calendar"
                                  className="flex items-start gap-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer"
                                >
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                    style={{ backgroundColor: member.color }}
                                  ></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <h3
                                        className={`text-xs font-semibold leading-tight ${
                                          isHoliday
                                            ? "text-[#EF4444]"
                                            : "text-[#111827]"
                                        }`}
                                      >
                                        {event.title}
                                      </h3>
                                    </div>
                                    {!isHoliday && "time" in event && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280] leading-tight">
                                        <span>{event.time}</span>
                                        {"location" in event &&
                                          event.location && (
                                            <>
                                              <span>•</span>
                                              <span className="truncate">
                                                {event.location}
                                              </span>
                                            </>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-[#9CA3AF] text-center py-4 leading-tight">
                            {selectedDate}일 일정이 없습니다
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        {todayEvents.length > 0 ? (
                          <div className="space-y-2">
                            {todayEvents.map((event) => {
                              const member = getMemberInfo(event.createdBy);
                              return (
                                <Link
                                  key={event.id}
                                  href="/calendar"
                                  className="flex items-start gap-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer"
                                >
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                    style={{ backgroundColor: member.color }}
                                  ></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <h3 className="text-xs font-semibold text-[#111827] leading-tight">
                                        {event.title}
                                      </h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280] leading-tight">
                                      <span>{event.time}</span>
                                      {event.location && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate">
                                            {event.location}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-[#9CA3AF] text-center py-4 leading-tight">
                            오늘 일정이 없습니다
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* 오른쪽: 작은 캘린더 */}
                  <div>
                    <MiniCalendar
                      events={allEvents}
                      onDateSelect={(date, dateEvents) => {
                        // 공휴일 포함해서 전달 (클릭했을 때는 공휴일도 표시)
                        setSelectedDate(date);
                        setSelectedDateEvents(dateEvents);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 진행 중 작업 */}
              <div className="bg-white rounded-lg border border-[#E5E7EB]">
                <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#111827] leading-tight">
                      진행 중 작업
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-tight">
                      총 {stats.activeTasks}개 작업
                    </p>
                  </div>
                  <Link
                    href="/tasks"
                    className="text-xs text-[#3B82F6] hover:underline font-medium leading-tight"
                  >
                    전체 보기 →
                  </Link>
                </div>
                <div className="p-4">
                  {activeTasks.length > 0 ? (
                    <div className="space-y-2">
                      {activeTasks.map((task) => {
                        const member = getMemberInfo(task.assignedTo);
                        return (
                          <Link
                            key={task.id}
                            href="/tasks"
                            className="flex items-start gap-3 p-2.5 bg-[#F9FAFB] rounded border border-[#E5E7EB] hover:border-[#2563EB] transition-colors cursor-pointer"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border-2"
                              style={{
                                backgroundColor:
                                  task.priority === "high"
                                    ? "#FEE2E2"
                                    : task.priority === "medium"
                                    ? "#FEF3C7"
                                    : "#F3F4F6",
                                borderColor:
                                  task.priority === "high"
                                    ? "#EF4444"
                                    : task.priority === "medium"
                                    ? "#F59E0B"
                                    : "#6B7280",
                              }}
                            >
                              {(() => {
                                // 작업 제목이나 카테고리에 따라 아이콘 결정
                                const title = task.title?.toLowerCase() || "";
                                const category =
                                  task.tags?.[0]?.toLowerCase() || "";

                                if (
                                  title.includes("대시") ||
                                  title.includes("dashboard") ||
                                  category.includes("대시")
                                ) {
                                  return (
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.5}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                                      />
                                    </svg>
                                  );
                                } else if (
                                  title.includes("인증") ||
                                  title.includes("auth") ||
                                  category.includes("인증")
                                ) {
                                  return (
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.5}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                                      />
                                    </svg>
                                  );
                                } else if (
                                  title.includes("일정") ||
                                  title.includes("schedule") ||
                                  title.includes("calendar") ||
                                  category.includes("일정")
                                ) {
                                  return (
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.5}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                      />
                                    </svg>
                                  );
                                } else if (
                                  title.includes("디자인") ||
                                  title.includes("design") ||
                                  category.includes("디자인")
                                ) {
                                  return (
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.5}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.648 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                                      />
                                    </svg>
                                  );
                                } else if (
                                  title.includes("개발") ||
                                  title.includes("dev") ||
                                  title.includes("code") ||
                                  category.includes("개발")
                                ) {
                                  return (
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.5}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                                      />
                                    </svg>
                                  );
                                } else {
                                  // 기본 아이콘 (체크리스트)
                                  return (
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.5}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                                      />
                                    </svg>
                                  );
                                }
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-sm font-semibold text-[#111827] leading-tight">
                                  {task.title}
                                </h3>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium leading-tight ${
                                    task.priority === "high"
                                      ? "bg-[#FEE2E2] text-[#EF4444]"
                                      : task.priority === "medium"
                                      ? "bg-[#FEF3C7] text-[#F59E0B]"
                                      : "bg-[#F3F4F6] text-[#6B7280]"
                                  }`}
                                >
                                  {task.priority === "high"
                                    ? "높음"
                                    : task.priority === "medium"
                                    ? "보통"
                                    : "낮음"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-[#6B7280] leading-tight">
                                <span>
                                  담당: {task.assignedTo} ({member.role})
                                </span>
                                <span>•</span>
                                <span>마감: {task.dueDate}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9CA3AF] text-center py-6 leading-tight">
                      진행 중인 작업이 없습니다
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 파일 & 활동 */}
            <div className="space-y-4">
              {/* 최근 파일 */}
              <div className="bg-white rounded-lg border border-[#E5E7EB]">
                <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#111827] leading-tight">
                      최근 파일
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-tight">
                      최근 업로드된 파일
                    </p>
                  </div>
                  <Link
                    href="/files"
                    className="text-xs text-[#3B82F6] hover:underline font-medium leading-tight"
                  >
                    전체 →
                  </Link>
                </div>
                <div className="p-4">
                  {recentFiles.length > 0 ? (
                    <div className="space-y-2">
                      {recentFiles.map((file) => (
                        <Link
                          key={file.id}
                          href="/files"
                          className="flex items-center gap-2.5 p-2 hover:bg-[#F9FAFB] rounded cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded bg-[#F3F4F6] flex items-center justify-center border border-[#E5E7EB] flex-shrink-0">
                            <span className="text-xs font-medium text-[#6B7280] leading-tight">
                              PDF
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-[#111827] truncate leading-tight">
                              {file.name}
                            </div>
                            <div className="text-xs text-[#6B7280] leading-tight">
                              {file.uploadedBy} • {file.date}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9CA3AF] text-center py-6 leading-tight">
                      최근 파일이 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* 최근 활동 */}
              <div className="bg-white rounded-lg border border-[#E5E7EB]">
                <div className="p-3 border-b border-[#E5E7EB]">
                  <h2 className="text-base font-semibold text-[#111827] leading-tight">
                    최근 활동
                  </h2>
                </div>
                <div className="p-3">
                  <div className="space-y-3">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => {
                        const member = getMemberInfo(activity.user);
                        return (
                          <div
                            key={activity.id}
                            className="flex items-start gap-2.5"
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                              style={{ backgroundColor: member.color }}
                            >
                              <span className="leading-none">
                                {member.initial}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-[#111827] leading-tight">
                                <span className="font-medium">
                                  {activity.user}
                                </span>
                                <span className="text-[#6B7280]">
                                  {" "}
                                  {activity.action}
                                </span>
                              </div>
                              <div className="text-xs text-[#9CA3AF] mt-0.5 leading-tight">
                                {formatActivityTime(activity.timestamp)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-[#9CA3AF] text-center py-4 leading-tight">
                        최근 활동이 없습니다
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
