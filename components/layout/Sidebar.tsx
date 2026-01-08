"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  CalendarIcon,
  TaskIcon,
  FileIcon,
  ImageIcon,
  StartupIcon,
  FinanceIcon,
  InterviewIcon,
  SurveyIcon,
  DocumentIcon,
  CommunicationIcon,
  MessageIcon,
} from "../icons/Icon";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import MessageBell from "./MessageBell";
import { useUser } from "@/lib/context/UserContext";

const menuItems = [
  { name: "대시보드", href: "/", Icon: DashboardIcon },
  { name: "일정룸", href: "/calendar", Icon: CalendarIcon },
  { name: "프로젝트룸", href: "/tasks", Icon: TaskIcon },
  { name: "프로젝트 자료", href: "/files", Icon: FileIcon },
  { name: "2026 예비창업패키지", href: "/yechangpack", Icon: StartupIcon },
  { name: "재무 관리", href: "/finance", Icon: FinanceIcon },
  { name: "고객 검증", href: "/research", Icon: InterviewIcon },
  { name: "소통공간", href: "/communication", Icon: CommunicationIcon },
  {
    name: "예창패 가이드북",
    href: "/inbloom/index.html",
    Icon: FileIcon,
    external: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, setUser } = useUser();

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] h-screen fixed left-0 top-0 flex flex-col">
      {/* 로고 영역 */}
      <div className="p-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FEE2E2] via-[#FCE7F3] to-[#F3E8FF] flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg
              className="w-6 h-6 text-[#DC2626]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#1a1a1a] leading-tight">
              특별시
            </h1>
            <p className="text-xs text-[#4a5568] mt-0.5 leading-tight">
              The Special Time
            </p>
          </div>
        </div>
      </div>

      {/* 검색 및 알림 */}
      <div className="p-3 border-b border-[#E5E7EB] space-y-2">
        <SearchBar />
        <div className="flex items-center justify-end gap-2">
          <MessageBell />
          <NotificationBell />
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 p-3">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.Icon;
            const isExternal = item.external === true;

            if (isExternal) {
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors text-[#4a5568] hover:bg-[#F5F5F5] hover:text-[#1a1a1a]"
                  >
                    <Icon className="text-[#6B7280] w-4 h-4" />
                    <span className="leading-tight">{item.name}</span>
                    <span className="text-xs ml-auto">↗</span>
                  </a>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#3B82F6] text-white"
                      : "text-[#4a5568] hover:bg-[#F5F5F5] hover:text-[#1a1a1a]"
                  }`}
                >
                  <Icon
                    className={`${
                      isActive ? "text-white" : "text-[#4a5568]"
                    } w-4 h-4`}
                  />
                  <span className="leading-tight">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 사용자 정보 */}
      <div className="p-3 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white"
            style={{ backgroundColor: user?.color || "#3B82F6" }}
          >
            <span className="text-xs font-medium leading-none">
              {user?.initial || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#1a1a1a] truncate leading-tight">
              {user?.name || "사용자"}
            </div>
            <div className="text-xs text-[#4a5568] leading-tight">
              {user?.role || ""}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setUser(null);
            localStorage.removeItem("team-dashboard-user");
          }}
          className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
