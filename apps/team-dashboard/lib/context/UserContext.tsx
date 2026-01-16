"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { User, getUserInfo, isAdmin as checkIsAdmin, canModify as checkCanModify } from "@/lib/types/user";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();

  useEffect(() => {
    // 초기 세션 확인
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
         // 이메일 주소의 로컬 파트(아이디)를 이름으로 사용하거나, 메타데이터 사용
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Unknown";
        setUser(getUserInfo(name));
      }
    };
    
    checkSession();

    // Auth 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Unknown";
        setUser(getUserInfo(name));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSetUser = useCallback(async (newUser: User | null) => {
    if (newUser === null) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
       // setUser는 이제 내부 상태 업데이트용보다는 로그아웃용으로 주로 쓰임
       setUser(newUser);
    }
  }, [supabase]);

  const isAuthenticated = useMemo(() => user !== null, [user]);
  const isAdmin = useMemo(() => checkIsAdmin(user), [user]);
  const canModifyFn = useCallback((resourceAuthor: string) => checkCanModify(user, resourceAuthor), [user]);

  const contextValue = useMemo(() => ({
    user,
    setUser: handleSetUser,
    isAuthenticated,
    isAdmin,
    canModify: canModifyFn,
  }), [user, handleSetUser, isAuthenticated, isAdmin, canModifyFn]);

  return (
    <UserContext.Provider value={contextValue}>
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

