"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  CalendarIcon,
  TaskIcon,
  FileIcon,
  StartupIcon,
  FinanceIcon,
  InterviewIcon,
  CommunicationIcon,
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
    href: "https://inbloom-orpin.vercel.app/",
    Icon: FileIcon,
    external: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUser();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-50 overflow-hidden">
      {/* 로고 영역 */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-black text-slate-900 leading-tight tracking-tight">
              특별시
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Team Workspace
            </p>
          </div>
        </div>
      </div>

      {/* 검색 및 알림 (라이트 테마용 세련된 디자인) */}
      <div className="px-4 mb-2">
        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
          <SearchBar />
          <div className="flex items-center justify-end gap-1 mt-2 pr-1">
            <MessageBell />
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-3 mt-6">
          Main Menu
        </div>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.Icon;
            const isExternal = item.external === true;

            return (
              <li key={item.href}>
                {isExternal ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-bold transition-all ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`${isActive ? "text-indigo-600" : "text-slate-400"} w-4 h-4 transition-colors`} />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-[10px] opacity-40">↗</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-bold transition-all ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`${isActive ? "text-indigo-600" : "text-slate-400"} w-4 h-4 transition-colors`} />
                    <span className="flex-1">{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 사용자 정보 (깔끔한 카드 스타일) */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-sm ring-2 ring-slate-50 ring-offset-2 ring-offset-white shadow-sm"
              style={{ backgroundColor: user?.color || "#4f46e5" }}
            >
              {user?.initial || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate leading-tight">
                {user?.name || "사용자"}
              </div>
              <div className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                {user?.role || "팀원"}
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              await setUser(null);
              localStorage.removeItem("team-dashboard-user");
              router.push('/login');
            }}
            className="w-full py-2 text-[11.5px] font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-all border border-slate-100 hover:border-rose-100"
          >
            로그아웃
          </button>
        </div>
      </div>
    </aside>
  );
}
