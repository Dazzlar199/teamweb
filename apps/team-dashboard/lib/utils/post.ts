import { getLocalStorage, setLocalStorage } from "./localStorage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Post, Comment } from "@/lib/types/post";
import { addNotification } from "./notifications";
import { TEAM_MEMBER_NAMES } from "@/lib/constants/team";

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
    if (!data) return [];

    // 댓글도 함께 가져오기
    const postIds = data.map((p) => p.id);
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    return data.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      author: post.author,
      createdAt: post.created_at,
      updatedAt: post.updated_at || undefined,
      views: post.views || 0,
      likes: post.likes || [],
      pinned: post.pinned || false,
      comments: (commentsData || [])
        .filter((c: any) => c.post_id === post.id)
        .map((c: any) => ({
          id: c.id,
          postId: c.post_id,
          content: c.content,
          author: c.author,
          createdAt: c.created_at,
          updatedAt: c.updated_at || undefined,
          likes: c.likes || [],
        })),
    })) as Post[];
  } catch (error) {
    console.error("Supabase에서 게시글 가져오기 실패:", error);
    return [];
  }
}

async function savePostToSupabase(post: Post): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabasePost = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      author: post.author,
      created_at: post.createdAt,
      updated_at: post.updatedAt || null,
      views: post.views || 0,
      likes: post.likes || [],
      pinned: post.pinned || false,
    };

    // 기존 게시글 확인
    const { data: existingPost } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post.id)
      .maybeSingle();

    if (existingPost) {
      // 업데이트
      const { error } = await supabase
        .from("posts")
        .update(supabasePost)
        .eq("id", post.id);
      if (error) throw error;
    } else {
      // 삽입
      const { error } = await supabase.from("posts").insert([supabasePost]);
      if (error) throw error;
    }
  } catch (error) {
    console.error("Supabase 게시글 저장 실패:", error);
    throw error;
  }
}

async function deletePostFromSupabase(postId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  } catch (error) {
    console.error("Supabase 게시글 삭제 실패:", error);
    throw error;
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
export async function savePost(post: Post): Promise<void> {
  const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
  const index = posts.findIndex((p) => p.id === post.id);
  const isNewPost = index < 0;

  // Supabase 먼저 저장 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      await savePostToSupabase(post);

      // 새 게시글 작성 시 알림 (작성자 제외 전원)
      if (isNewPost) {
        await addNotification({
          type: 'comment',
          title: '새 게시글 등록',
          message: `${post.author}님이 소통공간에 새 글을 올렸습니다: ${post.title}`,
          link: '/communication'
        }, [...TEAM_MEMBER_NAMES].filter(u => u !== post.author));
      }
    } catch (error) {
      console.error("Supabase 게시글 저장 실패:", error);
      throw new Error("게시글 저장에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
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
export async function deletePost(postId: string): Promise<void> {
  // Supabase 먼저 삭제 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      await deletePostFromSupabase(postId);
    } catch (error) {
      console.error("Supabase 게시글 삭제 실패:", error);
      throw new Error("게시글 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
  const filtered = posts.filter((p) => p.id !== postId);
  setLocalStorage(STORAGE_KEY, filtered);
}

// 게시글 ID로 가져오기
export async function getPostById(postId: string): Promise<Post | undefined>;
export function getPostById(
  postId: string
): Post | undefined | Promise<Post | undefined>;
export function getPostById(
  postId: string
): Post | undefined | Promise<Post | undefined> {
  if (isSupabaseConfigured()) {
    return (async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .maybeSingle();

        if (error || !data) return undefined;

        // 댓글 가져오기
        const { data: commentsData } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        return {
          id: data.id,
          title: data.title,
          content: data.content,
          category: data.category,
          author: data.author,
          createdAt: data.created_at,
          updatedAt: data.updated_at || undefined,
          views: data.views || 0,
          likes: data.likes || [],
          pinned: data.pinned || false,
          comments: (commentsData || []).map((c: any) => ({
            id: c.id,
            postId: c.post_id,
            content: c.content,
            author: c.author,
            createdAt: c.created_at,
            updatedAt: c.updated_at || undefined,
            likes: c.likes || [],
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
export async function incrementViews(postId: string): Promise<void> {
  // Supabase 먼저 업데이트 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from("posts")
        .select("views")
        .eq("id", postId)
        .maybeSingle();

      if (data) {
        const { error } = await supabase
          .from("posts")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", postId);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Supabase 조회수 증가 실패:", error);
      // 조회수는 실패해도 UI에 에러를 표시하지 않음
    }
  }

  // localStorage 업데이트
  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find(
    (p) => p.id === postId
  );
  if (post) {
    post.views += 1;
    const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
    const updatedPosts = posts.map((p) => (p.id === postId ? post : p));
    setLocalStorage(STORAGE_KEY, updatedPosts);
  }
}

// 좋아요 토글
export async function toggleLike(
  postId: string,
  userName: string
): Promise<void> {
  // Supabase 먼저 업데이트 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from("posts")
        .select("likes")
        .eq("id", postId)
        .maybeSingle();

      if (data) {
        const likes = (data.likes || []) as string[];
        const index = likes.indexOf(userName);
        if (index >= 0) {
          likes.splice(index, 1);
        } else {
          likes.push(userName);
        }

        const { error: updateError } = await supabase
          .from("posts")
          .update({ likes })
          .eq("id", postId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Supabase 좋아요 토글 실패:", error);
      throw new Error("좋아요 처리에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find(
    (p) => p.id === postId
  );
  if (post) {
    const index = post.likes.indexOf(userName);
    if (index >= 0) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userName);
    }
    const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
    const updatedPosts = posts.map((p) => (p.id === postId ? post : p));
    setLocalStorage(STORAGE_KEY, updatedPosts);
  }
}

// 댓글 추가
export async function addComment(
  postId: string,
  comment: Comment
): Promise<void> {
  // Supabase 먼저 저장 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      // 먼저 게시글이 Supabase에 있는지 확인
      const { data: postExists } = await supabase
        .from("posts")
        .select("id")
        .eq("id", postId)
        .maybeSingle();

      if (!postExists) {
        // 게시글이 없으면 먼저 게시글을 Supabase에 저장
        const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find(
          (p) => p.id === postId
        );
        if (post) {
          await savePostToSupabase(post);
        } else {
          throw new Error("게시글을 찾을 수 없습니다.");
        }
      }

      const supabaseComment = {
        id: comment.id,
        post_id: comment.postId,
        content: comment.content,
        author: comment.author,
        created_at: comment.createdAt,
        updated_at: comment.updatedAt || null,
        likes: comment.likes || [],
      };

      const { error } = await supabase
        .from("comments")
        .insert([supabaseComment]);

      if (error) throw error;
    } catch (error) {
      console.error("Supabase 댓글 저장 실패:", error);
      throw new Error("댓글 작성에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find(
    (p) => p.id === postId
  );
  if (post) {
    post.comments.push(comment);
    const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
    const updatedPosts = posts.map((p) => (p.id === postId ? post : p));
    setLocalStorage(STORAGE_KEY, updatedPosts);
  }
}

// 댓글 수정
export async function updateComment(
  postId: string,
  commentId: string,
  content: string
): Promise<void> {
  const updatedAt = Date.now();

  // Supabase 먼저 수정 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ content, updated_at: updatedAt })
        .eq("id", commentId)
        .eq("post_id", postId);

      if (error) throw error;
    } catch (error) {
      console.error("Supabase 댓글 수정 실패:", error);
      throw new Error("댓글 수정에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find(
    (p) => p.id === postId
  );
  if (post) {
    const comment = post.comments.find((c) => c.id === commentId);
    if (comment) {
      comment.content = content;
      comment.updatedAt = updatedAt;
      const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
      const updatedPosts = posts.map((p) => (p.id === postId ? post : p));
      setLocalStorage(STORAGE_KEY, updatedPosts);
    }
  }
}

// 댓글 삭제
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<void> {
  // Supabase 먼저 삭제 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("post_id", postId);

      if (error) throw error;
    } catch (error) {
      console.error("Supabase 댓글 삭제 실패:", error);
      throw new Error("댓글 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find(
    (p) => p.id === postId
  );
  if (post) {
    post.comments = post.comments.filter((c) => c.id !== commentId);
    const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
    const updatedPosts = posts.map((p) => (p.id === postId ? post : p));
    setLocalStorage(STORAGE_KEY, updatedPosts);
  }
}

// 댓글 좋아요 토글
export async function toggleCommentLike(
  postId: string,
  commentId: string,
  userName: string
): Promise<void> {
  // Supabase 먼저 업데이트 (설정되어 있는 경우)
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from("comments")
        .select("likes")
        .eq("id", commentId)
        .eq("post_id", postId)
        .maybeSingle();

      if (data) {
        const likes = (data.likes || []) as string[];
        const index = likes.indexOf(userName);
        if (index >= 0) {
          likes.splice(index, 1);
        } else {
          likes.push(userName);
        }

        const { error: updateError } = await supabase
          .from("comments")
          .update({ likes })
          .eq("id", commentId)
          .eq("post_id", postId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Supabase 댓글 좋아요 토글 실패:", error);
      throw new Error("댓글 좋아요 처리에 실패했습니다. 다시 시도해주세요.");
    }
  }

  // Supabase 성공 후 localStorage 업데이트
  const post = getLocalStorage<Post[]>(STORAGE_KEY, []).find(
    (p) => p.id === postId
  );
  if (post) {
    const comment = post.comments.find((c) => c.id === commentId);
    if (comment) {
      const index = comment.likes.indexOf(userName);
      if (index >= 0) {
        comment.likes.splice(index, 1);
      } else {
        comment.likes.push(userName);
      }
      const posts = getLocalStorage<Post[]>(STORAGE_KEY, []);
      const updatedPosts = posts.map((p) => (p.id === postId ? post : p));
      setLocalStorage(STORAGE_KEY, updatedPosts);
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
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .or(
            `title.ilike.%${query}%,content.ilike.%${query}%,author.ilike.%${query}%`
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        // 댓글도 함께 가져오기
        if (data && data.length > 0) {
          const postIds = data.map((p: any) => p.id);
          const { data: commentsData } = await supabase
            .from("comments")
            .select("*")
            .in("post_id", postIds);

          return data.map((post: any) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            author: post.author,
            createdAt: post.created_at,
            updatedAt: post.updated_at || undefined,
            views: post.views || 0,
            likes: post.likes || [],
            pinned: post.pinned || false,
            comments: (commentsData || [])
              .filter((c: any) => c.post_id === post.id)
              .map((c: any) => ({
                id: c.id,
                postId: c.post_id,
                content: c.content,
                author: c.author,
                createdAt: c.created_at,
                updatedAt: c.updated_at || undefined,
                likes: c.likes || [],
              })),
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
