// 작업 템플릿 관리 유틸리티

export interface TaskTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  priority: string;
  tags: string[];
}

const STORAGE_KEY = 'team-dashboard-task-templates';

export function getTemplates(): TaskTemplate[] {
  const templatesJson = localStorage.getItem(STORAGE_KEY);
  if (!templatesJson) return [];
  
  try {
    return JSON.parse(templatesJson) as TaskTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(template: Omit<TaskTemplate, 'id'>): TaskTemplate {
  const templates = getTemplates();
  const newTemplate: TaskTemplate = {
    ...template,
    id: Date.now().toString(),
  };
  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function deleteTemplate(templateId: string): void {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}



