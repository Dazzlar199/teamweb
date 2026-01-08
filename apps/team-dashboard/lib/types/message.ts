// 메시지 관련 타입 정의

export interface Message {
  id: string;
  sender: string; // 발신자 이름
  receiver: string; // 수신자 이름
  content: string; // 메시지 내용
  timestamp: string; // ISO 형식 타임스탬프
  read: boolean; // 읽음 여부
  readAt?: string; // 읽은 시간
}

export interface Conversation {
  id: string; // "user1-user2" 형식 (정렬된 이름)
  participant1: string;
  participant2: string;
  lastMessage?: Message;
  unreadCount: number; // 현재 사용자의 미읽음 개수
  updatedAt: string;
}

