// 태그 관리 유틸리티

export interface Tag {
  id: string;
  name: string;
  color: string;
}

const STORAGE_KEY = 'team-dashboard-tags';
const DEFAULT_TAGS: Tag[] = [
  { id: '1', name: '프론트엔드', color: '#2563EB' },
  { id: '2', name: '백엔드', color: '#10B981' },
  { id: '3', name: '디자인', color: '#F59E0B' },
  { id: '4', name: '버그수정', color: '#EF4444' },
  { id: '5', name: '긴급', color: '#DC2626' },
  { id: '6', name: '기획', color: '#8B5CF6' },
];

export function getTags(): Tag[] {
  const tagsJson = localStorage.getItem(STORAGE_KEY);
  if (!tagsJson) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TAGS));
    return DEFAULT_TAGS;
  }
  
  try {
    return JSON.parse(tagsJson) as Tag[];
  } catch {
    return DEFAULT_TAGS;
  }
}

export function addTag(tag: Omit<Tag, 'id'>): Tag {
  const tags = getTags();
  const newTag: Tag = {
    ...tag,
    id: Date.now().toString(),
  };
  tags.push(newTag);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  return newTag;
}

export function deleteTag(tagId: string): void {
  const tags = getTags();
  const filtered = tags.filter(t => t.id !== tagId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}



