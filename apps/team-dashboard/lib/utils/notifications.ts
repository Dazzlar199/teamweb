// 알림 관리 유틸리티 (Supabase 연동 및 팀 공유 보강)

import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  type: 'deadline' | 'comment' | 'feedback' | 'event' | 'mention' | 'finance' | 'task';
  title: string;
  message: string;
  taskId?: string;
  eventId?: string;
  timestamp: string;
  read: boolean;
  user_name: string; // 알림 수신 대상자
  link?: string;
}

/**
 * Supabase Realtime 구독 시작
 */
export function subscribeToNotifications(userName: string, callback: () => void): () => void {
  if (!isSupabaseConfigured()) {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }

  const channel = supabase
    .channel(`notifications-${userName}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_name=eq.${userName}`
      },
      () => {
        // 소리 알림 추가
        try { new Audio('/assets/notification.mp3').play(); } catch(e) {}
        callback();
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * 새 알림 추가 (특정 사용자 또는 전체 팀)
 */
export async function addNotification(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'user_name'>,
  targetUsers?: string[]
): Promise<void> {
  const users = targetUsers && targetUsers.length > 0 ? targetUsers : ["김찬주", "박건희", "김예린", "이나영"];

  const newNotifications = users.map(user => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_name: user,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    taskId: notification.taskId,
    eventId: notification.eventId,
    link: notification.link,
    read: false,
    created_at: Date.now()
  }));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('notifications').insert(newNotifications);
      if (error) {
        console.error("알림 DB 저장 실패:", JSON.stringify(error, null, 2));
        throw error;
      }
    } catch (e) {
      console.error("알림 DB 저장 중 예외 발생:", e);
      throw new Error("알림 생성에 실패했습니다.");
    }
  } else {
    // LocalStorage fallback
    const existing = JSON.parse(localStorage.getItem('team-notifications') || '[]');
    localStorage.setItem('team-notifications', JSON.stringify([...newNotifications, ...existing]));
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * 현재 사용자의 알림 목록 가져오기
 */
export async function getNotifications(userName: string): Promise<Notification[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) return [];
    return data.map(n => ({
      ...n,
      timestamp: new Date(n.created_at).toISOString()
    }));
  }
  
  const local = JSON.parse(localStorage.getItem('team-notifications') || '[]');
  return local.filter((n: any) => n.user_name === userName);
}

export async function markAsRead(notificationId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      if (error) throw error;
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
      // 읽음 표시는 실패해도 UI 흐름을 막지 않음
    }
  }
}

export async function markAllAsRead(userName: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_name', userName);
      if (error) throw error;
    } catch (error) {
      console.error("전체 알림 읽음 처리 실패:", error);
      // 읽음 표시는 실패해도 UI 흐름을 막지 않음
    }
  }
}



/**
 * 알림 삭제
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) throw error;
    } catch (error) {
      console.error("알림 삭제 실패:", error);
      throw new Error("알림 삭제에 실패했습니다.");
    }
  }
}



/**

 * 미읽음 알림 개수 가져오기

 */

export async function getUnreadCount(userName: string): Promise<number> {

  if (isSupabaseConfigured()) {

    const { count, error } = await supabase

      .from('notifications')

      .select('*', { count: 'exact', head: true })

      .eq('user_name', userName)

      .eq('read', false);

    return error ? 0 : (count || 0);

  }

  return 0;

}



/**

 * 브라우저 알림 권한 요청

 */

export async function requestNotificationPermission(): Promise<boolean> {

  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;

  if (Notification.permission !== 'denied') {

    const permission = await Notification.requestPermission();

    return permission === 'granted';

  }

  return false;

}



/**

 * 마감일 체크 및 알림 생성 (자동)

 */



export async function checkDeadlines(tasks: any[], events: any[]): Promise<void> {

  const now = new Date();

  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  

  for (const task of tasks) {

    if (!task.dueDate || task.status === 'done') continue;

    const dueDate = new Date(task.dueDate);

    

    if (dueDate <= now) {

      await addNotification({

        type: 'deadline',

        title: '마감일 경과',

        message: `"${task.title}" 작업의 마감일이 지났습니다.`,

        taskId: task.id,

      });

    } else if (dueDate <= oneDayLater) {

      await addNotification({

        type: 'deadline',

        title: '마감 임박',

        message: `"${task.title}" 작업 마감까지 24시간 미만 남았습니다.`,

        taskId: task.id,

      });

    }

  }



  for (const event of events) {

    if (!event.date) continue;

    const eventDate = new Date(event.date);

    if (eventDate.toDateString() === now.toDateString()) {

      await addNotification({

        type: 'event',

        title: '오늘의 일정',

        message: `오늘 "${event.title}" 일정이 예정되어 있습니다.`,

        eventId: event.id,

      });

    }

  }

}
