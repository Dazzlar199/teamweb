"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchAll, type SearchResult } from "@/lib/utils/search";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchAll(query);
      setResults(searchResults);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setQuery("");
    setShowResults(false);
    
    if (result.type === "task") {
      router.push(`/tasks?highlight=${result.id}`);
    } else if (result.type === "event") {
      router.push(`/calendar?highlight=${result.id}`);
    } else if (result.type === "file") {
      router.push(`/files?highlight=${result.id}`);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "task":
        return "작업";
      case "event":
        return "일정";
      case "file":
        return "파일";
      default:
        return "";
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowResults(true)}
          placeholder="전체 검색... (작업, 일정, 파일)"
          className="w-full px-3 py-2 pl-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
        />
        <svg
          className="absolute left-2.5 top-2.5 w-4 h-4 text-[#6B7280]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 text-left hover:bg-[#F9FAFB] border-b border-[#E5E7EB] last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 bg-[#2563EB] text-white text-xs font-medium rounded leading-tight">
                      {getTypeLabel(result.type)}
                    </span>
                    <span className="text-sm font-semibold text-[#111827] truncate leading-tight">
                      {result.title}
                    </span>
                  </div>
                  {result.description && (
                    <p className="text-xs text-[#6B7280] line-clamp-1 leading-tight">
                      {result.description}
                    </p>
                  )}
                  {result.metadata && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#9CA3AF] leading-tight">
                      {result.metadata.assignedTo && (
                        <span>담당: {result.metadata.assignedTo}</span>
                      )}
                      {result.metadata.dueDate && (
                        <span>마감: {result.metadata.dueDate}</span>
                      )}
                      {result.metadata.createdBy && (
                        <span>작성: {result.metadata.createdBy}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-lg z-50 p-4">
          <p className="text-sm text-[#9CA3AF] text-center">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}



