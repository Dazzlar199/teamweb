import { getLocalStorage, setLocalStorage } from "./localStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Event } from "@/lib/types/event";
import { addNotification } from "./notifications";

const STORAGE_KEY = "team-dashboard-events";

// ============================================
// Supabase 캐싱 메커니즘
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const supabaseCache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 30 * 1000; // 30초로 단축 (더 빠른 동기화)

function getCachedData<T>(key: string): T | null {
  const cached = supabaseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  supabaseCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function clearCache(key?: string): void {
  if (key) {
    supabaseCache.delete(key);
  } else {
    supabaseCache.clear();
  }
}

// ============================================
// Supabase 함수들
// ============================================

async function getEventsFromSupabase(forceRefresh = false): Promise<Event[]> {
  if (!isSupabaseConfigured()) {
    console.log("[getEventsFromSupabase] Supabase가 설정되지 않음");
    return [];
  }

  // 캐시 확인 (강제 새로고침이 아닌 경우에만)
  const cacheKey = "events";
  if (!forceRefresh) {
    const cached = getCachedData<Event[]>(cacheKey);
    if (cached) {
      console.log("[getEventsFromSupabase] 캐시된 데이터 사용");
      return cached;
    }
  } else {
    // 강제 새로고침 시 캐시 무효화
    clearCache(cacheKey);
  }

  try {
    console.log("[getEventsFromSupabase] Supabase에서 일정 가져오기 시작");
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("year", { ascending: true })
      .order("month", { ascending: true })
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error("[getEventsFromSupabase] Supabase 에러:", error);
      console.error(
        "[getEventsFromSupabase] 에러 상세:",
        JSON.stringify(error, null, 2)
      );
      // 404 에러는 테이블이 없음 - 빈 배열 반환 (localStorage 사용)
      if (
        error.code === "PGRST116" ||
        error.message?.includes("404") ||
        error.code === "42P01"
      ) {
        console.warn(
          "[getEventsFromSupabase] events 테이블이 없습니다. localStorage만 사용합니다."
        );
        return [];
      }
      throw error;
    }

    if (!data) {
      console.log("[getEventsFromSupabase] 데이터 없음");
      return [];
    }

    console.log(`[getEventsFromSupabase] ${data.length}개의 일정 가져옴`);
    console.log("[getEventsFromSupabase] 원본 데이터:", data.map((e: any) => ({
      id: e.id,
      title: e.title,
      created_by: e.created_by,
      date: e.date,
      month: e.month,
      year: e.year,
    })));

    // Supabase 데이터를 Event 타입으로 변환
    const events = data.map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      type: e.type,
      createdBy: e.created_by,
      location: e.location || undefined,
      repeat:
        (e.repeat_type as "none" | "daily" | "weekly" | "monthly") || "none",
      repeatEndDate: e.repeat_end_date || undefined,
      year: e.year || undefined,
      month: e.month !== null && e.month !== undefined ? e.month : undefined,
      participants: e.participants || [],
      description: e.description || undefined,
      completed: e.completed || false,
    })) as Event[];

    console.log("[getEventsFromSupabase] 변환된 일정:", events);
    
    // 캐시에 저장
    setCachedData(cacheKey, events);
    
    return events;
  } catch (error: any) {
    console.error(
      "[getEventsFromSupabase] Supabase에서 일정 가져오기 실패:",
      error
    );
    // 404 에러는 테이블이 없음 - 빈 배열 반환 (localStorage 사용)
    if (
      error?.code === "PGRST116" ||
      error?.message?.includes("404") ||
      error?.code === "42P01"
    ) {
      console.warn(
        "[getEventsFromSupabase] events 테이블이 없습니다. localStorage만 사용합니다."
      );
      return [];
    }
    return [];
  }
}

async function saveEventToSupabase(event: Event): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log("[saveEventToSupabase] Supabase가 설정되지 않음");
    return;
  }

  // 저장 시 캐시 무효화
  clearCache("events");

  try {
    console.log("[saveEventToSupabase] 일정 저장 시작:", {
      id: event.id,
      title: event.title,
      createdBy: event.createdBy,
      date: event.date,
      month: event.month,
      year: event.year,
    });
    const supabaseEvent = {
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      created_by: event.createdBy,
      location: event.location || null,
      repeat_type: event.repeat || "none",
      repeat_end_date: event.repeatEndDate || null,
      year: event.year || new Date().getFullYear(),
      month: event.month !== undefined ? event.month : new Date().getMonth(),
      participants: event.participants || [],
      description: event.description || null,
      completed: event.completed || false,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    console.log("[saveEventToSupabase] Supabase 이벤트 데이터:", supabaseEvent);

    // 기존 일정 확인
    const { data: existingEvent, error: checkError } = await supabase
      .from("events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();

    if (checkError) {
      console.error("[saveEventToSupabase] 기존 일정 확인 에러:", checkError);
      console.error(
        "[saveEventToSupabase] 에러 상세:",
        JSON.stringify(checkError, null, 2)
      );
      // 404 에러는 테이블이 없거나 접근 불가
      if (
        checkError.code === "PGRST116" ||
        checkError.message?.includes("404") ||
        checkError.code === "42P01"
      ) {
        console.warn(
          "[saveEventToSupabase] events 테이블이 없거나 접근 불가. Supabase SQL Editor에서 schema.sql을 실행하세요."
        );
        // 에러를 throw하지 않고 localStorage만 사용하도록 함
        return;
      }
    }

    let error;
    if (existingEvent) {
      console.log("[saveEventToSupabase] 기존 일정 업데이트:", event.id);
      // 기존 일정 업데이트
      const { error: updateError } = await supabase
        .from("events")
        .update({
          title: supabaseEvent.title,
          date: supabaseEvent.date,
          time: supabaseEvent.time,
          type: supabaseEvent.type,
          location: supabaseEvent.location,
          repeat_type: supabaseEvent.repeat_type,
          repeat_end_date: supabaseEvent.repeat_end_date,
          year: supabaseEvent.year,
          month: supabaseEvent.month,
          participants: supabaseEvent.participants,
          description: supabaseEvent.description,
          completed: supabaseEvent.completed,
          updated_at: supabaseEvent.updated_at,
        })
        .eq("id", event.id);
      error = updateError;
      if (error) {
        console.error("[saveEventToSupabase] 업데이트 에러:", error);
        console.error(
          "[saveEventToSupabase] 업데이트 에러 상세:",
          JSON.stringify(error, null, 2)
        );
        // 404 에러는 테이블이 없음 - 에러를 throw하지 않고 localStorage만 사용
        if (
          error.code === "PGRST116" ||
          error.message?.includes("404") ||
          error.code === "42P01"
        ) {
          console.warn(
            "[saveEventToSupabase] events 테이블이 없습니다. localStorage만 사용합니다."
          );
          return;
        }
      } else {
        console.log("[saveEventToSupabase] 업데이트 성공");
      }
    } else {
      console.log("[saveEventToSupabase] 새 일정 삽입:", event.id);
      // 새 일정 삽입
      const { error: insertError, data: insertData } = await supabase
        .from("events")
        .insert([supabaseEvent])
        .select();
      error = insertError;
      if (error) {
        console.error("[saveEventToSupabase] 삽입 에러:", error);
        console.error("[saveEventToSupabase] 삽입 에러 메시지:", error.message);
        console.error("[saveEventToSupabase] 삽입 에러 코드:", error.code);
        console.error("[saveEventToSupabase] 삽입 에러 힌트:", error.hint);
        console.error("[saveEventToSupabase] 삽입 에러 상세:", error.details);
        console.error(
          "[saveEventToSupabase] 삽입 에러 전체 (JSON):",
          JSON.stringify(error, null, 2)
        );
        // 404 에러는 테이블이 없음 - 에러를 throw하지 않고 localStorage만 사용
        if (
          error.code === "PGRST116" ||
          error.message?.includes("404") ||
          error.code === "42P01"
        ) {
          console.warn(
            "[saveEventToSupabase] events 테이블이 없습니다. localStorage만 사용합니다."
          );
          return;
        }
      } else {
        console.log("[saveEventToSupabase] 삽입 성공:", insertData);
        console.log("[saveEventToSupabase] 저장된 일정 상세:", {
          id: insertData?.[0]?.id,
          title: insertData?.[0]?.title,
          created_by: insertData?.[0]?.created_by,
          date: insertData?.[0]?.date,
        });
      }
    }

    if (error) {
      // 404 에러가 아닌 경우에만 throw
      if (
        !(
          error.code === "PGRST116" ||
          error.message?.includes("404") ||
          error.code === "42P01"
        )
      ) {
        console.error("[saveEventToSupabase] Supabase 일정 저장 에러:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("[saveEventToSupabase] Supabase에 일정 저장 실패:", error);
    throw error;
  }
}

async function deleteEventFromSupabase(eventId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) throw error;
    
    // 삭제 시 캐시 무효화
    clearCache("events");
  } catch (error) {
    console.error("Supabase에서 일정 삭제 실패:", error);
    throw error;
  }
}

// ============================================
// 통합 함수들 (localStorage 또는 Supabase 자동 선택)
// ============================================

// 일정 목록 가져오기
export async function getEvents(forceRefresh?: boolean): Promise<Event[]>;
export function getEvents(forceRefresh?: boolean): Event[] | Promise<Event[]>;
export function getEvents(forceRefresh: boolean = false): Event[] | Promise<Event[]> {
  console.log(
    "[getEvents] 일정 가져오기 시작, Supabase 설정:",
    isSupabaseConfigured(),
    "강제 새로고침:",
    forceRefresh
  );

  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        // Supabase에서 가져오기 (강제 새로고침 옵션 전달)
        console.log("[getEvents] Supabase에서 일정 가져오기");
        const supabaseEvents = await getEventsFromSupabase(forceRefresh);
        console.log(
          `[getEvents] Supabase에서 ${supabaseEvents.length}개 일정 가져옴`
        );

        // localStorage에서 가져오기
        const localEvents = getLocalStorage<Event[]>(STORAGE_KEY, []);
        console.log(
          `[getEvents] localStorage에서 ${localEvents.length}개 일정 가져옴`
        );

        // 두 데이터 병합 (Supabase 우선, 중복 제거)
        const eventMap = new Map<string, Event>();

        // 먼저 localStorage 데이터 추가 (로컬에서만 존재하는 일정 포함)
        localEvents.forEach((event) => {
          eventMap.set(event.id, event);
        });

        // Supabase 데이터로 덮어쓰기 (Supabase가 최신 데이터이므로 항상 우선)
        // 다른 사용자가 등록한 일정도 포함됨
        supabaseEvents.forEach((event) => {
          eventMap.set(event.id, event);
        });

        // 디버깅: 각 일정의 출처 확인
        console.log("[getEvents] 병합 상세:");
        console.log(`[getEvents] Supabase 일정 (${supabaseEvents.length}개):`);
        supabaseEvents.forEach((event) => {
          console.log(`  - Supabase: ${event.title} (작성자: ${event.createdBy}, 날짜: ${event.year}/${event.month}/${event.date})`);
        });
        console.log(`[getEvents] localStorage 일정 (${localEvents.length}개):`);
        
        // localStorage에만 있는 일정을 Supabase로 동기화
        const eventsToSync: Event[] = [];
        localEvents.forEach((event) => {
          const inSupabase = supabaseEvents.find((e) => e.id === event.id);
          if (!inSupabase) {
            console.log(`  - localStorage만: ${event.title} (작성자: ${event.createdBy}, 날짜: ${event.year}/${event.month}/${event.date}) - Supabase 동기화 필요`);
            eventsToSync.push(event);
          } else {
            console.log(`  - Supabase에도 있음: ${event.title} (작성자: ${event.createdBy})`);
          }
        });

        // localStorage에만 있는 일정을 Supabase로 자동 동기화
        if (eventsToSync.length > 0) {
          console.log(`[getEvents] localStorage에만 있는 ${eventsToSync.length}개 일정을 Supabase로 동기화 시작`);
          (async () => {
            for (const event of eventsToSync) {
              try {
                await saveEventToSupabase(event);
                console.log(`[getEvents] 동기화 성공: ${event.title} (${event.id})`);
              } catch (error) {
                console.error(`[getEvents] 동기화 실패: ${event.title} (${event.id})`, error);
              }
            }
            // 동기화 후 캐시 무효화
            clearCache("events");
          })();
        }

        const mergedEvents = Array.from(eventMap.values());
        console.log(`[getEvents] 병합된 일정: ${mergedEvents.length}개`);
        console.log(
          "[getEvents] 일정 목록:",
          mergedEvents.map((e) => ({
            id: e.id,
            title: e.title,
            createdBy: e.createdBy,
          }))
        );

        return mergedEvents;
      } catch (error) {
        console.error(
          "[getEvents] 일정 가져오기 실패, localStorage만 사용:",
          error
        );
        return getLocalStorage<Event[]>(STORAGE_KEY, []);
      }
    })();
  }

  console.log("[getEvents] Supabase 미설정, localStorage만 사용");
  return getLocalStorage<Event[]>(STORAGE_KEY, []);
}

// 일정 저장
export async function saveEvent(event: Event): Promise<void>;
export function saveEvent(event: Event): Promise<void> | void;
export async function saveEvent(event: Event): Promise<void> {
  // localStorage에 먼저 저장 (항상 작동)
  const events = getLocalStorage<Event[]>(STORAGE_KEY, []);
  const index = events.findIndex((e) => e.id === event.id);
  const isNew = index < 0;

  if (index >= 0) {
    events[index] = event;
  } else {
    events.push(event);
  }

  setLocalStorage(STORAGE_KEY, events);

  // Supabase 동기화 (동기적으로 실행하여 저장 보장)
  if (isSupabaseConfigured()) {
    console.log("[saveEvent] Supabase 동기화 시작:", event.id, "작성자:", event.createdBy);
    
    // Supabase 저장을 동기적으로 시도 (최대 3회 재시도)
    let retryCount = 0;
    const maxRetries = 3;
    let syncSuccess = false;
    
    while (retryCount < maxRetries && !syncSuccess) {
      try {
        await saveEventToSupabase(event);
        console.log("[saveEvent] Supabase 동기화 성공:", event.id, `(시도 ${retryCount + 1}/${maxRetries})`);
        syncSuccess = true;
        
        // 새 일정인 경우 알림 발송
        if (isNew && event.createdBy !== "시스템") {
          await addNotification({
            type: 'event',
            title: '새 팀 일정',
            message: `${event.createdBy}님이 새 일정을 등록했습니다: ${event.title}`,
            eventId: event.id,
            link: '/calendar'
          }, ["김찬주", "박건희", "김예린", "이나영"].filter(u => u !== event.createdBy));
        }
        
        // 저장 성공 시 캐시 무효화 (다른 사용자가 즉시 볼 수 있도록)
        clearCache("events");
        
        // 다른 탭/창에 알림을 보내기 위해 storage 이벤트 트리거
        try {
          window.dispatchEvent(new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: JSON.stringify(events),
          }));
        } catch (e) {
          // StorageEvent 생성 실패는 무시
        }
      } catch (error: any) {
        retryCount++;
        console.error(`[saveEvent] Supabase 동기화 실패 (시도 ${retryCount}/${maxRetries}):`, event.id, "작성자:", event.createdBy);
        console.error("[saveEvent] 에러 상세:", error);
        
        if (retryCount < maxRetries) {
          // 재시도 전 대기 (지수 백오프)
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          console.log(`[saveEvent] ${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // 최종 실패 시 사용자에게 알림
          console.error("[saveEvent] Supabase 동기화 최종 실패:", event.id);
          console.error("[saveEvent] 일정은 localStorage에만 저장되었습니다. 다른 사용자와 공유되지 않을 수 있습니다.");
          
          // 사용자에게 경고 표시 (선택적)
          if (typeof window !== 'undefined' && window.console) {
            console.warn(
              `⚠️ 일정 "${event.title}"이 Supabase에 저장되지 않았습니다. ` +
              `다른 사용자와 공유되지 않을 수 있습니다. ` +
              `페이지를 새로고침하거나 잠시 후 다시 시도해주세요.`
            );
          }
        }
      }
    }
  } else {
    console.log("[saveEvent] Supabase 미설정, localStorage만 사용");
    console.warn("[saveEvent] ⚠️ Supabase가 설정되지 않아 일정이 공유되지 않습니다.");
  }
}

// 일정 삭제
export async function deleteEvent(eventId: string): Promise<void>;
export function deleteEvent(eventId: string): void | Promise<void>;
export function deleteEvent(eventId: string): void | Promise<void> {
  // localStorage에서 먼저 삭제
  const events = getLocalStorage<Event[]>(STORAGE_KEY, []);
  const filtered = events.filter((e) => e.id !== eventId);
  setLocalStorage(STORAGE_KEY, filtered);

  // Supabase 동기화 (백그라운드에서 실행, 에러 무시)
  if (isSupabaseConfigured()) {
    (async () => {
      try {
        await deleteEventFromSupabase(eventId);
        // 삭제 성공 시 캐시 무효화
        clearCache("events");
      } catch (error) {
        console.warn("Supabase 일정 삭제 실패 (무시됨):", error);
      }
    })();
  }
}

// 일정 일괄 저장 (반복 일정 등)
export async function saveEvents(events: Event[]): Promise<void>;
export function saveEvents(events: Event[]): void | Promise<void>;
export function saveEvents(events: Event[]): void | Promise<void> {
  // localStorage에 먼저 저장
  setLocalStorage(STORAGE_KEY, events);

  // Supabase 동기화 (백그라운드에서 실행, 에러 무시)
  if (isSupabaseConfigured()) {
    (async () => {
      try {
        // Supabase에서는 각 이벤트를 개별적으로 저장
        await Promise.all(events.map((e) => saveEventToSupabase(e)));
        // 저장 성공 시 캐시 무효화
        clearCache("events");
      } catch (error) {
        console.warn("Supabase 일정 일괄 저장 실패 (무시됨):", error);
      }
    })();
  }
}

// 일정 참여/참여 취소 토글
export async function toggleEventParticipation(
  eventId: string,
  userName: string
): Promise<Event | null>;
export function toggleEventParticipation(
  eventId: string,
  userName: string
): Event | null | Promise<Event | null>;
export function toggleEventParticipation(
  eventId: string,
  userName: string
): Event | null | Promise<Event | null> {
  return (async () => {
    // 최신 일정 목록 가져오기 (Supabase + localStorage 병합)
    const allEvents = await getEvents();
    const event = allEvents.find((e) => e.id === eventId);

    if (!event) {
      console.warn(
        `[toggleEventParticipation] 일정을 찾을 수 없음: ${eventId}`
      );
      console.warn(
        `[toggleEventParticipation] 현재 일정 목록:`,
        allEvents.map((e) => ({ id: e.id, title: e.title }))
      );
      return null;
    }

    // 참여자 목록 초기화 (없으면 빈 배열)
    const participants = event.participants || [];

    // 참여 여부 확인 및 토글
    const isParticipating = participants.includes(userName);
    const updatedParticipants = isParticipating
      ? participants.filter((p) => p !== userName) // 참여 취소
      : [...participants, userName]; // 참여 추가

    // 일정 업데이트
    const updatedEvent: Event = {
      ...event,
      participants: updatedParticipants,
    };

    // localStorage에 저장
    const localEvents = getLocalStorage<Event[]>(STORAGE_KEY, []);
    const localIndex = localEvents.findIndex((e) => e.id === eventId);

    if (localIndex >= 0) {
      localEvents[localIndex] = updatedEvent;
    } else {
      localEvents.push(updatedEvent);
    }
    setLocalStorage(STORAGE_KEY, localEvents);

    // Supabase 동기화
    if (isSupabaseConfigured()) {
      try {
        await saveEventToSupabase(updatedEvent);
        console.log(
          `[toggleEventParticipation] Supabase 동기화 성공: ${eventId}`
        );
      } catch (error) {
        console.error(
          "[toggleEventParticipation] Supabase 동기화 실패 (무시됨):",
          error
        );
      }
    }

    return updatedEvent;
  })();
}
