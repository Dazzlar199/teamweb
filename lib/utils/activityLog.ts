// 활동 로그 관리 유틸리티

export interface ActivityLog {
  id: string;
  type: 'task' | 'event' | 'file' | 'comment' | 'status_change' | 'note' | 'checklist' | 'document';
  action: string;
  user: string;
  targetId?: string;
  targetTitle?: string;
  item?: string; // 예창패 페이지에서 사용
  timestamp: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'team-dashboard-activity-logs';
const MAX_LOGS = 500; // 최대 500개 로그 유지

export function addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    targetId: log.targetId || '',
    targetTitle: log.targetTitle || log.item || '',
  };
  
  logs.unshift(newLog);
  
  // 최대 개수 제한
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function getActivityLogs(limit?: number): ActivityLog[] {
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

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR');
}



