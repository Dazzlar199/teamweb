"use client";

import Sidebar from "./Sidebar";
import LoginForm from "@/components/auth/LoginForm";
import { useUser } from "@/lib/context/UserContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  // 로그인되지 않은 경우 로그인 페이지 표시
  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">{children}</main>
    </div>
  );
}
