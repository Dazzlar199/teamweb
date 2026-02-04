"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, startTransition } from "react";
import { Task } from "@/lib/types/task";
import { getTasks } from "@/lib/utils/task";

interface TasksContextType {
  tasks: Task[];
  refreshTasks: () => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshTasks = useCallback(async () => {
    const data = await getTasks();
    setTasks(data);
  }, []);

  useEffect(() => {
    const initData = async () => {
      const data = await getTasks();
      startTransition(() => {
        setTasks(data);
      });
    };
    initData();

    // 타 탭에서의 변경 감지 (디바운싱)
    let timeout: NodeJS.Timeout;
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "team-dashboard-tasks") {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          const data = await getTasks();
          startTransition(() => {
            setTasks(data);
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
    tasks,
    refreshTasks,
    setTasks
  }), [tasks, refreshTasks]);

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks must be used within TasksProvider");
  return context;
}
