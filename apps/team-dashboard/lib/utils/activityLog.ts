// 활동 로그 관리 유틸리티

import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface ActivityLog {
  id: string;
  type:
    | "task"
    | "event"
    | "file"
    | "comment"
    | "status_change"
    | "note"
    | "checklist"
    | "document"
    | "message";
  action: string;
  user: string;
  targetId?: string;
  targetTitle?: string;
  item?: string; // 예창패 페이지에서 사용
  timestamp: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = "team-dashboard-activity-logs";
const MAX_LOGS = 500; // 최대 500개 로그 유지

// Supabase에서 활동 로그 가져오기
async function getActivityLogsFromSupabase(
  limit?: number
): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getActivityLogsFromSupabase] Supabase 에러:", error);
      return [];
    }

    if (!data) return [];

    // Supabase 데이터를 ActivityLog 타입으로 변환
    return data.map((log: any) => ({
      id: log.id,
      type: (log.target_type as ActivityLog["type"]) || "task",
      action: log.action,
      user: log.user_name,
      targetId: log.target_id || undefined,
      targetTitle:
        log.details?.targetTitle || log.details?.target_title || undefined,
      item: log.details?.item || undefined,
      timestamp: new Date(log.timestamp).toISOString(),
      metadata: log.details || undefined,
    })) as ActivityLog[];
  } catch (error) {
    console.error(
      "[getActivityLogsFromSupabase] Supabase에서 활동 로그 가져오기 실패:",
      error
    );
    return [];
  }
}

// Supabase에 활동 로그 저장
async function saveActivityLogToSupabase(log: ActivityLog): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabaseLog = {
      id: log.id,
      user_name: log.user,
      action: log.action,
      target_type: log.type,
      target_id: log.targetId || null,
      details: {
        targetTitle: log.targetTitle || log.item || null,
        item: log.item || null,
        ...(log.metadata || {}),
      },
      timestamp: new Date(log.timestamp).getTime(),
    };

    const { error } = await supabase
      .from("activity_logs")
      .upsert([supabaseLog], { onConflict: "id" });

    if (error) {
      console.error("[saveActivityLogToSupabase] Supabase 저장 에러:", error);
    }
  } catch (error) {
    console.error(
      "[saveActivityLogToSupabase] Supabase에 활동 로그 저장 실패:",
      error
    );
  }
}

export function addActivityLog(
  log: Omit<ActivityLog, "id" | "timestamp">
): void {
  // localStorage에서 직접 가져오기 (동기적으로)
  const logsJson = localStorage.getItem(STORAGE_KEY);
  const logs: ActivityLog[] = logsJson ? JSON.parse(logsJson) : [];

  const newLog: ActivityLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    targetId: log.targetId || "",
    targetTitle: log.targetTitle || log.item || "",
  };

  logs.unshift(newLog);

  // 최대 개수 제한
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

  // Supabase 동기화 (백그라운드에서 실행, 에러 무시)
  if (isSupabaseConfigured()) {
    (async () => {
      try {
        await saveActivityLogToSupabase(newLog);
      } catch (error) {
        console.error("[addActivityLog] Supabase 동기화 실패 (무시됨):", error);
      }
    })();
  }
}

export async function getActivityLogs(limit?: number): Promise<ActivityLog[]>;
export function getActivityLogs(
  limit?: number
): ActivityLog[] | Promise<ActivityLog[]>;
export function getActivityLogs(
  limit?: number
): ActivityLog[] | Promise<ActivityLog[]> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        // Supabase에서 가져오기
        const supabaseLogs = await getActivityLogsFromSupabase(limit);

        // localStorage에서 가져오기
        const localLogsJson = localStorage.getItem(STORAGE_KEY);
        const localLogs = localLogsJson
          ? (JSON.parse(localLogsJson) as ActivityLog[])
          : [];

        // 두 데이터 병합 (Supabase 우선, 중복 제거)
        const logMap = new Map<string, ActivityLog>();

        // 먼저 localStorage 데이터 추가
        localLogs.forEach((log) => {
          logMap.set(log.id, log);
        });

        // Supabase 데이터로 덮어쓰기 (최신 데이터 우선)
        supabaseLogs.forEach((log) => {
          logMap.set(log.id, log);
        });

        const mergedLogs = Array.from(logMap.values());

        // 타임스탬프 기준으로 정렬 (최신순)
        mergedLogs.sort((a, b) => {
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });

        return limit ? mergedLogs.slice(0, limit) : mergedLogs;
      } catch (error) {
        console.error(
          "[getActivityLogs] 활동 로그 가져오기 실패, localStorage만 사용:",
          error
        );
        const logsJson = localStorage.getItem(STORAGE_KEY);
        if (!logsJson) return [];
        try {
          const logs = JSON.parse(logsJson) as ActivityLog[];
          return limit ? logs.slice(0, limit) : logs;
        } catch {
          return [];
        }
      }
    })();
  }

  // Supabase 미설정 시 localStorage만 사용
  const logsJson = localStorage.getItem(STORAGE_KEY);
  if (!logsJson) return [];
  try {
    const logs = JSON.parse(logsJson) as ActivityLog[];
    return limit ? logs.slice(0, limit) : logs;
  } catch {
    return [];
  }
}

export function clearActivityLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR");
}
