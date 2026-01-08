"use client";

import { useState } from "react";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import type { Event, Holiday } from "@/lib/types/event";

interface MiniCalendarProps {
  events: (Event | Holiday)[];
  onDateSelect: (date: number, dateEvents: (Event | Holiday)[]) => void;
}

export default function MiniCalendar({
  events,
  onDateSelect,
}: MiniCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const currentDate = today.getDate();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  const initializeHolidays = (): Holiday[] => {
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

    const year2026Holidays = [
      { title: "설날", date: 17, month: 1, year: 2026 },
      { title: "석가탄신일", date: 24, month: 4, year: 2026 },
      { title: "추석", date: 25, month: 8, year: 2026 },
    ];

    const allHolidays: Holiday[] = [];
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

  const isTodayDate = (date: number) => {
    return date === currentDate && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const handleDateClick = (date: number) => {
    const dateEvents = getEventsForDate(date);
    const dateHolidays = getHolidaysForDate(date);
    const allDateItems = [...dateHolidays, ...dateEvents];
    setSelectedDate(date === selectedDate ? null : date);
    onDateSelect(date, allDateItems);
  };

  return (
    <div className="bg-white">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-[#111827]">
          {currentYear}년 {monthNames[currentMonth]}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth("prev")}
            className="p-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded"
          >
            ‹
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-0.5 text-xs text-[#3B82F6] hover:bg-[#EFF6FF] rounded font-medium"
          >
            오늘
          </button>
          <button
            onClick={() => changeMonth("next")}
            className="p-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded"
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`text-center text-[10px] font-bold py-1 ${
              index === 0 ? "text-[#EF4444]" : index === 6 ? "text-[#3B82F6]" : "text-[#6B7280]"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (date === null) return <div key={`empty-${index}`} className="aspect-square bg-[#FAFAFA] rounded" />;

          const dateEvents = getEventsForDate(date);
          const dateHolidays = getHolidaysForDate(date);
          const allDateItems = [...dateHolidays, ...dateEvents];
          const isCurrentToday = isTodayDate(date);
          const isSelected = selectedDate === date;

          const dateObj = new Date(currentYear, currentMonth, date);
          const isSunday = dateObj.getDay() === 0;
          const hasHoliday = dateHolidays.length > 0;

          return (
            <div
              key={date}
              onClick={() => handleDateClick(date)}
              className={`aspect-square rounded flex flex-col items-center justify-center cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#3B82F6] shadow-sm scale-105 z-10"
                  : isCurrentToday
                  ? "bg-[#DBEAFE] border border-[#2563EB]"
                  : "bg-white border border-[#E5E7EB] hover:border-[#CBD5E0]"
              }`}
            >
              <span
                className={`text-[10px] font-bold ${
                  isSelected ? "text-white" : isCurrentToday ? "text-[#3B82F6]" : isSunday || hasHoliday ? "text-[#EF4444]" : "text-[#111827]"
                }`}
              >
                {date}
              </span>
              {allDateItems.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {allDateItems.slice(0, 2).map((item, idx) => {
                    const isSystem = item.createdBy === "시스템";
                    const member = isSystem ? { color: "#EF4444" } : TEAM_MEMBERS[item.createdBy as keyof typeof TEAM_MEMBERS] || { color: "#3B82F6" };
                    return (
                      <div
                        key={idx}
                        className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : ""}`}
                        style={isSelected ? {} : { backgroundColor: member.color }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
