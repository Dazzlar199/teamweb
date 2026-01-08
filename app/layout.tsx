import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";
import { UserProvider } from "@/lib/context/UserContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import { DataProvider } from "@/lib/context/DataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "특별시 (The Special Time) - 팀 대시보드",
  description: "특별시 팀의 내부 협업 및 관리 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <ToastProvider>
            <DataProvider>
              <MainLayout>{children}</MainLayout>
            </DataProvider>
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
