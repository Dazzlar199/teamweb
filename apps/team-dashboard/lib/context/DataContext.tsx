"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { Post } from "@/lib/types/post";
import { getPosts } from "@/lib/utils/post";
import { Event, Holiday } from "@/lib/types/event";
import { getEvents } from "@/lib/utils/event";
import { Task } from "@/lib/types/task";
import { getTasks } from "@/lib/utils/task";

interface DataContextType {
  posts: Post[];
  events: (Event | Holiday)[];
  tasks: Task[];
  refreshPosts: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  // 로컬 상태 즉시 업데이트용 (낙관적 업데이트)
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setEvents: React.Dispatch<React.SetStateAction<(Event | Holiday)[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<(Event | Holiday)[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshPosts = useCallback(async () => {
    const data = await getPosts();
    setPosts(data);
  }, []);

  const refreshEvents = useCallback(async () => {
    const data = await getEvents();
    setEvents(data);
  }, []);

  const refreshTasks = useCallback(async () => {
    const data = await getTasks();
    setTasks(data);
  }, []);

  useEffect(() => {
    const initData = async () => {
      const [postsData, eventsData, tasksData] = await Promise.all([
        getPosts(),
        getEvents(),
        getTasks()
      ]);
      setPosts(postsData);
      setEvents(eventsData);
      setTasks(tasksData);
    };
    initData();

    // 타 탭에서의 변경 감지
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "team-posts") {
        const data = await getPosts();
        setPosts(data);
      }
      if (e.key === "team-dashboard-events") {
        const data = await getEvents();
        setEvents(data);
      }
      if (e.key === "team-dashboard-tasks") {
        const data = await getTasks();
        setTasks(data);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []); // 빈 배열로 한 번만 실행

  const contextValue = useMemo(() => ({
    posts,
    events,
    tasks,
    refreshPosts,
    refreshEvents,
    refreshTasks,
    setPosts,
    setEvents,
    setTasks
  }), [posts, events, tasks, refreshPosts, refreshEvents, refreshTasks]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}