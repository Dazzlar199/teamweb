"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTotalUnreadCount, getConversations, subscribeToMessages } from "@/lib/utils/message";
import { useUser } from "@/lib/context/UserContext";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import { PaperPlaneIcon } from "../icons/Icon";
import type { Conversation } from "@/lib/types/message";

export default function MessageBell() {
  const { user } = useUser();
  const currentUser = user?.name;
  const router = useRouter();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const loadUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const count = await getTotalUnreadCount(currentUser);
      setUnreadCount(count);
    } catch (e) {
      console.error("메시지 카운트 로드 실패:", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount();
      
      // localStorage 변경 감지 (다른 탭에서 변경 시)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key && e.key.includes('message')) {
          loadUnreadCount();
        }
      };
      
      // 커스텀 이벤트 감지 (같은 탭 내 업데이트)
      const handleMessageUpdate = () => {
        loadUnreadCount();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('message-update', handleMessageUpdate);
      
      // Supabase Realtime 구독
      const unsubscribe = subscribeToMessages(currentUser, () => {
        loadUnreadCount();
        // 소리 알림 등 추가 가능
      });

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('message-update', handleMessageUpdate);
        unsubscribe();
      };
    }
  }, [currentUser]);

  const handleClick = () => {
    router.push("/messages");
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="relative p-2 text-[#6B7280] hover:text-[#111827] transition-colors"
        title="메시지"
      >
        <PaperPlaneIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#EF4444] text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

