import { getLocalStorage, setLocalStorage } from "./localStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Task } from "@/lib/types/task";
import { addNotification } from "./notifications";

const STORAGE_KEY = "team-dashboard-tasks";

// ============================================
// Supabase 함수들
// ============================================

async function getTasksFromSupabase(): Promise<Task[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assigned_to,
      dueDate: task.due_date,
      comments: task.comments || [],
      tags: task.tags || [],
      isBookmarked: task.is_bookmarked,
      progress: task.progress,
      createdBy: task.created_by,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      attachments: task.attachments || [],
    })) as Task[];
  } catch (error) {
    console.error("Supabase에서 태스크 가져오기 실패:", error);
    return [];
  }
}

async function saveTaskToSupabase(task: Task): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabaseTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assignedTo,
      due_date: task.dueDate,
      comments: task.comments,
      tags: task.tags,
      is_bookmarked: task.isBookmarked,
      progress: task.progress,
      created_by: task.createdBy,
      created_at: task.createdAt,
      updated_at: task.updatedAt || new Date().toISOString(),
      attachments: task.attachments,
    };

    // 기존 태스크 확인
    const { data: existingTask } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", task.id)
      .maybeSingle();

    if (existingTask) {
      // 업데이트
      const { error } = await supabase
        .from("tasks")
        .update(supabaseTask)
        .eq("id", task.id);
      if (error) throw error;
    } else {
      // 삽입
      const { error } = await supabase.from("tasks").insert([supabaseTask]);
      if (error) throw error;
    }
  } catch (error) {
    console.error("Supabase 태스크 저장 실패:", error);
    throw error;
  }
}

async function deleteTaskFromSupabase(taskId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase 태스크 삭제 실패:", error);
    throw error;
  }
}

// ============================================
// 통합 함수들 (localStorage 또는 Supabase 자동 선택)
// ============================================

// 태스크 목록 가져오기
export async function getTasks(): Promise<Task[]>;
export function getTasks(): Task[] | Promise<Task[]>;
export function getTasks(): Task[] | Promise<Task[]> {
  if (isSupabaseConfigured()) {
    return getTasksFromSupabase();
  }
  return getLocalStorage<Task[]>(STORAGE_KEY, []);
}

// 태스크 저장
export async function saveTask(task: Task): Promise<void> {
  const tasks = getLocalStorage<Task[]>(STORAGE_KEY, []);
  const index = tasks.findIndex((t) => t.id === task.id);
  const isNewTask = index < 0;

  // Supabase 먼저 저장 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      await saveTaskToSupabase(task);

      // 새 태스크 생성 시 알림 (담당자에게)
      if (isNewTask && task.assignedTo) {
        await addNotification({
          type: 'task',
          title: '새 업무 배정',
          message: `새로운 업무가 배정되었습니다: ${task.title}`,
          link: '/tasks'
        }, [task.assignedTo]);
      }
    } catch (error) {
      console.error("Supabase 태스크 저장 실패:", error);
      throw new Error("태스크 저장에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.unshift(task);
  }

  // 날짜순 정렬 (최신순)
  tasks.sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  setLocalStorage(STORAGE_KEY, tasks);
}

// 태스크 삭제
export async function deleteTask(taskId: string): Promise<void> {
  // Supabase 먼저 삭제 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      await deleteTaskFromSupabase(taskId);
    } catch (error) {
      console.error("Supabase 태스크 삭제 실패:", error);
      throw new Error("태스크 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  const tasks = getLocalStorage<Task[]>(STORAGE_KEY, []);
  const filtered = tasks.filter((t) => t.id !== taskId);
  setLocalStorage(STORAGE_KEY, filtered);
}

// 태스크 ID로 가져오기
export async function getTaskById(taskId: string): Promise<Task | undefined>;
export function getTaskById(taskId: string): Task | undefined | Promise<Task | undefined>;
export function getTaskById(taskId: string): Task | undefined | Promise<Task | undefined> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .maybeSingle();

        if (error || !data) return undefined;

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assignedTo: data.assigned_to,
          dueDate: data.due_date,
          comments: data.comments || [],
          tags: data.tags || [],
          isBookmarked: data.is_bookmarked,
          progress: data.progress,
          createdBy: data.created_by,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          attachments: data.attachments || [],
        } as Task;
      } catch (error) {
        console.error("Supabase 태스크 조회 실패:", error);
        return undefined;
      }
    })();
  }

  const tasks = getLocalStorage<Task[]>(STORAGE_KEY, []);
  return tasks.find((t) => t.id === taskId);
}

// 태스크 상태 업데이트
export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  const tasks = getLocalStorage<Task[]>(STORAGE_KEY, []);
  const task = tasks.find(t => t.id === taskId);

  if (task) {
    task.status = status;
    task.updatedAt = new Date().toISOString();
    await saveTask(task);
  }
}
