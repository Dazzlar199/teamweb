"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, getUserInfo, TeamMemberName, isAdmin as checkIsAdmin, canModify as checkCanModify } from "@/lib/types/user";
import { TEAM_MEMBERS } from "@/lib/constants/team";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canModify: (resourceAuthor: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // LocalStorage에서 사용자 정보 로드
    const savedUser = localStorage.getItem("team-dashboard-user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(getUserInfo(userData.name));
      } catch (e) {
        console.error("사용자 정보 로드 실패:", e);
        // 로그인하지 않은 상태로 유지
        setUser(null);
      }
    }
    // 로그인하지 않은 경우 user는 null로 유지
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(
        "team-dashboard-user",
        JSON.stringify({ name: newUser.name })
      );
    } else {
      localStorage.removeItem("team-dashboard-user");
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: handleSetUser,
        isAuthenticated: user !== null,
        isAdmin: checkIsAdmin(user),
        canModify: (resourceAuthor: string) => checkCanModify(user, resourceAuthor),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

