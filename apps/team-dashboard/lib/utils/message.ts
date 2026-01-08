// 1:1 메시지 관리 유틸리티

import { getLocalStorage, setLocalStorage } from "./localStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Message, Conversation } from "@/lib/types/message";

const STORAGE_KEY = "team-dashboard-messages";

// ============================================
// Supabase 함수들
// ============================================

async function getMessagesFromSupabase(): Promise<Message[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("[getMessagesFromSupabase] Supabase 에러:", error);
      if (
        error.code === "PGRST116" ||
        error.message?.includes("404") ||
        error.code === "42P01"
      ) {
        return [];
      }
      throw error;
    }

    if (!data) return [];

    return data.map((m: any) => ({
      id: m.id,
      sender: m.sender,
      receiver: m.receiver,
      content: m.content,
      timestamp: m.timestamp,
      read: m.read || false,
      readAt: m.read_at || undefined,
    })) as Message[];
  } catch (error: any) {
    console.error("[getMessagesFromSupabase] 실패:", error);
    if (
      error?.code === "PGRST116" ||
      error?.message?.includes("404") ||
      error?.code === "42P01"
    ) {
      return [];
    }
    return [];
  }
}

async function saveMessageToSupabase(message: Message): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabaseMessage = {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      content: message.content,
      timestamp: message.timestamp,
      read: message.read || false,
      read_at: message.readAt || null,
    };

    const { error } = await supabase.from("messages").insert([supabaseMessage]);
    if (error) throw error;
  } catch (error) {
    console.error("[saveMessageToSupabase] 실패:", error);
    // 에러를 throw하지 않고 localStorage만 사용
  }
}

async function updateMessageReadStatus(
  messageId: string,
  read: boolean
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase
      .from("messages")
      .update({
        read,
        read_at: read ? new Date().toISOString() : null,
      })
      .eq("id", messageId);

    if (error) throw error;
  } catch (error) {
    console.error("[updateMessageReadStatus] 실패:", error);
  }
}

// ============================================
// 통합 함수들
// ============================================

/**
 * 대화 ID 생성 (정렬된 이름으로)
 */
function getConversationId(user1: string, user2: string): string {
  return [user1, user2].sort().join("-");
}

// Realtime 구독 관리
let messageRealtimeChannel: any = null;
let messageRealtimeCallbacks: Set<() => void> = new Set();

/**
 * 메시지 Realtime 구독 시작
 */
export function subscribeToMessages(callback: () => void): () => void {
  if (!isSupabaseConfigured()) {
    // Supabase가 없으면 localStorage 이벤트만 사용
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback();
      }
    };
    const handleCustomEvent = () => callback();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('messages-updated', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('messages-updated', handleCustomEvent);
    };
  }

  // 이미 구독이 있으면 콜백만 추가
  if (messageRealtimeCallbacks.size > 0) {
    messageRealtimeCallbacks.add(callback);
    return () => {
      messageRealtimeCallbacks.delete(callback);
      if (messageRealtimeCallbacks.size === 0 && messageRealtimeChannel) {
        messageRealtimeChannel.unsubscribe();
        messageRealtimeChannel = null;
      }
    };
  }

  // 새 구독 시작
  messageRealtimeCallbacks.add(callback);
  
  messageRealtimeChannel = supabase
    .channel('messages-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
      },
      () => {
        // 모든 콜백 실행
        messageRealtimeCallbacks.forEach(cb => cb());
      }
    )
    .subscribe();

  return () => {
    messageRealtimeCallbacks.delete(callback);
    if (messageRealtimeCallbacks.size === 0 && messageRealtimeChannel) {
      messageRealtimeChannel.unsubscribe();
      messageRealtimeChannel = null;
    }
  };
}

/**
 * 모든 메시지 가져오기 (Supabase + localStorage 병합)
 */
export async function getMessages(): Promise<Message[]> {
  try {
    const supabaseMessages = await getMessagesFromSupabase();
    const localMessages = getLocalStorage<Message[]>(STORAGE_KEY, []);

    // 병합 (읽음 상태는 localStorage 우선, 나머지는 Supabase 우선)
    const messageMap = new Map<string, Message>();
    
    // 먼저 Supabase 메시지 추가
    supabaseMessages.forEach((msg) => messageMap.set(msg.id, msg));
    
    // localStorage 메시지로 덮어쓰기 (읽음 상태 보존)
    localMessages.forEach((localMsg) => {
      const existingMsg = messageMap.get(localMsg.id);
      if (existingMsg) {
        // 읽음 상태는 localStorage가 우선 (사용자가 읽음 처리한 상태 보존)
        messageMap.set(localMsg.id, {
          ...existingMsg,
          read: localMsg.read || existingMsg.read,
          readAt: localMsg.readAt || existingMsg.readAt,
        });
      } else {
        // localStorage에만 있는 메시지 추가
        messageMap.set(localMsg.id, localMsg);
      }
    });

    return Array.from(messageMap.values()).sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  } catch (error) {
    console.error("[getMessages] 실패:", error);
    return getLocalStorage<Message[]>(STORAGE_KEY, []);
  }
}

/**
 * 특정 사용자와의 메시지 가져오기
 */
export async function getMessagesWithUser(
  currentUser: string,
  otherUser: string
): Promise<Message[]> {
  const allMessages = await getMessages();
  return allMessages.filter(
    (msg) =>
      (msg.sender === currentUser && msg.receiver === otherUser) ||
      (msg.sender === otherUser && msg.receiver === currentUser)
  );
}

/**
 * 메시지 전송
 */
export async function sendMessage(
  sender: string,
  receiver: string,
  content: string
): Promise<Message> {
  const message: Message = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sender,
    receiver,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  // localStorage에 저장
  const messages = getLocalStorage<Message[]>(STORAGE_KEY, []);
  messages.push(message);
  setLocalStorage(STORAGE_KEY, messages);

  // 같은 탭에서도 업데이트를 감지하도록 이벤트 트리거
  try {
    window.dispatchEvent(new CustomEvent("messages-updated"));
  } catch (e) {
    // CustomEvent 생성 실패는 무시
  }

  // Supabase 동기화 (백그라운드)
  if (isSupabaseConfigured()) {
    (async () => {
      try {
        await saveMessageToSupabase(message);
      } catch (error) {
        console.error("[sendMessage] Supabase 동기화 실패:", error);
      }
    })();
  }

  return message;
}

/**
 * 메시지 읽음 표시
 */
export async function markMessageAsRead(
  messageId: string,
  currentUser: string
): Promise<void> {
  const messages = getLocalStorage<Message[]>(STORAGE_KEY, []);
  const updated = messages.map((msg) => {
    if (msg.id === messageId && msg.receiver === currentUser && !msg.read) {
      return {
        ...msg,
        read: true,
        readAt: new Date().toISOString(),
      };
    }
    return msg;
  });
  setLocalStorage(STORAGE_KEY, updated);

  // Supabase 동기화
  if (isSupabaseConfigured()) {
    (async () => {
      try {
        await updateMessageReadStatus(messageId, true);
      } catch (error) {
        console.error("[markMessageAsRead] Supabase 동기화 실패:", error);
      }
    })();
  }
}

/**
 * 대화 목록 가져오기
 */
export async function getConversations(
  currentUser: string
): Promise<Conversation[]> {
  const allMessages = await getMessages();
  const conversationMap = new Map<string, Conversation>();

  // 현재 사용자가 참여한 메시지만 필터링
  const userMessages = allMessages.filter(
    (msg) => msg.sender === currentUser || msg.receiver === currentUser
  );

  userMessages.forEach((msg) => {
    const otherUser =
      msg.sender === currentUser ? msg.receiver : msg.sender;
    const conversationId = getConversationId(currentUser, otherUser);

    if (!conversationMap.has(conversationId)) {
      conversationMap.set(conversationId, {
        id: conversationId,
        participant1: currentUser,
        participant2: otherUser,
        unreadCount: 0,
        updatedAt: msg.timestamp,
      });
    }

    const conversation = conversationMap.get(conversationId)!;
    
    // 마지막 메시지 업데이트
    if (
      !conversation.lastMessage ||
      new Date(msg.timestamp) > new Date(conversation.lastMessage.timestamp)
    ) {
      conversation.lastMessage = msg;
      conversation.updatedAt = msg.timestamp;
    }

    // 미읽음 개수 계산 (수신자이고 읽지 않은 경우)
    if (msg.receiver === currentUser && !msg.read) {
      conversation.unreadCount++;
    }
  });

  // 최신순 정렬
  return Array.from(conversationMap.values()).sort((a, b) => {
    return (
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });
}

/**
 * 대화의 모든 메시지 읽음 표시
 */
export async function markConversationAsRead(
  currentUser: string,
  otherUser: string
): Promise<void> {
  // 모든 메시지 가져오기 (Supabase + localStorage 병합)
  const allMessages = await getMessages();
  
  // 실제로 읽지 않은 메시지가 있는지 확인
  const hasUnreadMessages = allMessages.some(
    (msg) => msg.receiver === currentUser && msg.sender === otherUser && !msg.read
  );
  
  // 읽지 않은 메시지가 없으면 업데이트하지 않음
  if (!hasUnreadMessages) {
    return;
  }
  
  // 읽지 않은 메시지들을 읽음 처리
  const messageIdsToUpdate: string[] = [];
  const updated = allMessages.map((msg) => {
    if (msg.receiver === currentUser && msg.sender === otherUser && !msg.read) {
      messageIdsToUpdate.push(msg.id);
      return {
        ...msg,
        read: true,
        readAt: new Date().toISOString(),
      };
    }
    return msg;
  });
  
  // localStorage 업데이트
  setLocalStorage(STORAGE_KEY, updated);

  // 커스텀 이벤트 트리거 (MessageBell과 메시지 페이지가 감지)
  try {
    window.dispatchEvent(new CustomEvent("messages-updated"));
  } catch (e) {
    // CustomEvent 생성 실패는 무시
  }

  // Supabase 동기화 (읽음 처리한 메시지들만 업데이트)
  if (isSupabaseConfigured() && messageIdsToUpdate.length > 0) {
    await Promise.all(
      messageIdsToUpdate.map((msgId) =>
        updateMessageReadStatus(msgId, true).catch((e) =>
          console.error("[markConversationAsRead] Supabase 실패:", e)
        )
      )
    );
  }
}

/**
 * 메시지 삭제
 */
export function deleteMessage(messageId: string): void {
  const messages = getLocalStorage<Message[]>(STORAGE_KEY, []);
  const filtered = messages.filter((msg) => msg.id !== messageId);
  setLocalStorage(STORAGE_KEY, filtered);
}

/**
 * 전체 미읽음 메시지 개수 가져오기
 */
export async function getTotalUnreadCount(
  currentUser: string
): Promise<number> {
  const allMessages = await getMessages();
  return allMessages.filter(
    (msg) => msg.receiver === currentUser && !msg.read
  ).length;
}

/**
 * 시간 포맷팅
 */
export function formatMessageTime(timestamp: string): string {
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
  
  // 같은 해면 월일만, 다른 해면 년월일
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

