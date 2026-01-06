// 로컬스토리지 유틸리티 함수

/**
 * 로컬스토리지에서 데이터를 안전하게 가져옵니다.
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`로컬스토리지 읽기 실패 (${key}):`, error);
    return defaultValue;
  }
}

/**
 * 로컬스토리지에 데이터를 안전하게 저장합니다.
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`로컬스토리지 저장 실패 (${key}):`, error);
  }
}

/**
 * 로컬스토리지에서 데이터를 삭제합니다.
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`로컬스토리지 삭제 실패 (${key}):`, error);
  }
}

