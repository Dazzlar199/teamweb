// 전역 검색 유틸리티

export interface SearchResult {
  type: 'task' | 'event' | 'file';
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return [];
  
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  
  // 작업 검색
  try {
    const tasksJson = localStorage.getItem('team-dashboard-tasks');
    if (tasksJson) {
      const tasks = JSON.parse(tasksJson);
      tasks.forEach((task: any) => {
        if (
          task.title?.toLowerCase().includes(lowerQuery) ||
          task.description?.toLowerCase().includes(lowerQuery) ||
          task.assignedTo?.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            type: 'task',
            id: task.id,
            title: task.title,
            description: task.description,
            metadata: {
              status: task.status,
              assignedTo: task.assignedTo,
              dueDate: task.dueDate,
            },
          });
        }
      });
    }
  } catch (e) {
    console.error('작업 검색 실패:', e);
  }
  
  // 일정 검색
  try {
    const eventsJson = localStorage.getItem('team-dashboard-events');
    if (eventsJson) {
      const events = JSON.parse(eventsJson);
      events.forEach((event: any) => {
        if (
          event.title?.toLowerCase().includes(lowerQuery) ||
          event.location?.toLowerCase().includes(lowerQuery) ||
          event.createdBy?.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            type: 'event',
            id: event.id,
            title: event.title,
            description: event.location,
            metadata: {
              date: event.date,
              time: event.time,
              createdBy: event.createdBy,
            },
          });
        }
      });
    }
  } catch (e) {
    console.error('일정 검색 실패:', e);
  }
  
  // 파일 검색
  try {
    const filesJson = localStorage.getItem('team-dashboard-images');
    if (filesJson) {
      const files = JSON.parse(filesJson);
      files.forEach((file: any) => {
        if (file.name?.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'file',
            id: file.id,
            title: file.name,
            metadata: {
              uploadedBy: file.uploadedBy,
              date: file.date,
            },
          });
        }
      });
    }
  } catch (e) {
    console.error('파일 검색 실패:', e);
  }
  
  // IndexedDB에서 파일 검색
  // Note: IndexedDB는 비동기이므로 별도 처리 필요
  
  return results;
}



