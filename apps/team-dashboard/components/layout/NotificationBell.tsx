"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount, requestNotificationPermission, subscribeToNotifications } from "@/lib/utils/notifications";
import type { Notification } from "@/lib/utils/notifications";
import { useUser } from "@/lib/context/UserContext";

export default function NotificationBell() {
  const { user } = useUser();
  const currentUser = user?.name;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    const notifs = await getNotifications(currentUser);
    const unread = await getUnreadCount(currentUser);
    setNotifications(notifs);
    setUnreadCount(unread);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      
      // Supabase Realtime 구독 (실시간 업데이트)
      const unsubscribe = subscribeToNotifications(currentUser, () => {
        loadNotifications();
      });
      
      // 폴백: 주기적 업데이트 (Realtime이 작동하지 않을 경우를 대비)
      const interval = setInterval(loadNotifications, 30000); // 30초마다 업데이트 (Realtime이 있으므로 덜 자주)
      
      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [currentUser, loadNotifications]);

  useEffect(() => {
    // 브라우저 알림 권한 요청
    requestNotificationPermission();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    if (!currentUser) return;
    await markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    await markAllAsRead(currentUser);
    loadNotifications();
  };

  const isReadByCurrentUser = (notif: Notification): boolean => {
    // Supabase 연동 시 read 필드 사용
    return notif.read === true;
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    loadNotifications();
  };

  const formatTime = (timestamp: string) => {
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
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return "⏰";
      case "comment":
        return "💬";
      case "feedback":
        return "📝";
      case "event":
        return "📅";
      default:
        return "🔔";
    }
  };

  useEffect(() => {
    if (showDropdown && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 사이드바 너비 (256px = w-64)
      const sidebarWidth = 256;
      
      // 드롭다운을 버튼 아래, 사이드바 오른쪽에 배치
      dropdown.style.left = `${sidebarWidth + 8}px`; // 사이드바 + 여백
      dropdown.style.top = `${buttonRect.bottom + 8}px`; // 버튼 아래
      
      // 화면 오른쪽 경계 확인
      const dropdownWidth = 320; // w-80 = 320px
      if (buttonRect.left + dropdownWidth > viewportWidth) {
        dropdown.style.left = `${Math.max(8, viewportWidth - dropdownWidth - 8)}px`;
      }
      
      // 화면 아래 경계 확인
      const dropdownHeight = Math.min(384, viewportHeight - buttonRect.bottom - 16); // max-h-96 = 384px
      if (buttonRect.bottom + dropdownHeight > viewportHeight) {
        dropdown.style.top = `${Math.max(8, viewportHeight - dropdownHeight - 8)}px`;
      }
    }
  }, [showDropdown]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-[#6B7280] hover:text-[#111827] transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-[#EF4444] text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div 
            ref={dropdownRef}
            className="fixed w-80 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
            style={{ display: showDropdown ? 'block' : 'none' }}
          >
            <div className="p-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111827] leading-tight">
                알림
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] leading-tight"
                >
                  모두 읽음
                </button>
              )}
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 hover:bg-[#F9FAFB] transition-colors ${
                      !isReadByCurrentUser(notif) ? "bg-[#EFF6FF]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-lg flex-shrink-0">
                          {getNotificationIcon(notif.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-medium text-[#111827] leading-tight">
                              {notif.title}
                            </h4>
                            {!isReadByCurrentUser(notif) && (
                              <span className="w-2 h-2 bg-[#2563EB] rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7280] leading-tight mb-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-[#9CA3AF] leading-tight">
                            {formatTime(notif.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isReadByCurrentUser(notif) && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] leading-tight"
                            title="읽음 표시"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="text-xs text-[#6B7280] hover:text-[#EF4444] leading-tight"
                          title="삭제"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#9CA3AF]">알림이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

