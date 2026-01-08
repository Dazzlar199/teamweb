"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTotalUnreadCount, getConversations } from "@/lib/utils/message";
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

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount();
      
      // localStorage 변경 감지 (다른 탭에서 변경 시)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "team-dashboard-messages") {
          loadUnreadCount();
        }
      };
      window.addEventListener("storage", handleStorageChange);
      
      // 커스텀 이벤트 감지 (같은 탭에서 변경 시)
      const handleMessagesUpdated = () => {
        loadUnreadCount();
      };
      window.addEventListener("messages-updated", handleMessagesUpdated);
      
      // 페이지 포커스 시 업데이트
      const handleFocus = () => {
        loadUnreadCount();
      };
      window.addEventListener("focus", handleFocus);
      
      // 주기적 업데이트 (10초마다) - 너무 빈번하지 않도록
      const interval = setInterval(loadUnreadCount, 10000);
      
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("messages-updated", handleMessagesUpdated);
        window.removeEventListener("focus", handleFocus);
        clearInterval(interval);
      };
    }
  }, [currentUser]);

  const loadUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const count = await getTotalUnreadCount(currentUser);
      setUnreadCount(count);
      
      // 대화 목록도 가져와서 미리보기용으로 사용
      const convs = await getConversations(currentUser);
      setConversations(convs);
    } catch (error) {
      console.error("미읽음 메시지 개수 로드 실패:", error);
    }
  };

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

