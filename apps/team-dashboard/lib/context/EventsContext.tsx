"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, startTransition } from "react";
import { Event, Holiday } from "@/lib/types/event";
import { getEvents } from "@/lib/utils/event";

interface EventsContextType {
  events: (Event | Holiday)[];
  refreshEvents: () => Promise<void>;
  setEvents: React.Dispatch<React.SetStateAction<(Event | Holiday)[]>>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<(Event | Holiday)[]>([]);

  const refreshEvents = useCallback(async () => {
    const data = await getEvents();
    setEvents(data);
  }, []);

  useEffect(() => {
    // ⚡ 150ms 지연 후 로드 (Posts 다음)
    const timer = setTimeout(() => {
      const initData = async () => {
        const data = await getEvents();
        startTransition(() => {
          setEvents(data);
        });
      };
      initData();
    }, 150);

    return () => clearTimeout(timer);

    // 타 탭에서의 변경 감지 (디바운싱)
    let timeout: NodeJS.Timeout;
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "team-dashboard-events") {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          const data = await getEvents();
          startTransition(() => {
            setEvents(data);
          });
        }, 300);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearTimeout(timeout);
    };
  }, []);

  const contextValue = useMemo(() => ({
    events,
    refreshEvents,
    setEvents
  }), [events, refreshEvents]);

  return (
    <EventsContext.Provider value={contextValue}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within EventsProvider");
  return context;
}
