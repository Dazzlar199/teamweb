"use client";

import { useState, useRef, useEffect } from "react";
import { FileTypeIcon, ImagePlaceholder } from "@/components/icons/Icon";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import {
  saveFile,
  getAllFiles,
  deleteFile,
  getFile,
  getImageUrl,
  revokeImageUrl,
} from "@/lib/utils/storage";
import { addActivityLog } from "@/lib/utils/activityLog";
import {
  isBookmarked,
  addBookmark,
  removeBookmark,
} from "@/lib/utils/bookmarks";

type FileCategory =
  | "이미지"
  | "음악"
  | "비디오"
  | "일러스트"
  | "문서"
  | "스프레드시트"
  | "기타";

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
  isBookmarked?: boolean;
}

export default function FilesPage() {
  const currentUser = "김찬주"; // TODO: 실제 사용자 정보로 교체
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<string>("전체");
  const [typeFilter, setTypeFilter] = useState<string>("전체");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 작성자 확인 함수
  const isCreator = (file: FileItem) => {
    return file.uploadedBy === currentUser;
  };

  // 파일 목록 로드
  useEffect(() => {
    loadFiles();
  }, []);

  // 이미지 URL 로드
  useEffect(() => {
    const loadImageUrls = async () => {
      const imageFiles = files.filter((f) => f.isImage && !f.url);
      for (const file of imageFiles) {
        const url = await getImageUrl(file.id);
        if (url) {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, url } : f))
          );
        }
      }
    };
    loadImageUrls();
  }, [files]);

  // 파일 카테고리 확인
  const getFileCategory = (
    fileName: string,
    mimeType: string
  ): FileCategory => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    // 이미지
    if (mimeType.startsWith("image/")) {
      // 일러스트 파일 (SVG, AI, EPS 등)
      if (["svg", "ai", "eps", "sketch", "fig"].includes(ext)) {
        return "일러스트";
      }
      return "이미지";
    }

    // 음악
    if (
      mimeType.startsWith("audio/") ||
      ["mp3", "wav", "flac", "m4a", "aac", "ogg", "wma"].includes(ext)
    ) {
      return "음악";
    }

    // 비디오
    if (
      mimeType.startsWith("video/") ||
      ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v"].includes(ext)
    ) {
      return "비디오";
    }

    // 문서
    if (["pdf", "doc", "docx", "txt", "rtf", "odt", "pages"].includes(ext)) {
      return "문서";
    }

    // 스프레드시트
    if (["xls", "xlsx", "csv", "ods", "numbers"].includes(ext)) {
      return "스프레드시트";
    }

    return "기타";
  };

  const loadFiles = async () => {
    try {
      const metadata = await getAllFiles();
      // 메타데이터에 category가 없으면 계산해서 추가
      const filesWithCategory = metadata.map((file: any) => ({
        ...file,
        category: file.category || getFileCategory(file.name, file.type),
        isBookmarked: isBookmarked("file", file.id),
      }));
      setFiles(filesWithCategory);
    } catch (e) {
      console.error("파일 로드 실패:", e);
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: FileItem[] = [];
    const currentUser = "김찬주"; // TODO: 실제 사용자 정보로 교체

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const isImage = file.type.startsWith("image/");
      const category = getFileCategory(file.name, file.type);

      const fileItem: FileItem = {
        id: Date.now().toString() + i,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedBy: currentUser,
        date: new Date().toISOString().split("T")[0],
        isImage,
        category,
      };

      try {
        await saveFile(
          {
            id: fileItem.id,
            name: fileItem.name,
            size: fileItem.size,
            type: fileItem.type,
            uploadedBy: fileItem.uploadedBy,
            date: fileItem.date,
            isImage,
          },
          file
        );

        // 이미지인 경우 URL 생성
        if (isImage) {
          const url = await getImageUrl(fileItem.id);
          if (url) {
            fileItem.url = url;
          }
        }

        newFiles.push(fileItem);

        // 활동 로그 추가
        addActivityLog({
          type: "file",
          action: "파일을 업로드했습니다",
          user: currentUser,
          targetId: fileItem.id,
          targetTitle: fileItem.name,
        });
      } catch (error) {
        console.error("파일 저장 실패:", error);
        alert(`${file.name} 저장에 실패했습니다.`);
      }
    }

    setFiles([...files, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 파일 다운로드
  const handleDownload = async (file: FileItem) => {
    try {
      const fileData = await getFile(file.id);
      if (!fileData) {
        alert("파일을 찾을 수 없습니다.");
        return;
      }

      const url = URL.createObjectURL(fileData);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("다운로드 실패:", error);
      alert("다운로드에 실패했습니다.");
    }
  };

  // 파일 삭제
  const handleDelete = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    // 작성자 확인
    if (!isCreator(file)) {
      alert("업로드한 사용자만 삭제할 수 있습니다.");
      return;
    }

    if (!confirm("파일을 삭제하시겠습니까?")) return;

    try {
      // 이미지인 경우 URL 정리
      if (file.isImage) {
        revokeImageUrl(id);
      }

      // 활동 로그 추가
      addActivityLog({
        type: "file",
        action: "파일을 삭제했습니다",
        user: currentUser,
        targetId: id,
        targetTitle: file.name,
      });

      await deleteFile(id);
      setFiles(files.filter((f) => f.id !== id));
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  // 북마크 토글
  const handleToggleBookmark = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    if (isBookmarked("file", fileId)) {
      removeBookmark("file", fileId);
    } else {
      addBookmark("file", fileId);
    }

    const updatedFiles = files.map((f) =>
      f.id === fileId ? { ...f, isBookmarked: !f.isBookmarked } : f
    );
    setFiles(updatedFiles);
  };

  // 파일 타입 확인 (아이콘용)
  const getFileType = (fileName: string, mimeType: string) => {
    if (mimeType.startsWith("image/")) return "image";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "doc" || ext === "docx") return "docx";
    if (ext === "xls" || ext === "xlsx") return "xlsx";
    if (["mp3", "wav", "flac", "m4a", "aac"].includes(ext || ""))
      return "audio";
    if (["mp4", "avi", "mov", "webm"].includes(ext || "")) return "video";
    if (["ai", "eps", "svg", "sketch"].includes(ext || ""))
      return "illustration";
    return "file";
  };

  // 검색 및 필터링
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filterBy === "전체" || file.uploadedBy === filterBy;
    const matchesType = typeFilter === "전체" || file.category === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  // 카테고리별 파일 개수
  const categoryCounts = {
    전체: files.length,
    이미지: files.filter((f) => f.category === "이미지").length,
    음악: files.filter((f) => f.category === "음악").length,
    비디오: files.filter((f) => f.category === "비디오").length,
    일러스트: files.filter((f) => f.category === "일러스트").length,
    문서: files.filter((f) => f.category === "문서").length,
    스프레드시트: files.filter((f) => f.category === "스프레드시트").length,
    기타: files.filter((f) => f.category === "기타").length,
  };

  const getMemberInfo = (name: string) => {
    return (
      TEAM_MEMBERS[name as keyof typeof TEAM_MEMBERS] || {
        role: "",
        initial: name[0],
        color: "#6B7280",
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#111827] leading-tight">
                프로젝트 자료
              </h1>
              <p className="text-xs text-[#6B7280] mt-1 leading-tight">
                총 {files.length}개 파일
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-3.5 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded-md hover:bg-[#60A5FA] transition-colors leading-tight cursor-pointer"
              >
                파일 업로드
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 필터 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setFilterBy("전체")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                filterBy === "전체"
                  ? "bg-[#2563EB] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              전체
            </button>
            {Object.values(TEAM_MEMBERS).map((member) => (
              <button
                key={member.name}
                onClick={() => setFilterBy(member.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                  filterBy === member.name
                    ? "text-white"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
                style={
                  filterBy === member.name
                    ? { backgroundColor: member.color }
                    : {}
                }
              >
                {member.name} ({member.role})
              </button>
            ))}
          </div>

          {/* 타입 필터 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {(
              [
                "전체",
                "이미지",
                "음악",
                "비디오",
                "일러스트",
                "문서",
                "스프레드시트",
                "기타",
              ] as const
            ).map((category) => (
              <button
                key={category}
                onClick={() => setTypeFilter(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md leading-tight transition-colors ${
                  typeFilter === category
                    ? "bg-[#2563EB] text-white"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
              >
                {category}{" "}
                {categoryCounts[category] > 0 &&
                  `(${categoryCounts[category]})`}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="파일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-md text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm leading-tight"
            />
          </div>

          {/* 파일 목록 - 그리드 뷰 */}
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden hover:border-[#2563EB] hover:shadow-sm transition-all group"
                >
                  {file.isImage ? (
                    <div className="relative aspect-square bg-[#F3F4F6]">
                      {file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImagePlaceholder className="w-full h-full" />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(file.id);
                          }}
                          className={`px-3 py-1.5 bg-white text-xs font-medium rounded transition-colors ${
                            file.isBookmarked
                              ? "text-[#F59E0B]"
                              : "text-[#111827] hover:bg-[#F9FAFB]"
                          }`}
                        >
                          ⭐
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          className="px-3 py-1.5 bg-white text-[#111827] text-xs font-medium rounded hover:bg-[#F9FAFB] transition-colors"
                        >
                          다운로드
                        </button>
                        {isCreator(file) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id);
                            }}
                            className="px-3 py-1.5 bg-white text-[#EF4444] text-xs font-medium rounded hover:bg-[#FEE2E2] transition-colors"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-[#F3F4F6] flex items-center justify-center border-b border-[#E5E7EB]">
                      <FileTypeIcon
                        type={getFileType(file.name, file.type)}
                        className="w-12 h-12"
                      />
                    </div>
                  )}
                  <div className="p-2.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <h3 className="text-xs font-medium text-[#111827] truncate leading-tight flex-1">
                        {file.name}
                      </h3>
                      {file.isBookmarked && (
                        <span className="text-[#F59E0B] text-xs flex-shrink-0">
                          ⭐
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#6B7280] leading-tight mb-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6B7280] leading-tight">
                        {file.uploadedBy} ({getMemberInfo(file.uploadedBy).role}
                        )
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(file.id);
                          }}
                          className={`text-xs transition-colors ${
                            file.isBookmarked
                              ? "text-[#F59E0B]"
                              : "text-[#6B7280] hover:text-[#F59E0B]"
                          }`}
                          title={
                            file.isBookmarked ? "북마크 제거" : "북마크 추가"
                          }
                        >
                          ⭐
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          className="text-[#3B82F6] hover:text-[#60A5FA] text-xs"
                          title="다운로드"
                        >
                          ↓
                        </button>
                        {isCreator(file) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id);
                            }}
                            className="text-[#EF4444] hover:text-[#DC2626] text-xs"
                            title="삭제"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 text-center">
              <p className="text-sm text-[#9CA3AF]">
                {searchQuery ? "검색 결과가 없습니다" : "파일이 없습니다"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
