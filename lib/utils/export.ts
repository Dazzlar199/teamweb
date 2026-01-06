// 내보내기 유틸리티

export function exportTasksToCSV(tasks: any[]): void {
  const headers = ['제목', '상태', '우선순위', '담당자', '마감일', '설명'];
  const rows = tasks.map(task => [
    task.title || '',
    task.status === 'done' ? '완료' : task.status === 'in_progress' ? '진행 중' : '할 일',
    task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음',
    task.assignedTo || '',
    task.dueDate || '',
    (task.description || '').replace(/\n/g, ' '),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `작업목록_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportTasksToJSON(tasks: any[]): void {
  const jsonContent = JSON.stringify(tasks, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `작업목록_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}

export function exportEventsToICal(events: any[]): void {
  let icalContent = 'BEGIN:VCALENDAR\n';
  icalContent += 'VERSION:2.0\n';
  icalContent += 'PRODID:-//Team Dashboard//EN\n';
  icalContent += 'CALSCALE:GREGORIAN\n';
  icalContent += 'METHOD:PUBLISH\n';
  
  events.forEach(event => {
    if (!event.date || !event.time) return;
    
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1시간 후
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    icalContent += 'BEGIN:VEVENT\n';
    icalContent += `DTSTART:${formatDate(startDate)}\n`;
    icalContent += `DTEND:${formatDate(endDate)}\n`;
    icalContent += `SUMMARY:${event.title || '일정'}\n`;
    if (event.location) {
      icalContent += `LOCATION:${event.location}\n`;
    }
    icalContent += `DESCRIPTION:${event.createdBy || ''}\n`;
    icalContent += 'END:VEVENT\n';
  });
  
  icalContent += 'END:VCALENDAR\n';
  
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `일정_${new Date().toISOString().split('T')[0]}.ics`;
  link.click();
}



