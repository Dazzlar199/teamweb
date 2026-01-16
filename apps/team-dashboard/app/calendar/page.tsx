"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TEAM_MEMBERS, TEAM_MEMBER_NAMES } from "@/lib/constants/team";
import { useUser } from "@/lib/context/UserContext";
import { useData } from "@/lib/context/DataContext";
import { useToast } from "@/lib/context/ToastContext";
import { saveEvent, deleteEvent, toggleEventParticipation } from "@/lib/utils/event";
import type { Event, Holiday } from "@/lib/types/event";

const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const { user } = useUser();
  const { events, setEvents, refreshEvents } = useData();
  const { showToast } = useToast();
  const currentUser = user?.name || TEAM_MEMBER_NAMES[0];
  
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number>(todayDate);
  const [viewEvent, setViewEvent] = useState<Event | Holiday | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: todayDate,
    time: "09:00",
    location: "",
    description: "",
  });

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    // 월이 변경되었을 때, 선택된 날짜가 해당 월의 마지막 날보다 크면 마지막 날로 조정
    const daysInNewMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (selectedDate > daysInNewMonth) {
      // 상태 업데이트를 비동기로 예약하거나, 렌더링 중에 값을 조정하는 대신
      // 월 변경 핸들러에서 처리하는 것이 좋지만, 여기서는 안전하게 조건부로만 실행
      // setTimeout을 사용하여 렌더링 사이클 이후에 실행되도록 함
      const timer = setTimeout(() => setSelectedDate(daysInNewMonth), 0);
      return () => clearTimeout(timer);
    }
  }, [currentYear, currentMonth, selectedDate]);

  const thisMonthEvents = useMemo(() => {
    return events.filter(e => e.month === currentMonth && e.year === currentYear)
                 .sort((a, b) => {
                   if (a.date !== b.date) return a.date - b.date;
                   const timeA = 'time' in a ? a.time : "";
                   const timeB = 'time' in b ? b.time : "";
                   return timeA.localeCompare(timeB);
                 });
  }, [events, currentMonth, currentYear]);

  const selectedDayEvents = useMemo(() => {
    return thisMonthEvents.filter(e => e.date === selectedDate);
  }, [thisMonthEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    return thisMonthEvents.filter(e => {
      // 현재 보고 있는 달이 오늘이 포함된 달보다 미래인 경우
      if (currentYear > todayYear) return true;
      if (currentYear < todayYear) return false;
      if (currentMonth > todayMonth) return true;
      if (currentMonth < todayMonth) return false;
      
      // 같은 달인 경우 오늘 날짜 이후만 표시
      return e.date >= todayDate;
    });
  }, [thisMonthEvents, currentYear, currentMonth, todayYear, todayMonth, todayDate]);

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      showToast("제목을 입력해주세요.", "warning");
      return;
    }

    if (isNaN(newEvent.date) || newEvent.date < 1 || newEvent.date > 31) {
      showToast("올바른 날짜를 입력해주세요.", "warning");
      return;
    }

    const event: Event = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      type: "meeting",
      createdBy: currentUser,
      location: newEvent.location,
      description: newEvent.description,
      participants: [currentUser],
      year: currentYear,
      month: currentMonth,
      isBookmarked: false,
    };

    try {
      setEvents((prev) => [...prev, event]);
      await saveEvent(event);
      showToast("일정이 등록되었습니다.", "success");
      setShowAddForm(false);
      setNewEvent({ title: "", date: selectedDate, time: "09:00", location: "", description: "" });
    } catch (e) {
      showToast("저장 실패", "error");
      refreshEvents();
    }
  };

  const handleToggleParticipation = async (eventId: string) => {
    try {
      const updatedEvent = await toggleEventParticipation(eventId, currentUser);
      if (updatedEvent) {
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        if (viewEvent?.id === eventId) setViewEvent(updatedEvent);
        const isJoining = updatedEvent.participants?.includes(currentUser);
        showToast(isJoining ? "일정에 참여합니다." : "참여를 취소했습니다.", "info");
      }
    } catch (e) {
      showToast("참여 상태 업데이트 실패", "error");
    }
  };

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentYear(v => v - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(v => v - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentYear(v => v + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(v => v + 1);
    }
  }, [currentMonth]);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">일정룸</h1>
            <p className="text-sm text-slate-500 font-medium">협업을 위한 팀원들의 실시간 일정 공유</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="px-4 py-2 text-sm font-black text-slate-900 min-w-[100px] text-center">
                {currentYear}년 {monthNames[currentMonth]}
              </div>
              <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <button onClick={() => { setNewEvent(p => ({...p, date: selectedDate})); setShowAddForm(true); }} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              일정 추가
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 메인 캘린더 */}
          <div className="lg:col-span-3 glass-card rounded-3xl bg-white p-6 shadow-sm">
            <div className="grid grid-cols-7 gap-px mb-6">
              {dayNames.map((day, idx) => (
                <div key={day} className={`text-center py-2 text-[11px] font-black uppercase tracking-[0.1em] ${idx === 0 ? "text-rose-500" : idx === 6 ? "text-indigo-500" : "text-slate-400"}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((date, idx) => {
                if (date === null) return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/30 rounded-2xl border border-transparent" />;
                
                const dayEvents = thisMonthEvents.filter(e => e.date === date);
                const isCurrentToday = date === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                const isSelected = selectedDate === date;

                return (
                  <div key={date} onClick={() => setSelectedDate(date)} className={`aspect-square p-2.5 rounded-2xl border transition-all cursor-pointer group flex flex-col items-start justify-between relative overflow-hidden ${isSelected ? "border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/10" : isCurrentToday ? "border-indigo-200 bg-white" : "border-slate-100 bg-white hover:border-slate-300"}`}>
                    <span className={`text-[13px] font-bold ${isSelected ? "text-indigo-600" : isCurrentToday ? "text-indigo-500" : "text-slate-700"}`}>{date}</span>
                    
                    <div className="w-full space-y-1">
                      {dayEvents.slice(0, 2).map((e, i) => {
                        const creator = TEAM_MEMBERS[e.createdBy as keyof typeof TEAM_MEMBERS] || { color: "#64748b" };
                        return (
                          <div 
                            key={i} 
                            onClick={(event) => {
                              event.stopPropagation(); // 부모의 setSelectedDate 방지
                              setViewEvent(e);
                            }}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-transparent truncate w-full shadow-sm text-white hover:brightness-90 active:scale-95 transition-all" 
                            style={{ backgroundColor: creator.color }}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && <div className="text-[8px] font-black text-indigo-400 pl-1">+{dayEvents.length - 2} items</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측 사이드바: 선택 일자 상세 + 다가오는 일정 */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card rounded-3xl bg-white p-5 shadow-sm border-l-4 border-l-indigo-500">
              <h2 className="text-[15px] font-black text-slate-900 mb-4 flex items-center justify-between">
                <span>{selectedDate}일 상세</span>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full">{selectedDayEvents.length}개</span>
              </h2>
              <div className="space-y-3">
                {selectedDayEvents.map(event => {
                  const creator = TEAM_MEMBERS[event.createdBy as keyof typeof TEAM_MEMBERS] || { color: "#64748b" };
                  const isParticipating = 'participants' in event && event.participants?.includes(currentUser);
                  const eventTime = 'time' in event ? event.time : "종일";
                  return (
                    <div key={event.id} onClick={() => setViewEvent(event)} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">{eventTime}</span>
                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: creator.color }} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {'participants' in event && event.participants?.slice(0, 3).map((p: string, i: number) => (
                            <div key={i} className="w-5 h-5 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-white shadow-sm" style={{ backgroundColor: TEAM_MEMBERS[p as keyof typeof TEAM_MEMBERS]?.color }}>{p[0]}</div>
                          ))}
                          {'participants' in event && (event.participants?.length || 0) > 3 && <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[7px] font-black text-slate-400">+{(event.participants?.length || 0) - 3}</div>}
                        </div>
                        {event.createdBy !== "시스템" && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleParticipation(event.id); }}
                            className={`text-[9px] font-black px-2 py-1 rounded-lg transition-all ${isParticipating ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                          >
                            {isParticipating ? "취소" : "참여"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {selectedDayEvents.length === 0 && <div className="py-10 text-center opacity-30 flex flex-col items-center"><p className="text-[11px] font-bold">일정이 없습니다</p></div>}
              </div>
            </div>

            <div className="glass-card rounded-3xl bg-white p-5 shadow-sm flex-1 overflow-hidden flex flex-col">
              <h2 className="text-[15px] font-black text-slate-900 mb-4">다가오는 일정</h2>
              <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar space-y-4">
                {upcomingEvents.slice(0, 10).map(event => (
                  <div key={event.id} onClick={() => { setSelectedDate(event.date); setViewEvent(event); }} className="relative pl-4 border-l border-slate-100 pb-1 cursor-pointer hover:border-indigo-300 transition-all">
                    <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-slate-200 border-2 border-white" style={{ backgroundColor: TEAM_MEMBERS[event.createdBy as keyof typeof TEAM_MEMBERS]?.color }} />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-slate-400">{event.date}일</span>
                      <span className="text-[10px] font-bold text-indigo-500">{'time' in event ? event.time : "종일"}</span>
                    </div>
                    <p className="text-[12px] font-bold text-slate-700 truncate">{event.title}</p>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <div className="py-10 text-center opacity-30"><p className="text-[11px] font-bold">다가오는 일정이 없습니다</p></div>}
              </div>
            </div>
          </div>
        </div>

        {/* 상세 보기 모달 */}
        {viewEvent && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center" style={{ borderLeft: `8px solid ${viewEvent.createdBy === "시스템" ? "#f43f5e" : (TEAM_MEMBERS[viewEvent.createdBy as keyof typeof TEAM_MEMBERS]?.color || "#64748b")}` }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {'time' in viewEvent && viewEvent.time && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded">{viewEvent.time}</span>}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{'location' in viewEvent ? (viewEvent.location || "장소 미정") : "법정공휴일"}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{viewEvent.title}</h2>
                </div>
                <button onClick={() => setViewEvent(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">일정 내용</label>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl">{'description' in viewEvent ? (viewEvent.description || "상세 설명이 없습니다.") : "공식 공휴일입니다."}</p>
                </div>
                {viewEvent.createdBy !== "시스템" && 'participants' in viewEvent && (
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">참여자 ({viewEvent.participants?.length || 0}명)</label>
                    <div className="flex flex-wrap gap-2">
                      {viewEvent.participants?.map((p: string) => (
                        <div key={p} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: TEAM_MEMBERS[p as keyof typeof TEAM_MEMBERS]?.color }}>{p[0]}</div>
                          <span className="text-xs font-bold text-slate-700">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                {viewEvent.createdBy !== "시스템" ? (
                  <>
                    <button onClick={async () => { if(confirm('일정을 삭제할까요?')) { await deleteEvent(viewEvent.id); setViewEvent(null); refreshEvents(); showToast('삭제되었습니다.', 'info'); } }} className="px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">삭제</button>
                    <button onClick={() => handleToggleParticipation(viewEvent.id)} className={`flex-1 py-3 font-black text-white rounded-2xl shadow-lg transition-all ${'participants' in viewEvent && viewEvent.participants?.includes(currentUser) ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"}`}>
                      {'participants' in viewEvent && viewEvent.participants?.includes(currentUser) ? "일정 참여 취소" : "이 일정에 참여하기"}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setViewEvent(null)} className="flex-1 py-3 bg-slate-900 text-white font-black rounded-2xl">확인</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 등록 모달 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-in">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900">새 일정 등록</h2>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">일정 제목</label>
                  <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} placeholder="회의 제목이나 업무 내용" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">날짜 (일)</label>
                    <input type="number" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">시간</label>
                    <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">상세 설명</label>
                  <textarea rows={3} value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} placeholder="상세 내용을 입력하세요..." className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">취소</button>
                <button onClick={handleAddEvent} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">일정 저장</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}