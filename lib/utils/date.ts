// 날짜/시간 처리 유틸리티 함수

import type { Event } from "@/lib/types/event";

export interface DateInfo {
  date: number;
  month: number;
  year: number;
  fullDate: Date;
}

/**
 * 오늘 날짜 정보를 반환합니다.
 */
export function getToday(): DateInfo {
  const today = new Date();
  return {
    date: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear(),
    fullDate: today,
  };
}

/**
 * 이벤트가 오늘인지 확인합니다.
 */
export function isToday(event: Event): boolean {
  const today = getToday();
  const eventYear = event.year !== undefined ? event.year : today.year;
  const eventMonth = event.month !== undefined ? event.month : today.month;
  
  return (
    eventYear === today.year &&
    eventMonth === today.month &&
    event.date === today.date
  );
}

/**
 * 이벤트가 오늘 이후인지 확인합니다.
 */
export function isUpcoming(event: Event): boolean {
  const today = getToday();
  const eventYear = event.year !== undefined ? event.year : today.year;
  const eventMonth = event.month !== undefined ? event.month : today.month;
  
  // 같은 달이고 오늘 이후
  if (eventYear === today.year && eventMonth === today.month) {
    return event.date >= today.date;
  }
  
  // 미래 년도/월
  if (eventYear > today.year) return true;
  if (eventYear === today.year && eventMonth > today.month) return true;
  
  return false;
}

/**
 * 이벤트가 이번 주에 있는지 확인합니다.
 */
export function isThisWeek(event: Event): boolean {
  const today = getToday();
  const eventYear = event.year !== undefined ? event.year : today.year;
  const eventMonth = event.month !== undefined ? event.month : today.month;
  
  const eventDate = new Date(eventYear, eventMonth, event.date);
  const weekStart = new Date(today.fullDate);
  weekStart.setDate(today.date - today.fullDate.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return eventDate >= weekStart && eventDate <= weekEnd;
}

/**
 * 이벤트 날짜를 Date 객체로 변환합니다.
 */
export function getEventDate(event: Event): Date {
  const today = getToday();
  const eventYear = event.year !== undefined ? event.year : today.year;
  const eventMonth = event.month !== undefined ? event.month : today.month;
  return new Date(eventYear, eventMonth, event.date);
}

/**
 * 날짜 범위에 있는 이벤트를 필터링합니다.
 */
export function filterEventsByDateRange(
  events: Event[],
  startDate: Date,
  endDate: Date
): Event[] {
  return events.filter((event) => {
    const eventDate = getEventDate(event);
    return eventDate >= startDate && eventDate <= endDate;
  });
}

/**
 * 오늘의 이벤트를 필터링합니다.
 */
export function filterTodayEvents(events: Event[]): Event[] {
  return events.filter(isToday);
}

/**
 * 다가오는 이벤트를 필터링합니다 (오늘 포함).
 */
export function filterUpcomingEvents(events: Event[]): Event[] {
  return events.filter(isUpcoming);
}

/**
 * 이번 주의 이벤트를 필터링합니다.
 */
export function filterThisWeekEvents(events: Event[]): Event[] {
  return events.filter(isThisWeek);
}

