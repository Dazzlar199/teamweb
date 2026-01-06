// 북마크 관리 유틸리티

export interface Bookmark {
  id: string;
  type: 'task' | 'event' | 'file';
  targetId: string;
  createdAt: string;
}

const STORAGE_KEY = 'team-dashboard-bookmarks';

export function getBookmarks(): Bookmark[] {
  const bookmarksJson = localStorage.getItem(STORAGE_KEY);
  if (!bookmarksJson) return [];
  
  try {
    return JSON.parse(bookmarksJson) as Bookmark[];
  } catch {
    return [];
  }
}

export function addBookmark(type: 'task' | 'event' | 'file', targetId: string): void {
  const bookmarks = getBookmarks();
  
  // 중복 체크
  if (bookmarks.some(b => b.type === type && b.targetId === targetId)) {
    return;
  }
  
  const bookmark: Bookmark = {
    id: Date.now().toString(),
    type,
    targetId,
    createdAt: new Date().toISOString(),
  };
  
  bookmarks.push(bookmark);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function removeBookmark(type: 'task' | 'event' | 'file', targetId: string): void {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter(
    b => !(b.type === type && b.targetId === targetId)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function isBookmarked(type: 'task' | 'event' | 'file', targetId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.type === type && b.targetId === targetId);
}

export function getBookmarkedIds(type: 'task' | 'event' | 'file'): string[] {
  const bookmarks = getBookmarks();
  return bookmarks
    .filter(b => b.type === type)
    .map(b => b.targetId);
}



