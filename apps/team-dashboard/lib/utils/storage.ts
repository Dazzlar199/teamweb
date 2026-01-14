// IndexedDB를 사용한 파일 저장 유틸리티

const DB_NAME = "team-dashboard-storage";
const DB_VERSION = 1;
const STORE_NAME = "files";

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  date: string;
  isImage: boolean;
}

// IndexedDB 초기화
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// 파일 저장
export async function saveFile(
  metadata: FileMetadata,
  file: File
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      id: metadata.id,
      metadata,
      file,
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 파일 가져오기
export async function getFile(id: string): Promise<File | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.file : null);
    };
    request.onerror = () => reject(request.error);
  });
}

// 모든 파일 메타데이터 가져오기
export async function getAllFiles(): Promise<FileMetadata[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result;
      const metadata = results.map((r: any) => r.metadata);
      resolve(metadata);
    };
    request.onerror = () => reject(request.error);
  });
}

// 파일 삭제
export async function deleteFile(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 이미지 URL 생성 (캐시용)
const imageUrlCache = new Map<string, string>();

export async function getImageUrl(id: string): Promise<string | null> {
  if (imageUrlCache.has(id)) {
    return imageUrlCache.get(id) || null;
  }

  const file = await getFile(id);
  if (!file || !file.type.startsWith("image/")) {
    return null;
  }

  const url = URL.createObjectURL(file);
  imageUrlCache.set(id, url);
  return url;
}

// URL 캐시 정리
export function revokeImageUrl(id: string): void {
  const url = imageUrlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    imageUrlCache.delete(id);
  }
}



