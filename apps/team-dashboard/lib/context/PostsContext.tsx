"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, startTransition } from "react";
import { Post } from "@/lib/types/post";
import { getPosts } from "@/lib/utils/post";

interface PostsContextType {
  posts: Post[];
  refreshPosts: () => Promise<void>;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);

  const refreshPosts = useCallback(async () => {
    const data = await getPosts();
    setPosts(data);
  }, []);

  useEffect(() => {
    // ⚡ 100ms 지연 후 로드 (페이지 로딩 우선)
    const timer = setTimeout(() => {
      const initData = async () => {
        const data = await getPosts();
        startTransition(() => {
          setPosts(data);
        });
      };
      initData();
    }, 100);

    return () => clearTimeout(timer);

    // 타 탭에서의 변경 감지 (디바운싱)
    let timeout: NodeJS.Timeout;
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "team-posts") {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          const data = await getPosts();
          startTransition(() => {
            setPosts(data);
          });
        }, 300); // 300ms 디바운싱
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearTimeout(timeout);
    };
  }, []);

  const contextValue = useMemo(() => ({
    posts,
    refreshPosts,
    setPosts
  }), [posts, refreshPosts]);

  return (
    <PostsContext.Provider value={contextValue}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) throw new Error("usePosts must be used within PostsProvider");
  return context;
}
