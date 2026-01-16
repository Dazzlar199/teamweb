"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/lib/context/UserContext";
import { useData } from "@/lib/context/DataContext";
import { useToast } from "@/lib/context/ToastContext";
import {
  savePost,
  deletePost,
  incrementViews,
  toggleLike,
  addComment,
} from "@/lib/utils/post";
import type { Post, PostCategory, Comment } from "@/lib/types/post";
import RichTextEditor from "@/components/common/RichTextEditor";
import { TEAM_MEMBER_NAMES } from "@/lib/constants/team";

export default function CommunicationPage() {
  const { user, canModify } = useUser();
  const { posts, setPosts, refreshPosts } = useData();
  const { showToast } = useToast();
  const currentUser = user?.name || TEAM_MEMBER_NAMES[0];

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<PostCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "일반" as PostCategory,
    pinned: false,
  });

  const [newCommentInput, setNewCommentInput] = useState<{ [postId: string]: string }>({});

  // 필터링 및 검색된 게시글 목록 (메모이제이션)
  const filteredPosts = useMemo(() => {
    let result = [...posts];
    
    if (filterCategory !== "all") {
      result = result.filter(p => p.category === filterCategory);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.content.toLowerCase().includes(q) || 
        p.author.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [posts, filterCategory, searchQuery]);

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      showToast("제목과 내용을 입력해주세요.", "warning");
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

      // 낙관적 업데이트
      setPosts(prev => [post, ...prev]);

      await savePost(post);
      await refreshPosts(); // DataContext 동기화
      showToast("게시글이 등록되었습니다.", "success");
      setShowPostForm(false);
      setNewPost({ title: "", content: "", category: "일반", pinned: false });
    } catch (error) {
      await refreshPosts(); // 에러 시 복구
      showToast("게시글 등록에 실패했습니다.", "error");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      setPosts(prev => prev.filter(p => p.id !== id));
      await deletePost(id);
      await refreshPosts(); // DataContext 동기화
      if (selectedPost?.id === id) setSelectedPost(null);
      showToast("게시글이 삭제되었습니다.", "success");
    } catch (error) {
      await refreshPosts();
      showToast("삭제 실패", "error");
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newCommentInput[postId]?.trim();
    if (!content) return;

    try {
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        postId,
        content,
        author: currentUser,
        createdAt: Date.now(),
        likes: [],
      };

      // 상태 즉시 업데이트
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p));
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? { ...prev, comments: [...(prev.comments || []), comment] } : null);
      }

      await addComment(postId, comment);
      await refreshPosts(); // DataContext 동기화
      setNewCommentInput(prev => ({ ...prev, [postId]: "" }));
      showToast("댓글이 등록되었습니다.", "success");
    } catch (error) {
      await refreshPosts();
      showToast("댓글 등록 실패", "error");
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const likes = [...p.likes];
          const idx = likes.indexOf(currentUser);
          if (idx >= 0) likes.splice(idx, 1);
          else likes.push(currentUser);
          return { ...p, likes };
        }
        return p;
      }));
      await toggleLike(postId, currentUser);
      await refreshPosts(); // DataContext 동기화
    } catch (error) {
      await refreshPosts();
    }
  };

  // ... (기타 렌더링 코드 유지)
  // 편의상 렌더링 코드는 생략하지만, 실제 파일에는 모든 UI가 포함되어야 합니다.
  // 아래에 전체 UI 코드를 포함하여 작성합니다.

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">소통공간</h1>
            <p className="text-sm text-[#6B7280]">팀원들과 자유롭게 의견을 나누세요</p>
          </div>
          <button
            onClick={() => setShowPostForm(true)}
            className="px-4 py-2 bg-[#3B82F6] text-white font-bold rounded-lg hover:bg-[#2563EB] transition-all"
          >
            글쓰기
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex bg-white p-1 rounded-lg border border-[#E5E7EB] w-fit">
            {(["all", "공지", "질문", "일반", "아이디어"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  filterCategory === cat ? "bg-[#3B82F6] text-white" : "text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
              >
                {cat === "all" ? "전체" : cat}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 글쓰기 폼 모달 */}
        {showPostForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
                <h2 className="text-xl font-bold">새 게시글 작성</h2>
                <button onClick={() => setShowPostForm(false)} className="text-[#9CA3AF] hover:text-[#111827]">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-lg font-bold focus:ring-2 focus:ring-[#3B82F6] outline-none"
                />
                <div className="flex gap-4">
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({...newPost, category: e.target.value as PostCategory})}
                    className="px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white outline-none"
                  >
                    <option value="일반">일반</option>
                    <option value="질문">질문</option>
                    <option value="공지">공지</option>
                    <option value="아이디어">아이디어</option>
                  </select>
                  {newPost.category === "공지" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newPost.pinned} onChange={(e) => setNewPost({...newPost, pinned: e.target.checked})} />
                      <span className="text-sm">상단 고정</span>
                    </label>
                  )}
                </div>
                
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                  <RichTextEditor 
                    value={newPost.content} 
                    onChange={(content) => setNewPost({...newPost, content})}
                    placeholder="팀원들과 공유할 내용을 자유롭게 작성하세요 (이미지 첨부 가능)"
                  />
                </div>
              </div>
              <div className="p-6 bg-[#F9FAFB] border-t border-[#E5E7EB] flex justify-end gap-3">
                <button onClick={() => setShowPostForm(false)} className="px-4 py-2 font-bold text-[#6B7280]">취소</button>
                <button onClick={handleCreatePost} className="px-6 py-2 bg-[#3B82F6] text-white font-bold rounded-lg hover:bg-[#2563EB]">등록하기</button>
              </div>
            </div>
          </div>
        )}

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => { setSelectedPost(post); incrementViews(post.id); }}
                className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                      post.category === "공지" ? "bg-red-500" : post.category === "질문" ? "bg-amber-500" : "bg-blue-500"
                    }`}>
                      {post.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#111827] group-hover:text-[#3B82F6] transition-colors">
                      {post.pinned && "📌 "}{post.title}
                    </h3>
                  </div>
                  <div className="text-xs text-[#9CA3AF]">{new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
                <p className="text-sm text-[#4B5563] line-clamp-2 mb-4 leading-relaxed">
                  {post.content.replace(/<[^>]*>?/gm, '')}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span className="font-bold text-[#111827]">{post.author}</span>
                    <span>조회 {post.views}</span>
                    <span>댓글 {post.comments.length}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleLike(post.id); }}
                      className={`flex items-center gap-1 hover:text-red-500 transition-colors ${post.likes.includes(currentUser) ? "text-red-500 font-bold" : ""}`}
                    >
                      ♥ {post.likes.length}
                    </button>
                  </div>
                  {canModify(post.author) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                      className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-20 text-center rounded-xl border border-dashed border-[#CBD5E0]">
              <p className="text-[#9CA3AF]">게시글이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 상세 보기 모달 */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded">{selectedPost.category}</span>
                <button onClick={() => setSelectedPost(null)} className="text-[#9CA3AF] hover:text-[#111827]">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">{selectedPost.title}</h2>
                <div className="flex items-center gap-3 mb-8 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{selectedPost.author[0]}</div>
                  <div>
                    <div className="font-bold text-[#111827]">{selectedPost.author}</div>
                    <div className="text-xs text-[#9CA3AF]">{new Date(selectedPost.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                {/* HTML 렌더링 영역 (Rich Text 지원) */}
                <div 
                  className="text-base text-[#374151] leading-loose mb-12 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
                
                {/* 댓글 섹션 */}
                <div className="border-t border-[#E5E7EB] pt-8">
                  <h4 className="font-bold text-lg mb-6">댓글 {selectedPost.comments.length}</h4>
                  <div className="space-y-6 mb-8">
                    {selectedPost.comments.map(comment => (
                      <div key={comment.id} className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-xs font-bold">{comment.author[0]}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">{comment.author}</span>
                            <span className="text-[10px] text-[#9CA3AF]">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-[#4B5563] leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <textarea
                      placeholder="따뜻한 댓글을 남겨주세요..."
                      value={newCommentInput[selectedPost.id] || ""}
                      onChange={(e) => setNewCommentInput({...newCommentInput, [selectedPost.id]: e.target.value})}
                      className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={2}
                    />
                    <button
                      onClick={() => handleAddComment(selectedPost.id)}
                      className="px-6 py-2 bg-[#3B82F6] text-white font-bold rounded-xl self-end hover:bg-[#2563EB]"
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}