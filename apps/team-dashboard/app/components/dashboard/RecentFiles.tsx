import React from "react";
import Link from "next/link";

interface FileItem {
  id: string;
  name: string;
  uploadedBy: string;
  date: string;
}

interface RecentFilesProps {
  files: FileItem[];
}

export default function RecentFiles({ files }: RecentFilesProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <h2 className="text-base font-bold text-[#111827]">최근 파일</h2>
        <Link href="/files" className="text-xs text-[#3B82F6] font-semibold hover:underline">전체 →</Link>
      </div>
      <div className="p-4">
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <Link key={file.id} href="/files" className="flex items-center gap-3 p-2.5 hover:bg-[#F9FAFB] rounded-lg transition-colors group">
                <div className="w-9 h-9 rounded bg-[#F3F4F6] flex items-center justify-center border border-[#E5E7EB] flex-shrink-0 group-hover:bg-white transition-colors">
                  <span className="text-[10px] font-bold text-[#6B7280]">FILE</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111827] truncate mb-0.5">{file.name}</p>
                  <p className="text-[10px] text-[#6B7280]">{file.uploadedBy} • {file.date}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF] text-center py-6">최근 업로드된 파일이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
