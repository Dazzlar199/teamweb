"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  saveFile,
  getAllFiles,
  deleteFile,
  type FileMetadata,
} from "@/lib/utils/storage";
import { addActivityLog } from "@/lib/utils/activityLog";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/lib/context/ToastContext";
import { TEAM_MEMBER_NAMES } from "@/lib/constants/team";

type FileCategory = "이미지" | "문서" | "스프레드시트" | "기타";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  date: string;
  isImage: boolean;
  category: FileCategory;
  url?: string;
}

export default function FilesPage() {
  const { user } = useUser();
  const { showToast } = useToast();
  const currentUser = user?.name || TEAM_MEMBER_NAMES[0];
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FileCategory | "전체">("전체");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const allFiles = await getAllFiles();
      setFiles(allFiles as unknown as FileItem[]);
    } catch (e) {
      console.error("파일 로드 실패:", e);
    }
  };

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      try {
        const allFiles = await getAllFiles();
        if (!ignore) {
          setFiles(allFiles as unknown as FileItem[]);
        }
      } catch (e) {
        console.error("파일 로드 실패:", e);
      }
    };
    init();
    return () => { ignore = true; };
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === "전체" || f.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [files, searchQuery, activeCategory]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const category: FileCategory = file.type.includes('image') ? '이미지' : file.type.includes('sheet') ? '스프레드시트' : '문서';
      
      const fileItem = {
        id: Date.now().toString() + i,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedBy: currentUser,
        date: new Date().toISOString().split("T")[0],
        isImage: file.type.startsWith("image/"),
        category,
      };

      await saveFile(fileItem as unknown as FileMetadata, file);
      await addActivityLog({ user: currentUser, type: 'file', action: '파일을 업로드했습니다', targetTitle: file.name });
    }
    await loadFiles();
    showToast("파일 업로드 완료", "success");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">프로젝트 자료</h1>
            <p className="text-sm text-slate-500 font-medium">팀의 모든 에셋과 문서를 안전하게 보관합니다</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            파일 업로드
          </button>
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" multiple />
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
            {(["전체", "이미지", "문서", "스프레드시트"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as FileCategory | "전체")}
                className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                  activeCategory === cat ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <input 
              type="text"
              placeholder="파일 명칭 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* 파일 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredFiles.map((file) => (
            <div key={file.id} className="group glass-card rounded-3xl bg-white p-4 relative flex flex-col items-center text-center animate-slide-in">
              <div className="w-full aspect-square rounded-2xl bg-slate-50 mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-100 transition-colors">
                {file.isImage ? (
                  <img src={file.url || "#"} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-indigo-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                )}
                {/* 호버 시 액션 버튼 */}
                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button onClick={() => window.open(file.url)} className="p-2 bg-white text-indigo-600 rounded-full shadow-lg hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button onClick={async () => { if(confirm('삭제하시겠습니까?')) { await deleteFile(file.id); await loadFiles(); showToast('삭제되었습니다', 'info'); } }} className="p-2 bg-white text-rose-600 rounded-full shadow-lg hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-800 truncate w-full px-1">{file.name}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">{file.uploadedBy} • {(file.size / 1024).toFixed(1)}KB</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}