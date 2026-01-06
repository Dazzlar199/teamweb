"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/context/UserContext";
import { handleError } from "@/lib/utils/errorHandler";
import {
  getPosts,
  savePost,
  deletePost,
  getPostById,
  incrementViews,
  toggleLike,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getPostsByCategory,
  searchPosts,
} from "@/lib/utils/post";
import type { Post, PostCategory, Comment } from "@/lib/types/post";

export default function CommunicationPage() {
  const { user } = useUser();
  const currentUser = user?.name || "김찬주";

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<PostCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingComment, setEditingComment] = useState<{ postId: string; commentId: string } | null>(null);

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "일반" as PostCategory,
    pinned: false,
  });

  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      let loadedPosts: Post[];
      
      if (searchQuery) {
        loadedPosts = await searchPosts(searchQuery);
      } else if (filterCategory !== "all") {
        loadedPosts = await getPostsByCategory(filterCategory);
      } else {
        loadedPosts = await getPosts();
      }
      
      setPosts(loadedPosts);
    } catch (error) {
      handleError(error as Error, {
        component: "CommunicationPage",
        action: "게시글 로드",
      });
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filterCategory, searchQuery]);

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      const post: Post = {
        id: `post-${Date.now()}`,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        author: currentUser,
        createdAt: Date.now(),
        views: 0,
        likes: [],
        comments: [],
        pinned: newPost.pinned && newPost.category === "공지",
      };

      await savePost(post);
      await loadPosts();
      setShowPostForm(false);
      setNewPost({
        title: "",
        content: "",
        category: "일반",
        pinned: false,
      });
    } catch (error) {
      handleError(error as Error, {
        component: "CommunicationPage",
        action: "게시글 작성",
      });
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      content: post.content,
      category: post.category,
      pinned: post.pinned || false,
    });
    setShowPostForm(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !newPost.title.trim() || !newPost.content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      const updatedPost: Post = {
        ...editingPost,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        updatedAt: Date.now(),
        pinned: newPost.pinned && newPost.category === "공지",
      };

      await savePost(updatedPost);
      await loadPosts();
      setShowPostForm(false);
      setEditingPost(null);
      setNewPost({
        title: "",
        content: "",
        category: "일반",
        pinned: false,
      });
      setSelectedPost(updatedPost);
    } catch (error) {
      handleError(error as Error, {
        component: "CommunicationPage",
        action: "게시글 수정",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deletePost(postId);
      await loadPosts();
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      handleError(error as Error, {
        component: "CommunicationPage",
        action: "게시글 삭제",
      });
    }
  };

  const handleViewPost = async (post: Post) => {
    await incrementViews(post.id);
    const updatedPost = await getPostById(post.id);
    if (updatedPost) {
      setSelectedPost(updatedPost);
      await loadPosts();
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) {
      alert("댓글을 입력해주세요.");
      return;
    }

    try {
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        postId,
        content,
        author: currentUser,
        createdAt: Date.now(),
        likes: [],
      };

      await addComment(postId, comment);
      const updatedPost = await getPostById(postId);
      if (updatedPost) {
        setSelectedPost(updatedPost);
        setNewComment({ ...newComment, [postId]: "" });
        await loadPosts();
      }
    } catch (error) {
      handleError(error as Error, {
        component: "CommunicationPage",
        action: "댓글 추가",
      });
    }
  };

  const handleUpdateComment = async (postId: string, commentId: string, content: string) => {
    try {
      await updateComment(postId, commentId, content);
      const updatedPost = await getPostById(postId);
      if (updatedPost) {
        setSelectedPost(updatedPost);
        setEditingComment(null);
        await loadPosts();
      }
    } catch (error) {
      handleError(error as Error, {
        component: "CommunicationPage",
        action: "댓글 수정",
      });
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteComment(postId, commentId);
      const updatedPost = await getPostById(postId);
      if (updatedPost) {
        setSelectedPost(updatedPost);
        await loadPosts();
      }
    } catch (error) {
      handleError(error as Error, {
        component: "CommunicationPage",
        action: "댓글 삭제",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="p-6 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#111827]">소통공간</h1>
          <p className="text-xs text-[#6B7280]">
            팀원들과 자유롭게 소통하고 질문을 나누는 공간입니다
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-[#D1D5DB] rounded text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#9CA3AF]"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as PostCategory | "all")}
            className="px-3 py-2 bg-white border border-[#D1D5DB] rounded text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#9CA3AF]"
          >
            <option value="all">전체</option>
            <option value="질문">질문</option>
            <option value="일반">일반</option>
            <option value="공지">공지</option>
            <option value="아이디어">아이디어</option>
          </select>
          <button
            onClick={() => {
              setShowPostForm(true);
              setEditingPost(null);
              setNewPost({
                title: "",
                content: "",
                category: "일반",
                pinned: false,
              });
            }}
            className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
          >
            + 글쓰기
          </button>
        </div>

        {selectedPost ? (
          // 게시글 상세보기
          <div className="space-y-4">
            <button
              onClick={() => setSelectedPost(null)}
              className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              ← 목록으로
            </button>

            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedPost.pinned && (
                      <span className="px-2 py-1 bg-[#DC2626] text-white text-xs font-medium rounded">
                        공지
                      </span>
                    )}
                    <span className="px-2 py-1 bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium rounded text-[#111827]">
                      {selectedPost.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#111827] mb-2">
                    {selectedPost.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span>{selectedPost.author}</span>
                    <span>{formatDate(selectedPost.createdAt)}</span>
                    <span>조회 {selectedPost.views}</span>
                  </div>
                </div>
                {selectedPost.author === currentUser && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPost(selectedPost)}
                      className="px-3 py-1 text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeletePost(selectedPost.id)}
                      className="px-3 py-1 text-xs text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-sm text-[#111827] whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              <div className="flex items-center gap-4 pb-4 border-b border-[#E5E7EB]">
                <button
                  onClick={async () => {
                    await toggleLike(selectedPost.id, currentUser);
                    const updated = await getPostById(selectedPost.id);
                    if (updated) setSelectedPost(updated);
                    await loadPosts();
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                    selectedPost.likes.includes(currentUser)
                      ? "bg-[#FEE2E2] text-[#DC2626]"
                      : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                  }`}
                >
                  <span>👍</span>
                  <span>{selectedPost.likes.length}</span>
                </button>
              </div>

              {/* 댓글 섹션 */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[#111827] mb-4">
                  댓글 {selectedPost.comments.length}
                </h3>

                {/* 댓글 입력 */}
                <div className="mb-4">
                  <textarea
                    value={newComment[selectedPost.id] || ""}
                    onChange={(e) =>
                      setNewComment({ ...newComment, [selectedPost.id]: e.target.value })
                    }
                    placeholder="댓글을 입력하세요..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#9CA3AF] mb-2"
                  />
                  <button
                    onClick={() => handleAddComment(selectedPost.id)}
                    className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
                  >
                    댓글 작성
                  </button>
                </div>

                {/* 댓글 목록 */}
                <div className="space-y-4">
                  {selectedPost.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-[#E5E7EB] pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[#111827]">
                              {comment.author}
                            </span>
                            <span className="text-xs text-[#6B7280]">
                              {formatDate(comment.createdAt)}
                            </span>
                            {comment.updatedAt && (
                              <span className="text-xs text-[#9CA3AF]">(수정됨)</span>
                            )}
                          </div>
                          {editingComment?.commentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={comment.content}
                                rows={2}
                                className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#9CA3AF]"
                                onBlur={(e) => {
                                  if (e.target.value.trim() && e.target.value !== comment.content) {
                                    handleUpdateComment(selectedPost.id, comment.id, e.target.value);
                                  } else {
                                    setEditingComment(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && e.ctrlKey) {
                                    e.currentTarget.blur();
                                  }
                                  if (e.key === "Escape") {
                                    setEditingComment(null);
                                  }
                                }}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-[#111827] whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          )}
                        </div>
                        {comment.author === currentUser && !editingComment && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                setEditingComment({ postId: selectedPost.id, commentId: comment.id })
                              }
                              className="px-2 py-1 text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                              className="px-2 py-1 text-xs text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await toggleCommentLike(selectedPost.id, comment.id, currentUser);
                          const updated = await getPostById(selectedPost.id);
                          if (updated) setSelectedPost(updated);
                          await loadPosts();
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          comment.likes.includes(currentUser)
                            ? "bg-[#FEE2E2] text-[#DC2626]"
                            : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                        }`}
                      >
                        <span>👍</span>
                        <span>{comment.likes.length}</span>
                      </button>
                    </div>
                  ))}
                  {selectedPost.comments.length === 0 && (
                    <p className="text-sm text-[#6B7280] text-center py-4">
                      댓글이 없습니다. 첫 댓글을 작성해보세요!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 게시글 목록
          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  게시글이 없습니다. 첫 글을 작성해보세요!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleViewPost(post)}
                  className="bg-white rounded-lg border border-[#E5E7EB] p-4 cursor-pointer hover:border-[#9CA3AF] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {post.pinned && (
                          <span className="px-2 py-1 bg-[#DC2626] text-white text-xs font-medium rounded">
                            공지
                          </span>
                        )}
                        <span className="px-2 py-1 bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium rounded text-[#111827]">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#111827] mb-1 truncate">
                        {post.title}
                      </h3>
                      <p className="text-sm text-[#6B7280] line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                        <span>{post.author}</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span>조회 {post.views}</span>
                        <span>댓글 {post.comments.length}</span>
                        {post.likes.length > 0 && (
                          <span className="flex items-center gap-1">
                            👍 {post.likes.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 글쓰기/수정 모달 */}
        {showPostForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-[#111827] mb-4">
                {editingPost ? "게시글 수정" : "새 게시글 작성"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={newPost.category}
                    onChange={(e) =>
                      setNewPost({ ...newPost, category: e.target.value as PostCategory })
                    }
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#9CA3AF]"
                  >
                    <option value="질문">질문</option>
                    <option value="일반">일반</option>
                    <option value="공지">공지</option>
                    <option value="아이디어">아이디어</option>
                  </select>
                </div>

                {newPost.category === "공지" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={newPost.pinned}
                      onChange={(e) =>
                        setNewPost({ ...newPost, pinned: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="pinned" className="text-sm text-[#111827]">
                      상단 고정
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="제목을 입력하세요"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#9CA3AF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    내용 *
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="내용을 입력하세요"
                    rows={10}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#9CA3AF]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPostForm(false);
                    setEditingPost(null);
                    setNewPost({
                      title: "",
                      content: "",
                      category: "일반",
                      pinned: false,
                    });
                  }}
                  className="px-4 py-2 bg-[#F3F4F6] text-[#111827] text-sm font-medium rounded hover:bg-[#E5E7EB] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={editingPost ? handleUpdatePost : handleCreatePost}
                  className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
                >
                  {editingPost ? "수정" : "작성"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

