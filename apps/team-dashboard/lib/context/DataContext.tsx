"use client";

// 🔄 COMPATIBILITY LAYER: This context is deprecated, use specific contexts instead
// - usePosts() from "@/lib/context/PostsContext"
// - useEvents() from "@/lib/context/EventsContext"
// - useTasks() from "@/lib/context/TasksContext"

import { createContext, useContext, ReactNode, useMemo } from "react";
import { usePosts } from "./PostsContext";
import { useEvents } from "./EventsContext";
import { useTasks } from "./TasksContext";
import { Post } from "@/lib/types/post";
import { Event, Holiday } from "@/lib/types/event";
import { Task } from "@/lib/types/task";

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

export function DataProvider({ children }: { children: ReactNode}) {
  // 🔄 Compatibility wrapper - delegates to individual contexts
  const postsContext = usePosts();
  const eventsContext = useEvents();
  const tasksContext = useTasks();

  // ✅ useMemo로 불필요한 리렌더링 방지
  const contextValue = useMemo(() => ({
    posts: postsContext.posts,
    events: eventsContext.events,
    tasks: tasksContext.tasks,
    refreshPosts: postsContext.refreshPosts,
    refreshEvents: eventsContext.refreshEvents,
    refreshTasks: tasksContext.refreshTasks,
    setPosts: postsContext.setPosts,
    setEvents: eventsContext.setEvents,
    setTasks: tasksContext.setTasks,
  }), [
    postsContext.posts,
    postsContext.refreshPosts,
    postsContext.setPosts,
    eventsContext.events,
    eventsContext.refreshEvents,
    eventsContext.setEvents,
    tasksContext.tasks,
    tasksContext.refreshTasks,
    tasksContext.setTasks,
  ]);

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