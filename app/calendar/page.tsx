"use client";

import { useState, useEffect } from "react";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import { addActivityLog } from "@/lib/utils/activityLog";
import {
  isBookmarked,
  addBookmark,
  removeBookmark,
} from "@/lib/utils/bookmarks";
import { exportEventsToICal } from "@/lib/utils/export";
import {
  deleteEvent,
  toggleEventParticipation,
} from "@/lib/utils/event";
import { useUser } from "@/lib/context/UserContext";
import { useData } from "@/lib/context/DataContext";
import { useToast } from "@/lib/context/ToastContext";
import type { Event } from "@/lib/types/event";

export default function CalendarPage() {
  const { user, canModify } = useUser();
  const { events, setEvents, refreshEvents } = useData();
  const { showToast } = useToast();
  const currentUser = user?.name || "김찬주";
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const currentDate = today.getDate();

  const [holidays, setHolidays] = useState<Event[]>([]); // 공휴일은 별도 관리
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterBy, setFilterBy] = useState<string>("전체");
  const [selectedDate, setSelectedDate] = useState<number | null>(currentDate);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // 선택된 일정 (상세 모달용)
  const [isEditingEvent, setIsEditingEvent] = useState(false); // 일정 수정 모드
  const [editEvent, setEditEvent] = useState<Event | null>(null); // 수정 중인 일정

  // 작성자 확인 함수
  const isCreator = (event: Event) => {
    return event.createdBy === currentUser;
  };
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: currentDate,
    time: "09:00",
    location: "",
    description: "",
    repeat: "none" as "none" | "daily" | "weekly" | "monthly",
    repeatEndDate: "",
  });
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");

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
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // 반복 일정 생성
  const generateRepeatEvents = (event: Event): Event[] => {
    if (event.repeat === "none" || !event.repeatEndDate) {
      return [event];
    }

    const events: Event[] = [event];
    const startDate = new Date(currentYear, currentMonth, event.date);
    const endDate = new Date(event.repeatEndDate);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (currentDate.getTime() === startDate.getTime()) {
        currentDate = new Date(currentDate);
        if (event.repeat === "daily") {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (event.repeat === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (event.repeat === "monthly") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        continue;
      }

      const newEvent: Event = {
        ...event,
        id: `${event.id}-${currentDate.getTime()}`,
        date: currentDate.getDate(),
      };
      events.push(newEvent);

      if (event.repeat === "daily") {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (event.repeat === "weekly") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (event.repeat === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return events;
  };

  // 2026년 한국 공휴일 초기화 (일정으로 저장하지 않고 별도 관리)
  const initializeHolidays2026 = (): Event[] => {
    const allHolidays: Event[] = [];
    const year = 2026;

    // 1월 (0-based: 0)
    allHolidays.push({
      id: "holiday-2026-1-1",
      title: "신정",
      date: 1,
      time: "00:00",
      type: "holiday",
      createdBy: "시스템",
      year,
      month: 0,
      isBookmarked: false,
    });

    // 2월 (0-based: 1) - 설날
    allHolidays.push({
      id: "holiday-2026-2-17",
      title: "설날",
      date: 17,
      time: "00:00",
      type: "holiday",
      createdBy: "시스템",
      year,
      month: 1,
      isBookmarked: false,
    });

    // 3월 (0-based: 2)
    allHolidays.push({
      id: "holiday-2026-3-1",
      title: "3·1절",
      date: 1,
      time: "00:00",
      type: "holiday",
      createdBy: "시스템",
      year,
      month: 2,
      isBookmarked: false,
    });

    // 5월 (0-based: 4)
    allHolidays.push(
      {
        id: "holiday-2026-5-5",
        title: "어린이날",
        date: 5,
        time: "00:00",
        type: "holiday",
        createdBy: "시스템",
        year,
        month: 4,
        isBookmarked: false,
      },
      {
        id: "holiday-2026-5-24",
        title: "석가탄신일",
        date: 24,
        time: "00:00",
        type: "holiday",
        createdBy: "시스템",
        year,
        month: 4,
        isBookmarked: false,
      }
    );

    // 6월 (0-based: 5)
    allHolidays.push({
      id: "holiday-2026-6-6",
      title: "현충일",
      date: 6,
      time: "00:00",
      type: "holiday",
      createdBy: "시스템",
      year,
      month: 5,
      isBookmarked: false,
    });

    // 8월 (0-based: 7)
    allHolidays.push({
      id: "holiday-2026-8-15",
      title: "광복절",
      date: 15,
      time: "00:00",
      type: "holiday",
      createdBy: "시스템",
      year,
      month: 7,
      isBookmarked: false,
    });

    // 9월 (0-based: 8) - 추석
    allHolidays.push({
      id: "holiday-2026-9-25",
      title: "추석",
      date: 25,
      time: "00:00",
      type: "holiday",
      createdBy: "시스템",
      year,
      month: 8,
      isBookmarked: false,
    });

    // 10월 (0-based: 9)
    allHolidays.push(
      {
        id: "holiday-2026-10-3",
        title: "개천절",
        date: 3,
        time: "00:00",
        type: "holiday",
        createdBy: "시스템",
        year,
        month: 9,
        isBookmarked: false,
      },
      {
        id: "holiday-2026-10-9",
        title: "한글날",
        date: 9,
        time: "00:00",
        type: "holiday",
        createdBy: "시스템",
        year,
        month: 9,
        isBookmarked: false,
      }
    );

    // 12월 (0-based: 11)
    allHolidays.push({
      id: "holiday-2026-12-25",
      title: "성탄절",
      date: 25,
      time: "00:00",
      type: "holiday",
      createdBy: "시스템",
      year,
      month: 11,
      isBookmarked: false,
    });

    return allHolidays;
  };

  // 공휴일 로드
  useEffect(() => {
    const holidays = initializeHolidays2026();
    setHolidays(holidays);
    refreshEvents(); // 마운트 시 최신 데이터 확인
  }, [refreshEvents]);

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      showToast("일정 제목을 입력해주세요.", "warning");
      return;
    }

    const baseEvent: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      type: "meeting",
      createdBy: currentUser,
      location: newEvent.location,
      repeat: newEvent.repeat,
      repeatEndDate: newEvent.repeatEndDate || undefined,
      isBookmarked: false,
      year: currentYear,
      month: currentMonth,
    };

    // 반복 일정 생성
    const generatedEvents = generateRepeatEvents(baseEvent);

    try {
      // 로컬 상태 즉시 업데이트 (UI 반응성)
      setEvents((prev) => [...prev, ...generatedEvents]);
      
      // Supabase 또는 localStorage에 저장
      await Promise.all(generatedEvents.map((e) => saveEvent(e)));
      
      showToast("일정이 추가되었습니다.", "success");
    } catch (e) {
      refreshEvents(); // 에러 시 복구
      showToast("일정 저장에 실패했습니다.", "error");
    }

    setNewEvent({
      title: "",
      date: currentDate,
      time: "09:00",
      location: "",
      description: "",
      repeat: "none",
      repeatEndDate: "",
    });
    setSelectedHour("09");
    setSelectedMinute("00");
    setShowAddForm(false);
    setSelectedDate(null);
  };

  // 북마크 토글
  const handleToggleBookmark = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    if (isBookmarked("event", eventId)) {
      removeBookmark("event", eventId);
    } else {
      addBookmark("event", eventId);
    }

    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, isBookmarked: !e.isBookmarked } : e
    );
    setEvents(updatedEvents);
    // 북마크는 로컬 상태만 업데이트 (북마크는 localStorage에 저장)
    updateLocalEvents(updatedEvents);
  };

  // 날짜 클릭 시 일정 추가 폼 표시
  const handleDateClick = (date: number) => {
    setSelectedDate(date);
    setSelectedHour("09");
    setSelectedMinute("00");
    setNewEvent({ ...newEvent, date, time: "09:00", description: "" });
    setShowAddForm(true);
  };

  // 일정 완료 상태 토글
  const handleToggleCompleted = async (event: Event) => {
    try {
      const updatedEvent: Event = {
        ...event,
        completed: !event.completed,
      };

      // Supabase 또는 localStorage에 저장
      await saveEvent(updatedEvent);

      // 로컬 상태 업데이트
      const updatedEvents = events.map((e) =>
        e.id === event.id ? updatedEvent : e
      );
      updateLocalEvents(updatedEvents);

      // 선택된 이벤트가 있다면 업데이트
      if (selectedEvent && selectedEvent.id === event.id) {
        setSelectedEvent(updatedEvent);
      }

      // 활동 로그 추가
      addActivityLog({
        type: "event",
        action: updatedEvent.completed
          ? "일정을 완료 처리했습니다"
          : "일정 완료를 취소했습니다",
        user: currentUser,
        targetId: event.id,
        targetTitle: event.title,
      });
    } catch (error) {
      console.error("완료 상태 변경 실패:", error);
      alert("완료 상태 변경에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 일정 삭제
  const handleDeleteEvent = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event) return;

    // 작성자 또는 관리자 확인
    if (!canModify(event.createdBy)) {
      alert("작성자 또는 관리자만 삭제할 수 있습니다.");
      return;
    }

    if (confirm("일정을 삭제하시겠습니까?")) {
      // 활동 로그 추가
      addActivityLog({
        type: "event",
        action: "일정을 삭제했습니다",
        user: currentUser,
        targetId: id,
        targetTitle: event.title,
      });

      // Supabase 또는 localStorage에서 삭제
      await deleteEvent(id);

      // 로컬 상태 업데이트
      updateLocalEvents(events.filter((e) => e.id !== id));
    }
  };

  // 해당 월의 첫 날과 마지막 날
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // 월 변경 함수
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

  const changeYear = (direction: "prev" | "next") => {
    setCurrentYear(direction === "prev" ? currentYear - 1 : currentYear + 1);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const getEventsForDate = (date: number) => {
    // 현재 선택된 월/년도의 일정만 필터링
    let filtered = events.filter((e) => {
      if (e.date !== date) return false;
      // year와 month가 있으면 정확히 매칭, 없으면 현재 월/년도로 간주
      if (e.year !== undefined && e.month !== undefined) {
        return e.year === currentYear && e.month === currentMonth;
      }
      // 기존 데이터 호환성: year/month가 없으면 현재 월/년도로 간주
      return true;
    });

    if (filterBy !== "전체") {
      filtered = filtered.filter((e) => e.createdBy === filterBy);
    }
    return filtered;
  };

  // 공휴일 가져오기 (캘린더 표시용)
  const getHolidaysForDate = (date: number) => {
    return holidays.filter((h) => {
      if (h.date !== date) return false;
      if (h.year !== undefined && h.month !== undefined) {
        return h.year === currentYear && h.month === currentMonth;
      }
      return true;
    });
  };

  const getAllEvents = () => {
    if (filterBy === "전체") {
      return events;
    }
    return events.filter((e) => e.createdBy === filterBy);
  };

  const isToday = (date: number) => {
    return (
      date === currentDate &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // 빈 칸 생성
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-[#111827] leading-tight">
                  일정룸
                </h1>
                <p className="text-xs text-[#6B7280] mt-1 leading-tight">
                  {currentYear}년 {monthNames[currentMonth]}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeYear("prev")}
                  className="px-2 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded transition-colors"
                  title="이전 년도"
                >
                  ««
                </button>
                <button
                  onClick={() => changeMonth("prev")}
                  className="px-2 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded transition-colors"
                  title="이전 월"
                >
                  ‹
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-xs text-[#3B82F6] hover:bg-[#EFF6FF] rounded transition-colors font-medium"
                  title="오늘로 이동"
                >
                  오늘
                </button>
                <button
                  onClick={() => changeMonth("next")}
                  className="px-2 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded transition-colors"
                  title="다음 월"
                >
                  ›
                </button>
                <button
                  onClick={() => changeYear("next")}
                  className="px-2 py-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded transition-colors"
                  title="다음 년도"
                >
                  »»
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportEventsToICal(events)}
                className="px-3 py-1.5 border border-[#E5E7EB] text-[#6B7280] text-sm font-medium rounded-md hover:bg-[#F9FAFB] transition-colors leading-tight"
                title="iCal 내보내기"
              >
                내보내기
              </button>
              <button
                onClick={() => {
                  const todayDate = new Date();
                  const dateToUse =
                    currentYear === todayDate.getFullYear() &&
                    currentMonth === todayDate.getMonth()
                      ? currentDate
                      : 1; // 다른 월이면 1일로 설정
                  setSelectedDate(dateToUse);
                  setSelectedHour("09");
                  setSelectedMinute("00");
                  setNewEvent({
                    ...newEvent,
                    date: dateToUse,
                    time: "09:00",
                    description: "",
                  });
                  setShowAddForm(true);
                }}
                className="px-3.5 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded-md hover:bg-[#60A5FA] transition-colors leading-tight"
              >
                일정 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 필터 */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilterBy("전체")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                filterBy === "전체"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              전체
            </button>
            {Object.values(TEAM_MEMBERS).map((member) => (
              <button
                key={member.name}
                onClick={() => setFilterBy(member.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                  filterBy === member.name
                    ? "bg-[#3B82F6] text-white"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
                style={
                  filterBy === member.name
                    ? { backgroundColor: member.color }
                    : {}
                }
              >
                {member.name} ({member.role})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 캘린더 뷰 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 일정 추가 폼 */}
              {showAddForm && (
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-[#111827] leading-tight">
                      일정 추가
                    </h2>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedDate(null);
                        setNewEvent({
                          title: "",
                          date: currentDate,
                          time: "09:00",
                          location: "",
                          description: "",
                          repeat: "none",
                          repeatEndDate: "",
                        });
                        setSelectedHour("09");
                        setSelectedMinute("00");
                      }}
                      className="text-[#6B7280] hover:text-[#111827] text-lg"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#111827] mb-1">
                        제목
                      </label>
                      <input
                        type="text"
                        value={newEvent.title}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        placeholder="일정 제목"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#111827] mb-1">
                        날짜
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max={daysInMonth}
                          value={newEvent.date}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              date: parseInt(e.target.value) || 1,
                            })
                          }
                          className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                        <span className="flex items-center text-xs text-[#6B7280]">
                          일
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#111827] mb-1">
                        시간
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedHour}
                          onChange={(e) => {
                            const hour = e.target.value;
                            setSelectedHour(hour);
                            setNewEvent({
                              ...newEvent,
                              time: `${hour}:${selectedMinute}`,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, "0");
                            return (
                              <option key={hour} value={hour}>
                                {hour}시
                              </option>
                            );
                          })}
                        </select>
                        <select
                          value={selectedMinute}
                          onChange={(e) => {
                            const minute = e.target.value;
                            setSelectedMinute(minute);
                            setNewEvent({
                              ...newEvent,
                              time: `${selectedHour}:${minute}`,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        >
                          {Array.from({ length: 6 }, (_, i) => {
                            const minute = (i * 10).toString().padStart(2, "0");
                            return (
                              <option key={minute} value={minute}>
                                {minute}분
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#111827] mb-1">
                        장소 (선택)
                      </label>
                      <input
                        type="text"
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        placeholder="장소"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-[#111827] mb-1">
                        상세 내용 (선택)
                      </label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                        placeholder="일정에 대한 상세 내용을 입력하세요"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#111827] mb-1">
                        반복
                      </label>
                      <select
                        value={newEvent.repeat}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            repeat: e.target.value as
                              | "none"
                              | "daily"
                              | "weekly"
                              | "monthly",
                          })
                        }
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        <option value="none">반복 없음</option>
                        <option value="daily">매일</option>
                        <option value="weekly">매주</option>
                        <option value="monthly">매월</option>
                      </select>
                    </div>
                    {newEvent.repeat !== "none" && (
                      <div>
                        <label className="block text-xs font-medium text-[#111827] mb-1">
                          반복 종료일
                        </label>
                        <input
                          type="date"
                          value={newEvent.repeatEndDate}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              repeatEndDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedDate(null);
                        setNewEvent({
                          title: "",
                          date: currentDate,
                          time: "09:00",
                          location: "",
                          description: "",
                          repeat: "none",
                          repeatEndDate: "",
                        });
                        setSelectedHour("09");
                        setSelectedMinute("00");
                      }}
                      className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-md text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB]"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddEvent}
                      className="flex-1 px-4 py-2 bg-[#3B82F6] text-white rounded-md text-sm font-medium hover:bg-[#60A5FA]"
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 border-b border-[#E5E7EB]">
                  {dayNames.map((day, index) => (
                    <div
                      key={day}
                      className={`p-2.5 text-center text-xs font-semibold leading-tight ${
                        index === 0
                          ? "text-[#EF4444]"
                          : index === 6
                          ? "text-[#3B82F6]"
                          : "text-[#111827]"
                      } bg-[#F9FAFB] border-r border-[#E5E7EB] last:border-r-0`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((date, index) => {
                    if (date === null) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="min-h-[100px] border-r border-b border-[#E5E7EB] bg-[#FAFAFA]"
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
                        className={`min-h-[100px] border-r border-b border-[#E5E7EB] p-1.5 cursor-pointer transition-colors ${
                          isTodayDate
                            ? "bg-[#DBEAFE]"
                            : isSelected
                            ? "bg-[#E0E7FF]"
                            : "bg-white"
                        } hover:bg-[#F9FAFB] ${
                          isSelected ? "ring-2 ring-[#2563EB]" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-semibold leading-tight ${
                              isTodayDate
                                ? "text-[#3B82F6] bg-white px-1.5 py-0.5 rounded"
                                : isSunday || hasHoliday
                                ? "text-[#EF4444]"
                                : "text-[#111827]"
                            }`}
                          >
                            {date}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {allDateItems.slice(0, 2).map((item) => {
                            const isHoliday = item.createdBy === "시스템";
                            const memberColor = isHoliday
                              ? "#EF4444" // 공휴일은 빨간색
                              : TEAM_MEMBERS[
                                  item.createdBy as keyof typeof TEAM_MEMBERS
                                ]?.color || "#2563EB";
                            const hoverColor = isHoliday
                              ? "#DC2626"
                              : memberColor === "#2563EB"
                              ? "#1D4ED8"
                              : memberColor === "#10B981"
                              ? "#059669"
                              : memberColor === "#F59E0B"
                              ? "#D97706"
                              : memberColor === "#A855F7"
                              ? "#9333EA"
                              : "#1D4ED8";
                            return (
                              <div
                                key={item.id}
                                className="text-xs px-1.5 py-0.5 rounded text-white truncate cursor-pointer leading-tight group relative flex items-center gap-1"
                                style={{ backgroundColor: memberColor }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    hoverColor;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    memberColor;
                                }}
                                onClick={(e) => {
                                  if (!isHoliday) {
                                    e.stopPropagation();
                                    setSelectedEvent(item);
                                  }
                                }}
                                title={
                                  isHoliday
                                    ? item.title
                                    : `${item.time} ${item.title}`
                                }
                              >
                                {!isHoliday && item.isBookmarked && (
                                  <span className="text-[#F59E0B] flex-shrink-0">
                                    ⭐
                                  </span>
                                )}
                                <span
                                  className={`truncate flex-1 ${
                                    !isHoliday && item.completed
                                      ? "line-through opacity-60"
                                      : ""
                                  }`}
                                >
                                  {isHoliday ? "" : `${item.time} `}
                                  {item.title}
                                </span>
                                {!isHoliday && item.completed && (
                                  <span className="text-[#10B981] flex-shrink-0 ml-1">
                                    ✓
                                  </span>
                                )}
                                {!isHoliday && canModify(item.createdBy) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(item.id);
                                    }}
                                    className="hidden group-hover:inline-block ml-1 text-white hover:text-red-200 flex-shrink-0"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {allDateItems.length > 2 && (
                            <div className="text-xs text-[#6B7280] px-1.5 leading-tight">
                              +{allDateItems.length - 2}개
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 일정 목록 */}
            <div className="space-y-3">
              {/* 오늘 일정 */}
              <div className="bg-white rounded-lg border border-[#E5E7EB]">
                <div className="p-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <h2 className="text-xs font-semibold text-[#111827] leading-tight">
                    오늘 일정
                  </h2>
                </div>
                <div className="p-3 space-y-2">
                  {getEventsForDate(currentDate).length > 0 ? (
                    getEventsForDate(currentDate).map((event) => {
                      const memberColor =
                        TEAM_MEMBERS[
                          event.createdBy as keyof typeof TEAM_MEMBERS
                        ]?.color || "#2563EB";
                      return (
                        <div
                          key={event.id}
                          className="p-2.5 bg-[#F9FAFB] rounded border-l-4"
                          style={{
                            borderLeftColor: memberColor,
                            borderTopColor: "#E5E7EB",
                            borderRightColor: "#E5E7EB",
                            borderBottomColor: "#E5E7EB",
                          }}
                        >
                          <div className="flex items-start justify-between mb-0.5">
                            <h3
                              className={`text-xs font-medium text-[#111827] leading-tight ${
                                event.completed
                                  ? "line-through text-gray-400"
                                  : ""
                              }`}
                            >
                              {event.title}
                            </h3>
                            {event.completed && (
                              <span className="text-[#10B981] text-xs ml-1">
                                ✓
                              </span>
                            )}
                            {canModify(event.createdBy) && (
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-[#6B7280] hover:text-[#EF4444] text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7280] leading-tight">
                            {event.time}
                            {event.location && ` • ${event.location}`}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-[#9CA3AF] text-center py-3 leading-tight">
                      오늘 일정이 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* 이번 주 일정 */}
              <div className="bg-white rounded-lg border border-[#E5E7EB]">
                <div className="p-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <h2 className="text-xs font-semibold text-[#111827] leading-tight">
                    이번 주 일정
                  </h2>
                </div>
                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {getAllEvents().map((event) => {
                    const memberColor =
                      TEAM_MEMBERS[event.createdBy as keyof typeof TEAM_MEMBERS]
                        ?.color || "#2563EB";
                    return (
                      <div
                        key={event.id}
                        className="p-2.5 bg-[#F9FAFB] rounded border-l-4 transition-colors cursor-pointer group"
                        style={{
                          borderLeftColor: memberColor,
                          borderTopColor: "#E5E7EB",
                          borderRightColor: "#E5E7EB",
                          borderBottomColor: "#E5E7EB",
                        }}
                        onClick={() => setSelectedEvent(event)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderLeftColor = memberColor;
                          e.currentTarget.style.borderTopColor = memberColor;
                          e.currentTarget.style.borderRightColor = memberColor;
                          e.currentTarget.style.borderBottomColor = memberColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderLeftColor = memberColor;
                          e.currentTarget.style.borderTopColor = "#E5E7EB";
                          e.currentTarget.style.borderRightColor = "#E5E7EB";
                          e.currentTarget.style.borderBottomColor = "#E5E7EB";
                        }}
                      >
                        <div className="flex items-start justify-between mb-0.5">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {event.isBookmarked && (
                              <span className="text-[#F59E0B] text-xs flex-shrink-0">
                                ⭐
                              </span>
                            )}
                            <h3 className="text-xs font-medium text-[#111827] leading-tight truncate">
                              {event.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(event.id);
                              }}
                              className={`text-xs transition-colors ${
                                event.isBookmarked
                                  ? "text-[#F59E0B]"
                                  : "text-[#6B7280] hover:text-[#F59E0B]"
                              }`}
                              title={
                                event.isBookmarked
                                  ? "북마크 제거"
                                  : "북마크 추가"
                              }
                            >
                              ⭐
                            </button>
                            {canModify(event.createdBy) && (
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-[#6B7280] hover:text-[#EF4444] text-xs"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#6B7280] leading-tight">
                          <span>{event.date}일</span>
                          <span>•</span>
                          <span>{event.time}</span>
                          {event.location && (
                            <>
                              <span>•</span>
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 일정 상세 모달 */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h2
                    className={`text-lg font-semibold text-gray-900 pr-2 ${
                      selectedEvent.completed
                        ? "line-through text-gray-400"
                        : ""
                    }`}
                  >
                    {selectedEvent.title}
                  </h2>
                  {selectedEvent.completed && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      완료
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {currentYear}년 {monthNames[currentMonth]}{" "}
                      {selectedEvent.date}일
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{selectedEvent.time}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{selectedEvent.createdBy}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 본문 */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {/* 수정 모드 */}
              {isEditingEvent && editEvent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      제목
                    </label>
                    <input
                      type="text"
                      value={editEvent.title}
                      onChange={(e) =>
                        setEditEvent({ ...editEvent, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        날짜
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={daysInMonth}
                        value={editEvent.date}
                        onChange={(e) =>
                          setEditEvent({
                            ...editEvent,
                            date: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        시간
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={editEvent.time.split(":")[0]}
                          onChange={(e) => {
                            const hour = e.target.value;
                            const minute = editEvent.time.split(":")[1];
                            setEditEvent({
                              ...editEvent,
                              time: `${hour}:${minute}`,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, "0");
                            return (
                              <option key={hour} value={hour}>
                                {hour}시
                              </option>
                            );
                          })}
                        </select>
                        <select
                          value={editEvent.time.split(":")[1]}
                          onChange={(e) => {
                            const minute = e.target.value;
                            const hour = editEvent.time.split(":")[0];
                            setEditEvent({
                              ...editEvent,
                              time: `${hour}:${minute}`,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 6 }, (_, i) => {
                            const minute = (i * 10).toString().padStart(2, "0");
                            return (
                              <option key={minute} value={minute}>
                                {minute}분
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      장소 (선택)
                    </label>
                    <input
                      type="text"
                      value={editEvent.location || ""}
                      onChange={(e) =>
                        setEditEvent({ ...editEvent, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="장소"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      상세 내용
                    </label>
                    <textarea
                      value={editEvent.description || ""}
                      onChange={(e) =>
                        setEditEvent({
                          ...editEvent,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="일정에 대한 상세 내용을 입력하세요"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2 pb-2 border-t border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editEvent.completed || false}
                        onChange={(e) =>
                          setEditEvent({
                            ...editEvent,
                            completed: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        완료 처리
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={async () => {
                        await saveEvent(editEvent);
                        setSelectedEvent(editEvent);
                        setIsEditingEvent(false);
                        setEditEvent(null);
                        // 이벤트 목록 새로고침 (강제 새로고침)
                        const loadedEvents = await getEvents(true);
                        const userEvents = loadedEvents.filter(
                          (e: Event) => e.createdBy !== "시스템"
                        );
                        const eventsWithBookmarks = userEvents.map(
                          (event: Event) => ({
                            ...event,
                            isBookmarked: isBookmarked("event", event.id),
                            participants: event.participants || [],
                            description: event.description || undefined,
                          })
                        );
                        setEvents(eventsWithBookmarks);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingEvent(false);
                        setEditEvent(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 완료 체크박스 */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedEvent.completed || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleCompleted(selectedEvent);
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          완료 처리
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          일정이 완료되었는지 표시합니다
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 상세 내용 */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      상세 내용
                    </h3>
                    {selectedEvent.description ? (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg">
                        {selectedEvent.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        상세 내용이 없습니다
                      </p>
                    )}
                  </div>

                  {/* 참여자 섹션 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        참여자{" "}
                        <span className="text-gray-500 font-normal">
                          ({selectedEvent.participants?.length || 0})
                        </span>
                      </h3>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const updatedEvent = await toggleEventParticipation(
                              selectedEvent.id,
                              currentUser
                            );
                            if (updatedEvent) {
                              setSelectedEvent(updatedEvent);
                              // 이벤트 목록도 업데이트
                              const updatedEvents = events.map((e) =>
                                e.id === updatedEvent.id ? updatedEvent : e
                              );
                              setEvents(updatedEvents);
                            }
                          } catch (error) {
                            console.error("참여하기 실패:", error);
                            alert(
                              "참여하기에 실패했습니다. 다시 시도해주세요."
                            );
                          }
                        }}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          selectedEvent.participants?.includes(currentUser)
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        }`}
                      >
                        {selectedEvent.participants?.includes(currentUser)
                          ? "참여 취소"
                          : "참여하기"}
                      </button>
                    </div>

                    {selectedEvent.participants &&
                    selectedEvent.participants.length > 0 ? (
                      <div className="space-y-2">
                        {selectedEvent.participants.map((participant) => {
                          const member =
                            TEAM_MEMBERS[
                              participant as keyof typeof TEAM_MEMBERS
                            ];
                          return (
                            <div
                              key={participant}
                              className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                                style={{
                                  backgroundColor: member?.color || "#6B7280",
                                }}
                              >
                                {member?.initial || participant[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">
                                  {participant}
                                </div>
                                {member && (
                                  <div className="text-xs text-gray-500">
                                    {member.role}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-gray-400">
                        아직 참여자가 없습니다
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 푸터 */}
            {!isEditingEvent && (
              <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
                {canModify(selectedEvent.createdBy) && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingEvent(true);
                        setEditEvent({ ...selectedEvent });
                      }}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("일정을 삭제하시겠습니까?")) {
                          await handleDeleteEvent(selectedEvent.id);
                          setSelectedEvent(null);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setIsEditingEvent(false);
                    setEditEvent(null);
                  }}
                  className="ml-auto px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
