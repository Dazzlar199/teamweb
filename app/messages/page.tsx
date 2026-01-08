"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/context/UserContext";
import { TEAM_MEMBERS, TEAM_MEMBER_NAMES } from "@/lib/constants/team";
import {
  getMessagesWithUser,
  sendMessage,
  markConversationAsRead,
  getConversations,
  formatMessageTime,
  subscribeToMessages,
} from "@/lib/utils/message";
import { addActivityLog } from "@/lib/utils/activityLog";
import type { Message, Conversation } from "@/lib/types/message";

export default function MessagesPage() {
  const { user } = useUser();
  const currentUser = user?.name || "";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 대화 목록 로드
  useEffect(() => {
    if (currentUser) {
      loadConversations();
      
      // localStorage 변경 감지 (다른 탭에서 변경 시)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "team-dashboard-messages") {
          loadConversations();
          if (selectedUser) {
            loadMessages(selectedUser);
          }
        }
      };
      window.addEventListener("storage", handleStorageChange);
      
      // 커스텀 이벤트 감지 (같은 탭에서 변경 시)
      const handleMessagesUpdated = () => {
        loadConversations();
        if (selectedUser) {
          loadMessages(selectedUser);
        }
      };
      window.addEventListener("messages-updated", handleMessagesUpdated);
      
      // Supabase Realtime 구독 (실시간 업데이트)
      const unsubscribe = subscribeToMessages(() => {
        loadConversations();
        if (selectedUser) {
          loadMessages(selectedUser);
        }
      });
      
      // 폴백: 주기적 업데이트 (30초마다) - Realtime이 있으므로 덜 자주
      const interval = setInterval(() => {
        loadConversations();
        if (selectedUser) {
          loadMessages(selectedUser);
        }
      }, 30000);
      
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("messages-updated", handleMessagesUpdated);
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [currentUser, selectedUser]);

  // 메시지가 업데이트되면 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!currentUser) return;
    try {
      const convs = await getConversations(currentUser);
      setConversations(convs);
    } catch (error) {
      console.error("대화 목록 로드 실패:", error);
    }
  };

  const loadMessages = async (otherUser: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const msgs = await getMessagesWithUser(currentUser, otherUser);
      setMessages(msgs);
      
      // 읽음 표시 (이벤트가 자동으로 대화 목록을 업데이트함)
      await markConversationAsRead(currentUser, otherUser);
      // loadConversations는 이벤트 리스너에서 처리되므로 여기서는 호출하지 않음
    } catch (error) {
      console.error("메시지 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (userName: string) => {
    setSelectedUser(userName);
    loadMessages(userName);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    try {
      const message = await sendMessage(
        currentUser,
        selectedUser,
        newMessage.trim()
      );
      setNewMessage("");
      setMessages((prev) => [...prev, message]);
      
      // 스크롤을 확실하게 내리기 위해 setTimeout 사용
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      // 대화 목록 새로고침 (사이드바 업데이트)
      loadConversations();
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert("메시지 전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 팀원 목록 (현재 사용자 제외)
  const availableUsers = TEAM_MEMBER_NAMES.filter(
    (name) => name !== currentUser
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="px-6 py-3.5">
          <h1 className="text-lg font-semibold text-[#111827] leading-tight">
            메시지
          </h1>
          <p className="text-xs text-[#6B7280] mt-1 leading-tight">
            1:1 개인 메시지를 주고받으세요
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 대화 목록 사이드바 */}
        <div className="w-80 bg-white border-r border-[#E5E7EB] flex flex-col">
          {/* 새 메시지 시작 버튼 */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="text-xs font-semibold text-[#6B7280] mb-2 uppercase">
              팀원 목록
            </div>
            <div className="space-y-1">
              {availableUsers.map((userName) => {
                const member = TEAM_MEMBERS[userName];
                const conversation = conversations.find(
                  (c) =>
                    (c.participant1 === currentUser &&
                      c.participant2 === userName) ||
                    (c.participant1 === userName &&
                      c.participant2 === currentUser)
                );
                const isSelected = selectedUser === userName;
                const unreadCount = conversation?.unreadCount || 0;

                return (
                  <button
                    key={userName}
                    onClick={() => handleSelectUser(userName)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-[#EFF6FF] border border-[#3B82F6]"
                        : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: member?.color || "#6B7280",
                      }}
                    >
                      {member?.initial || userName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`text-sm font-medium ${
                            isSelected ? "text-[#3B82F6]" : "text-[#111827]"
                          }`}
                        >
                          {userName}
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation?.lastMessage && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#6B7280] truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <span className="text-xs text-[#9CA3AF] flex-shrink-0">
                            {formatMessageTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 대화 목록 */}
          {conversations.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs font-semibold text-[#6B7280] mb-2 uppercase">
                최근 대화
              </div>
              <div className="space-y-1">
                {conversations.map((conv) => {
                  const otherUser =
                    conv.participant1 === currentUser
                      ? conv.participant2
                      : conv.participant1;
                  const member = TEAM_MEMBERS[otherUser as keyof typeof TEAM_MEMBERS];
                  const isSelected = selectedUser === otherUser;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectUser(otherUser)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                        isSelected
                          ? "bg-[#EFF6FF] border border-[#3B82F6]"
                          : "hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: member?.color || "#6B7280",
                        }}
                      >
                        {member?.initial || otherUser[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-[#3B82F6]" : "text-[#111827]"
                            }`}
                          >
                            {otherUser}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-[#EF4444] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-[#6B7280] truncate">
                              {conv.lastMessage.content}
                            </p>
                            <span className="text-xs text-[#9CA3AF] flex-shrink-0">
                              {formatMessageTime(conv.lastMessage.timestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedUser ? (
            <>
              {/* 채팅 헤더 */}
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
                {(() => {
                  const member =
                    TEAM_MEMBERS[selectedUser as keyof typeof TEAM_MEMBERS];
                  return (
                    <>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                        style={{
                          backgroundColor: member?.color || "#6B7280",
                        }}
                      >
                        {member?.initial || selectedUser[0]}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-[#111827]">
                          {selectedUser}
                        </h2>
                        <p className="text-xs text-[#6B7280]">
                          {member?.role || "팀원"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 메시지 목록 */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-sm text-[#6B7280]">로딩 중...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg
                      className="w-16 h-16 text-[#D1D5DB] mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-sm text-[#6B7280]">
                      아직 메시지가 없습니다.
                      <br />
                      메시지를 보내 대화를 시작하세요.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender === currentUser;
                    const member = isOwn
                      ? TEAM_MEMBERS[currentUser as keyof typeof TEAM_MEMBERS]
                      : TEAM_MEMBERS[msg.sender as keyof typeof TEAM_MEMBERS];

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          isOwn ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {!isOwn && (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: member?.color || "#6B7280",
                            }}
                          >
                            {member?.initial || msg.sender[0]}
                          </div>
                        )}
                        <div
                          className={`flex flex-col max-w-[70%] ${
                            isOwn ? "items-end" : "items-start"
                          }`}
                        >
                          {!isOwn && (
                            <span className="text-xs text-[#6B7280] mb-1 px-1">
                              {msg.sender}
                            </span>
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwn
                                ? "bg-[#3B82F6] text-white"
                                : "bg-[#F3F4F6] text-[#111827]"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#9CA3AF]">
                              {formatMessageTime(msg.timestamp)}
                            </span>
                            {isOwn && (
                              <span className="text-xs text-[#9CA3AF]">
                                {msg.read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 메시지 입력 */}
              <form
                onSubmit={handleSendMessage}
                className="px-6 py-4 border-t border-[#E5E7EB] bg-white"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
                    className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] text-sm"
                    rows={1}
                    style={{ minHeight: "40px", maxHeight: "120px" }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    전송
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-24 h-24 text-[#D1D5DB] mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">
                  대화를 선택하세요
                </h3>
                <p className="text-sm text-[#6B7280]">
                  왼쪽에서 팀원을 선택하여 메시지를 보내세요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

