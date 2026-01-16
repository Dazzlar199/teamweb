import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// ReactQuill을 동적으로 로드 (SSR 비활성화)
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    // 클라이언트 사이드에서만 모듈 로드 및 등록
    if (typeof window !== "undefined") {
        try {
            const { default: BlotFormatter } = await import("quill-blot-formatter");
            RQ.Quill.register("modules/blotFormatter", BlotFormatter);
        } catch (e) {
            console.error("BlotFormatter module load failed", e);
        }
    }
    return RQ;
  },
  {
    ssr: false,
    loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-2xl border border-slate-200" />,
  }
);

interface EditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "color",
  "background",
  "blockquote",
  "code-block",
  "link",
  "image",
  "video",
  "align",
  "width", "height", "style"
];

export default function EnhancedEditor({ value, onChange, placeholder }: EditorProps) {
  const [showGuide, setShowGuide] = useState(false);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      ["blockquote", "code-block"],
      ["link", "image", "video"],
      ["clean"],
    ],
    blotFormatter: {
      overlay: {
        style: {
          border: '2px solid #4f46e5',
        }
      }
    },
  }), []);

  return (
    <div className="enhanced-editor-container relative">
      {/* 사용 가이드 버튼 */}
      <button
        type="button"
        onClick={() => setShowGuide(!showGuide)}
        className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        사용 가이드
      </button>

      {/* 가이드 모달 */}
      {showGuide && (
        <div className="absolute top-14 right-4 z-30 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900">에디터 사용 가이드</h3>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* 텍스트 포매팅 */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">A</span>
                텍스트 포매팅
              </h4>
              <div className="space-y-1 text-xs text-slate-600 pl-8">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+B</kbd>
                  <span>진하게 (Bold)</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+I</kbd>
                  <span>기울임 (Italic)</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+U</kbd>
                  <span>밑줄 (Underline)</span>
                </div>
              </div>
            </div>

            {/* 제목 */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xs font-black">H</span>
                제목 스타일
              </h4>
              <div className="space-y-1 text-xs text-slate-600 pl-8">
                <div>• 제목 1, 2, 3: 상단 드롭다운 선택</div>
                <div>• 큰 제목부터 작은 제목까지 3단계</div>
              </div>
            </div>

            {/* 리스트 */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">•</span>
                리스트
              </h4>
              <div className="space-y-1 text-xs text-slate-600 pl-8">
                <div>• 불릿 리스트: 점(•) 버튼 클릭</div>
                <div>• 번호 리스트: 1,2,3 버튼 클릭</div>
                <div>• Enter로 새 항목, Tab으로 들여쓰기</div>
              </div>
            </div>

            {/* 색상 */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-xs font-black">🎨</span>
                색상 & 하이라이트
              </h4>
              <div className="space-y-1 text-xs text-slate-600 pl-8">
                <div>• 글자색: A 아이콘 클릭</div>
                <div>• 배경색: 형광펜 아이콘 클릭</div>
                <div>• 다양한 색상 선택 가능</div>
              </div>
            </div>

            {/* 이미지 & 동영상 */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xs font-black">📷</span>
                이미지 & 동영상
              </h4>
              <div className="space-y-1 text-xs text-slate-600 pl-8">
                <div>• 이미지: 사진 아이콘 → URL 입력</div>
                <div>• 동영상: 비디오 아이콘 → URL 입력</div>
                <div>• 이미지 클릭 후 드래그로 크기 조절</div>
              </div>
            </div>

            {/* 정렬 */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center text-xs font-black">⇌</span>
                정렬
              </h4>
              <div className="space-y-1 text-xs text-slate-600 pl-8">
                <div>• 왼쪽, 가운데, 오른쪽 정렬 선택</div>
                <div>• 텍스트와 이미지 모두 가능</div>
              </div>
            </div>

            {/* 기타 */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-xs font-black">+</span>
                기타 기능
              </h4>
              <div className="space-y-1 text-xs text-slate-600 pl-8">
                <div>• 인용구: " 버튼으로 인용문 작성</div>
                <div>• 코드블록: &lt;/&gt; 버튼으로 코드 입력</div>
                <div>• 링크: 🔗 버튼으로 하이퍼링크 추가</div>
                <div>• 포맷 지우기: 빗자루 아이콘으로 초기화</div>
              </div>
            </div>

            {/* 팁 */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h4 className="text-sm font-bold text-indigo-700 mb-2">💡 Pro Tip</h4>
              <div className="space-y-1 text-xs text-indigo-600">
                <div>• 이미지는 클릭 후 모서리를 드래그하여 크기 조절</div>
                <div>• Ctrl+Z로 실행 취소, Ctrl+Y로 다시 실행</div>
                <div>• 텍스트 선택 후 툴바에서 빠르게 포맷 적용</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="h-[500px] mb-16"
      />
      <style jsx global>{`
        .ql-container.ql-snow {
          border: none !important;
          font-family: inherit;
          font-size: 16px;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 16px !important;
          position: sticky;
          top: 0;
          z-index: 10;
          background: white;
          border-radius: 12px 12px 0 0;
        }
        .ql-editor {
          min-height: 450px;
          padding: 30px !important;
          line-height: 1.8;
        }
        .ql-editor.ql-blank::before {
          color: #cbd5e1;
          font-style: normal;
          left: 30px;
        }
        .ql-video {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
        }
        .ql-snow .ql-picker.ql-header .ql-picker-label::before {
          content: '본문';
        }
        .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before { content: '제목 1'; }
        .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before { content: '제목 2'; }
        .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before { content: '제목 3'; }

        /* 이미지 스타일 */
        .ql-editor img {
            display: inline-block;
            margin: 10px 0;
            max-width: 100%;
            border-radius: 8px;
        }

        /* 툴바 버튼 스타일 개선 */
        .ql-snow .ql-stroke {
          stroke: #64748b;
        }
        .ql-snow .ql-fill {
          fill: #64748b;
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button:focus .ql-stroke {
          stroke: #4f46e5;
        }
        .ql-snow.ql-toolbar button:hover .ql-fill,
        .ql-snow.ql-toolbar button:focus .ql-fill {
          fill: #4f46e5;
        }
        .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #4f46e5;
        }
        .ql-snow.ql-toolbar button.ql-active .ql-fill {
          fill: #4f46e5;
        }
      `}</style>
    </div>
  );
}
