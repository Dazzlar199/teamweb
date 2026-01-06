"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, getUserInfo, TeamMemberName } from "@/lib/types/user";
import { TEAM_MEMBERS } from "@/lib/constants/team";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
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
        // 기본 사용자로 설정 (임시)
        setUser(getUserInfo("김찬주"));
      }
    } else {
      // 기본 사용자로 설정 (임시)
      setUser(getUserInfo("김찬주"));
    }
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

