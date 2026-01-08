// 알림 관리 유틸리티 (사용자별 개별 관리)

import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  type: 'deadline' | 'comment' | 'feedback' | 'event' | 'mention';
  title: string;
  message: string;
  taskId?: string;
  eventId?: string;
  timestamp: string;
  // 각 사용자별 읽음 상태 관리
  readBy: { [userName: string]: boolean };
  // 알림을 받을 사용자 목록 (빈 배열이면 모든 사용자)
  targetUsers?: string[];
}

const STORAGE_KEY_PREFIX = 'team-dashboard-notifications-';

// 사용자별 알림 키 가져오기
function getUserNotificationsKey(userName: string): string {
  return `${STORAGE_KEY_PREFIX}${userName}`;
}

// 전역 알림 저장소 (모든 알림 저장)
const GLOBAL_STORAGE_KEY = 'team-dashboard-notifications-global';

// Supabase Realtime 구독 관리
let realtimeChannel: any = null;
let realtimeCallbacks: Set<() => void> = new Set();

/**
 * Supabase Realtime 구독 시작
 */
export function subscribeToNotifications(callback: () => void): () => void {
  if (!isSupabaseConfigured()) {
    // Supabase가 없으면 localStorage 이벤트만 사용
    const handleStorageChange = () => {
      callback();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }

  // 이미 구독이 있으면 콜백만 추가
  if (realtimeCallbacks.size > 0) {
    realtimeCallbacks.add(callback);
    return () => {
      realtimeCallbacks.delete(callback);
      if (realtimeCallbacks.size === 0 && realtimeChannel) {
        realtimeChannel.unsubscribe();
        realtimeChannel = null;
      }
    };
  }

  // 새 구독 시작
  realtimeCallbacks.add(callback);
  
  realtimeChannel = supabase
    .channel('notifications-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
      },
      () => {
        // 모든 콜백 실행
        realtimeCallbacks.forEach(cb => cb());
      }
    )
    .subscribe();

  return () => {
    realtimeCallbacks.delete(callback);
    if (realtimeCallbacks.size === 0 && realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
  };
}

export function addNotification(
  notification: Omit<Notification, 'id' | 'readBy' | 'timestamp'>,
  targetUsers?: string[]
): void {
  // 현재 로그인한 사용자 확인
  const currentUser = getUserFromStorage();
  if (!currentUser) return;

  // 전역 알림 저장소에서 알림 가져오기
  const globalNotifications = getGlobalNotifications();
  
  // 중복 알림 방지: 같은 taskId/eventId와 type을 가진 알림이 이미 있으면 추가하지 않음
  const isDuplicate = globalNotifications.some(n => 
    n.type === notification.type &&
    ((notification.taskId && n.taskId === notification.taskId) ||
     (notification.eventId && n.eventId === notification.eventId))
  );
  
  if (isDuplicate) {
    return;
  }
  
  // 고유한 ID 생성
  const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 새 알림 생성
  const newNotification: Notification = {
    ...notification,
    id: notificationId,
    readBy: {},
    timestamp: new Date().toISOString(),
    targetUsers: targetUsers || [], // 빈 배열이면 모든 사용자에게 표시
  };
  
  // 전역 알림 저장소에 추가
  globalNotifications.unshift(newNotification);
  setGlobalNotifications(globalNotifications);
  
  // 대상 사용자들에게 브라우저 알림 표시
  const usersToNotify = targetUsers && targetUsers.length > 0 ? targetUsers : ['all'];
  if (usersToNotify.includes('all') || usersToNotify.includes(currentUser)) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico',
      });
    }
  }
}

// 전역 알림 가져오기
function getGlobalNotifications(): Notification[] {
  const notificationsJson = localStorage.getItem(GLOBAL_STORAGE_KEY);
  if (!notificationsJson) return [];
  
  try {
    return JSON.parse(notificationsJson) as Notification[];
  } catch (error) {
    console.error("[getGlobalNotifications] 파싱 에러:", error);
    return [];
  }
}

// 전역 알림 저장
function setGlobalNotifications(notifications: Notification[]): void {
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(notifications));
}

// 현재 사용자 가져오기 (localStorage에서)
function getUserFromStorage(): string | null {
  try {
    const savedUser = localStorage.getItem("team-dashboard-user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      return userData.name || null;
    }
  } catch (error) {
    console.error("[getUserFromStorage] 파싱 에러:", error);
    return null;
  }
  return null;
}

// 현재 사용자의 알림만 가져오기
export function getNotifications(userName?: string): Notification[] {
  const currentUser = userName || getUserFromStorage();
  if (!currentUser) return [];
  
  const globalNotifications = getGlobalNotifications();
  
  // 현재 사용자가 볼 수 있는 알림만 필터링
  const userNotifications = globalNotifications.filter(n => {
    // targetUsers가 없거나 빈 배열이면 모든 사용자에게 표시
    if (!n.targetUsers || n.targetUsers.length === 0) {
      return true;
    }
    // targetUsers에 현재 사용자가 포함되어 있으면 표시
    return n.targetUsers.includes(currentUser);
  });
  
  // 최신순 정렬
  return userNotifications.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
}

// 알림 읽음 표시 (현재 사용자만)
export function markAsRead(notificationId: string, userName?: string): void {
  const currentUser = userName || getUserFromStorage();
  if (!currentUser) return;
  
  const globalNotifications = getGlobalNotifications();
  const updated = globalNotifications.map(n => {
    if (n.id === notificationId) {
      return {
        ...n,
        readBy: {
          ...n.readBy,
          [currentUser]: true,
        },
      };
    }
    return n;
  });
  
  setGlobalNotifications(updated);
}

// 모든 알림 읽음 표시 (현재 사용자만)
export function markAllAsRead(userName?: string): void {
  const currentUser = userName || getUserFromStorage();
  if (!currentUser) return;
  
  const globalNotifications = getGlobalNotifications();
  const updated = globalNotifications.map(n => ({
    ...n,
    readBy: {
      ...n.readBy,
      [currentUser]: true,
    },
  }));
  
  setGlobalNotifications(updated);
}

// 알림 삭제 (모든 사용자에게서 삭제)
export function deleteNotification(notificationId: string): void {
  const globalNotifications = getGlobalNotifications();
  const updated = globalNotifications.filter(n => n.id !== notificationId);
  setGlobalNotifications(updated);
}

// 미읽음 알림 개수 (현재 사용자만)
export function getUnreadCount(userName?: string): number {
  const currentUser = userName || getUserFromStorage();
  if (!currentUser) return 0;
  
  return getNotifications(currentUser).filter(n => !n.readBy[currentUser]).length;
}

// 브라우저 알림 권한 요청
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// 마감일 체크 및 알림 생성
export function checkDeadlines(tasks: any[], events: any[]): void {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  tasks.forEach(task => {
    if (!task.dueDate) return;
    const dueDate = new Date(task.dueDate);
    
    if (dueDate <= now && task.status !== 'done') {
      addNotification({
        type: 'deadline',
        title: '마감일이 지났습니다',
        message: `"${task.title}" 작업의 마감일이 지났습니다.`,
        taskId: task.id,
      });
    } else if (dueDate <= oneDayLater && dueDate > now && task.status !== 'done') {
      addNotification({
        type: 'deadline',
        title: '마감일이 하루 남았습니다',
        message: `"${task.title}" 작업의 마감일이 내일입니다.`,
        taskId: task.id,
      });
    } else if (dueDate <= threeDaysLater && dueDate > oneDayLater && task.status !== 'done') {
      addNotification({
        type: 'deadline',
        title: '마감일이 3일 남았습니다',
        message: `"${task.title}" 작업의 마감일이 3일 남았습니다.`,
        taskId: task.id,
      });
    }
  });
  
  events.forEach(event => {
    if (!event.date || !event.time) return;
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const oneHourBefore = new Date(eventDateTime.getTime() - 60 * 60 * 1000);
    
    if (eventDateTime > now && oneHourBefore <= now) {
      addNotification({
        type: 'event',
        title: '일정이 1시간 후 시작됩니다',
        message: `"${event.title}" 일정이 곧 시작됩니다.`,
        eventId: event.id,
      });
    }
  });
}

