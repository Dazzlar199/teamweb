export type PostCategory = "질문" | "일반" | "공지" | "아이디어";

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  createdAt: number;
  updatedAt?: number;
  likes: string[]; // 좋아요한 사용자 이름 배열
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  author: string;
  createdAt: number;
  updatedAt?: number;
  views: number;
  likes: string[]; // 좋아요한 사용자 이름 배열
  comments: Comment[];
  pinned?: boolean; // 공지사항 고정 여부
}

