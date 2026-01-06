// 테마 관리 유틸리티

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'team-dashboard-theme';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  
  const saved = localStorage.getItem(STORAGE_KEY) as Theme;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  
  // 기본값은 라이트 모드 (시스템 설정 무시)
  return 'light';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const newTheme = current === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

