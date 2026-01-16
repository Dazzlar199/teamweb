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
import { useToast } from "@/lib/context/ToastContext";
import type { Message, Conversation } from "@/lib/types/message";

export default function MessagesPage() {
  const { user } = useUser();
  const { showToast } = useToast();
  const currentUser = user?.name || "";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 실시간 동기화 (currentUser가 변경될 때만 재구독)
  useEffect(() => {
    if (!currentUser) return;

    loadConversations();
    const unsubscribe = subscribeToMessages(() => {
      loadConversations();
    });

    return () => unsubscribe();
  }, [currentUser]);

  // selectedUser 변경 시 메시지 로드
  useEffect(() => {
    if (selectedUser && currentUser) {
      loadMessages(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await getConversations(currentUser);
      setConversations(convs);
    } catch (e) {}
  };

  const loadMessages = async (otherUser: string) => {
    setIsLoading(true);
    try {
      const msgs = await getMessagesWithUser(currentUser, otherUser);
      setMessages(msgs);
      await markConversationAsRead(currentUser, otherUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const msg = await sendMessage(currentUser, selectedUser, newMessage.trim());
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
      loadConversations();
    } catch (e) {
      showToast("메시지 전송 실패", "error");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        
        {/* 1. 사이드바: 대화 목록 (슬랙 스타일) */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">메시지</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Messages</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Members</div>
            {TEAM_MEMBER_NAMES.filter(n => n !== currentUser).map(userName => {
              const member = TEAM_MEMBERS[userName as keyof typeof TEAM_MEMBERS];
              const conv = conversations.find(c => c.participant1 === userName || c.participant2 === userName);
              const isSelected = selectedUser === userName;
              
              return (
                <button
                  key={userName}
                  onClick={() => { setSelectedUser(userName); loadMessages(userName); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${isSelected ? "border-indigo-400" : "border-white shadow-sm"}`} style={{ backgroundColor: member?.color }}>
                    {userName[0]}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold truncate">{userName}</span>
                      {conv?.unreadCount && conv.unreadCount > 0 && !isSelected && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </div>
                    <p className={`text-[11px] truncate ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                      {conv?.lastMessage?.content || `${member?.role || '팀원'}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 메인: 채팅창 영역 */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedUser ? (
            <>
              {/* 채팅 헤더 */}
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-sm" style={{ backgroundColor: TEAM_MEMBERS[selectedUser as keyof typeof TEAM_MEMBERS]?.color }}>
                    {selectedUser[0]}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">{selectedUser}</h2>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Active Now</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 메시지 리스트 */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
                {messages.map((msg, idx) => {
                  const isOwn = msg.sender === currentUser;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-slide-in`}>
                      <div className={`max-w-[70%] group`}>
                        {!isOwn && <p className="text-[11px] font-black text-slate-400 mb-1.5 ml-1">{msg.sender}</p>}
                        <div className={`px-5 py-3 rounded-2xl text-[14px] font-medium shadow-sm leading-relaxed ${
                          isOwn ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] font-bold text-slate-300">{formatMessageTime(msg.timestamp)}</span>
                          {isOwn && <span className="text-[10px] font-black text-indigo-400">{msg.read ? "Read" : "Sent"}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* 메시지 입력창 (고급스러운 플로팅 스타일) */}
              <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="relative flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                    placeholder={`${selectedUser}에게 메시지 보내기...`}
                    className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-sm font-medium resize-none min-h-[44px] max-h-32"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-md shadow-indigo-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-slate-400">
              <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="text-sm font-black uppercase tracking-widest">Select a team member to chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}