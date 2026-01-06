import { getLocalStorage, setLocalStorage } from "./localStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Post, Comment } from "@/lib/types/post";

const STORAGE_KEY = "team-posts";

// ============================================
// Supabase 함수들
// ============================================

async function getPostsFromSupabase(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // comments는 별도로 가져오기
    if (data && data.length > 0) {
      const postIds = data.map((p) => p.id);
      const { data: commentsData } = await supabase
        .from("comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      return data.map((post) => ({
        ...post,
        comments: (commentsData || []).filter((c) => c.post_id === post.id),
      })) as Post[];
    }

    return [];
  } catch (error) {
    console.error("Supabase에서 게시글 가져오기 실패:", error);
    return [];
  }
}

async function savePostToSupabase(post: Post): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // comments는 별도로 저장
    const { comments, ...postData } = post;

    const { error: postError } = await supabase
      .from("posts")
      .upsert(postData, { onConflict: "id" });

    if (postError) throw postError;

    // 기존 댓글 삭제 후 새로 저장
    await supabase.from("comments").delete().eq("post_id", post.id);

    if (comments && comments.length > 0) {
      const commentsToInsert = comments.map((comment) => ({
        ...comment,
        post_id: comment.postId,
      }));

      const { error: commentsError } = await supabase
        .from("comments")
        .insert(commentsToInsert);

      if (commentsError) throw commentsError;
    }
  } catch (error) {
    console.error("Supabase에 게시글 저장 실패:", error);
    throw error;
  }
}

async function deletePostFromSupabase(postId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // comments는 CASCADE로 자동 삭제됨
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase에서 게시글 삭제 실패:", error);
    throw error;
  }
}

async function incrementViewsInSupabase(postId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { data } = await supabase
      .from("posts")
      .select("views")
      .eq("id", postId)
      .single();

    if (data) {
      await supabase
        .from("posts")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", postId);
    }
  } catch (error) {
    console.error("Supabase 조회수 증가 실패:", error);
  }
}

// ============================================
// 통합 함수들 (localStorage 또는 Supabase 자동 선택)
// ============================================

// 게시글 목록 가져오기
export async function getPosts(): Promise<Post[]>;
export function getPosts(): Post[] | Promise<Post[]>;
export function getPosts(): Post[] | Promise<Post[]> {
  if (isSupabaseConfigured()) {
    return getPostsFromSupabase();
  }
  return getLocalStorage<Post[]>(STORAGE_KEY, []);
}

// 게시글 저장
export async function savePost(post: Post): Promise<void>;
export function savePost(post: Post): void | Promise<void>;
export function savePost(post: Post): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return savePostToSupabase(post);
  }

  // localStorage 로직
  const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
  const index = posts.findIndex((p) => p.id === post.id);

  if (index >= 0) {
    posts[index] = post;
  } else {
    posts.unshift(post);
  }

  posts.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  setLocalStorage(STORAGE_KEY, posts);
}

// 게시글 삭제
export async function deletePost(postId: string): Promise<void>;
export function deletePost(postId: string): void | Promise<void>;
export function deletePost(postId: string): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return deletePostFromSupabase(postId);
  }

  const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
  const filtered = posts.filter((p) => p.id !== postId);
  setLocalStorage(STORAGE_KEY, filtered);
}

// 게시글 ID로 가져오기
export async function getPostById(postId: string): Promise<Post | undefined>;
export function getPostById(postId: string): Post | undefined | Promise<Post | undefined>;
export function getPostById(postId: string): Post | undefined | Promise<Post | undefined> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

        if (error || !data) return undefined;

        // 댓글 가져오기
        const { data: commentsData } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        return {
          ...data,
          comments: (commentsData || []).map((c) => ({
            ...c,
            postId: c.post_id,
          })),
        } as Post;
      } catch (error) {
        console.error("Supabase에서 게시글 가져오기 실패:", error);
        return undefined;
      }
    })();
  }

  const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
  return posts.find((p) => p.id === postId);
}

// 조회수 증가
export async function incrementViews(postId: string): Promise<void>;
export function incrementViews(postId: string): void | Promise<void>;
export function incrementViews(postId: string): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return incrementViewsInSupabase(postId);
  }

  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find((p) => p.id === postId);
  if (post) {
    post.views += 1;
    savePost(post);
  }
}

// 좋아요 토글
export async function toggleLike(postId: string, userName: string): Promise<void>;
export function toggleLike(postId: string, userName: string): void | Promise<void>;
export function toggleLike(postId: string, userName: string): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        const { data } = await supabase
          .from("posts")
          .select("likes")
          .eq("id", postId)
          .single();

        if (data) {
          const likes = (data.likes || []) as string[];
          const index = likes.indexOf(userName);
          if (index >= 0) {
            likes.splice(index, 1);
          } else {
            likes.push(userName);
          }

          await supabase
            .from("posts")
            .update({ likes })
            .eq("id", postId);
        }
      } catch (error) {
        console.error("Supabase 좋아요 토글 실패:", error);
      }
    })();
  }

  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find((p) => p.id === postId);
  if (post) {
    const index = post.likes.indexOf(userName);
    if (index >= 0) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userName);
    }
    savePost(post);
  }
}

// 댓글 추가
export async function addComment(postId: string, comment: Comment): Promise<void>;
export function addComment(postId: string, comment: Comment): void | Promise<void>;
export function addComment(postId: string, comment: Comment): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        await supabase.from("comments").insert({
          ...comment,
          post_id: comment.postId,
        });
      } catch (error) {
        console.error("Supabase 댓글 추가 실패:", error);
      }
    })();
  }

  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find((p) => p.id === postId);
  if (post) {
    post.comments.push(comment);
    savePost(post);
  }
}

// 댓글 수정
export async function updateComment(
  postId: string,
  commentId: string,
  content: string
): Promise<void>;
export function updateComment(
  postId: string,
  commentId: string,
  content: string
): void | Promise<void>;
export function updateComment(
  postId: string,
  commentId: string,
  content: string
): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        await supabase
          .from("comments")
          .update({ content, updated_at: Date.now() })
          .eq("id", commentId)
          .eq("post_id", postId);
      } catch (error) {
        console.error("Supabase 댓글 수정 실패:", error);
      }
    })();
  }

  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find((p) => p.id === postId);
  if (post) {
    const comment = post.comments.find((c) => c.id === commentId);
    if (comment) {
      comment.content = content;
      comment.updatedAt = Date.now();
      savePost(post);
    }
  }
}

// 댓글 삭제
export async function deleteComment(postId: string, commentId: string): Promise<void>;
export function deleteComment(postId: string, commentId: string): void | Promise<void>;
export function deleteComment(postId: string, commentId: string): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        await supabase.from("comments").delete().eq("id", commentId).eq("post_id", postId);
      } catch (error) {
        console.error("Supabase 댓글 삭제 실패:", error);
      }
    })();
  }

  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find((p) => p.id === postId);
  if (post) {
    post.comments = post.comments.filter((c) => c.id !== commentId);
    savePost(post);
  }
}

// 댓글 좋아요 토글
export async function toggleCommentLike(
  postId: string,
  commentId: string,
  userName: string
): Promise<void>;
export function toggleCommentLike(
  postId: string,
  commentId: string,
  userName: string
): void | Promise<void>;
export function toggleCommentLike(
  postId: string,
  commentId: string,
  userName: string
): void | Promise<void> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        const { data } = await supabase
          .from("comments")
          .select("likes")
          .eq("id", commentId)
          .eq("post_id", postId)
          .single();

        if (data) {
          const likes = (data.likes || []) as string[];
          const index = likes.indexOf(userName);
          if (index >= 0) {
            likes.splice(index, 1);
          } else {
            likes.push(userName);
          }

          await supabase
            .from("comments")
            .update({ likes })
            .eq("id", commentId)
            .eq("post_id", postId);
        }
      } catch (error) {
        console.error("Supabase 댓글 좋아요 토글 실패:", error);
      }
    })();
  }

  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find((p) => p.id === postId);
  if (post) {
    const comment = post.comments.find((c) => c.id === commentId);
    if (comment) {
      const index = comment.likes.indexOf(userName);
      if (index >= 0) {
        comment.likes.splice(index, 1);
      } else {
        comment.likes.push(userName);
      }
      savePost(post);
    }
  }
}

// 카테고리별 게시글 필터링
export async function getPostsByCategory(category: string): Promise<Post[]>;
export function getPostsByCategory(category: string): Post[] | Promise<Post[]>;
export function getPostsByCategory(category: string): Post[] | Promise<Post[]> {
  if (isSupabaseConfigured()) {
    return (async () => {
      const posts = await getPostsFromSupabase();
      if (category === "all") return posts;
      return posts.filter((p) => p.category === category);
    })();
  }

  const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
  if (category === "all") return posts;
  return posts.filter((p) => p.category === category);
}

// 검색
export async function searchPosts(query: string): Promise<Post[]>;
export function searchPosts(query: string): Post[] | Promise<Post[]>;
export function searchPosts(query: string): Post[] | Promise<Post[]> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        const lowerQuery = query.toLowerCase();
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,author.ilike.%${query}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // 댓글도 함께 가져오기
        if (data && data.length > 0) {
          const postIds = data.map((p) => p.id);
          const { data: commentsData } = await supabase
            .from("comments")
            .select("*")
            .in("post_id", postIds);

          return data.map((post) => ({
            ...post,
            comments: (commentsData || []).filter((c) => c.post_id === post.id),
          })) as Post[];
        }

        return [];
      } catch (error) {
        console.error("Supabase 검색 실패:", error);
        return [];
      }
    })();
  }

  const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
  const lowerQuery = query.toLowerCase();
  return posts.filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.author.toLowerCase().includes(lowerQuery)
  );
}
