// 알림 관리 유틸리티

export interface Notification {
  id: string;
  type: 'deadline' | 'comment' | 'feedback' | 'event' | 'mention';
  title: string;
  message: string;
  taskId?: string;
  eventId?: string;
  read: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'team-dashboard-notifications';

export function addNotification(notification: Omit<Notification, 'id' | 'read' | 'timestamp'>): void {
  const notifications = getNotifications();
  
  // 중복 알림 방지: 같은 taskId/eventId와 type을 가진 읽지 않은 알림이 이미 있으면 추가하지 않음
  const isDuplicate = notifications.some(n => 
    !n.read && 
    n.type === notification.type &&
    ((notification.taskId && n.taskId === notification.taskId) ||
     (notification.eventId && n.eventId === notification.eventId))
  );
  
  if (isDuplicate) {
    return;
  }
  
  // 고유한 ID 생성 (Date.now() + 랜덤 숫자)
  const newNotification: Notification = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    read: false,
    timestamp: new Date().toISOString(),
  };
  
  notifications.unshift(newNotification);
  
  // 브라우저 알림 요청
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(newNotification.title, {
      body: newNotification.message,
      icon: '/favicon.ico',
    });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function getNotifications(): Notification[] {
  const notificationsJson = localStorage.getItem(STORAGE_KEY);
  if (!notificationsJson) return [];
  
  try {
    const notifications = JSON.parse(notificationsJson) as Notification[];
    // 중복 ID 제거 (같은 ID를 가진 알림 중 가장 최근 것만 유지)
    const uniqueNotifications = notifications.reduce((acc, notif) => {
      const existingIndex = acc.findIndex(n => n.id === notif.id);
      if (existingIndex === -1) {
        acc.push(notif);
      } else {
        // 같은 ID가 있으면 더 최근 것으로 교체
        const existing = acc[existingIndex];
        const existingTime = new Date(existing.timestamp).getTime();
        const newTime = new Date(notif.timestamp).getTime();
        if (newTime > existingTime) {
          acc[existingIndex] = notif;
        }
      }
      return acc;
    }, [] as Notification[]);
    
    // ID로 정렬 (최신순)
    return uniqueNotifications.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  } catch {
    return [];
  }
}

export function markAsRead(notificationId: string): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function markAllAsRead(): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteNotification(notificationId: string): void {
  const notifications = getNotifications();
  const updated = notifications.filter(n => n.id !== notificationId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
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

