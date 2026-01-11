import React, { useMemo } from "react";
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
  "align", // 정렬 포맷 추가
  "width", "height", "style" // 이미지 스타일 허용
];

export default function RichTextEditor({ value, onChange, placeholder }: EditorProps) {
  // useMemo를 사용하여 모듈 객체가 재생성되지 않도록 함
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }], // 정렬 버튼 추가
      [{ color: [] }, { background: [] }],
      ["blockquote", "code-block"],
      ["link", "image", "video"],
      ["clean"],
    ],
    // BlotFormatter 설정 (이미지 리사이즈 및 정렬)
    blotFormatter: {
      overlay: {
        style: {
          border: '2px solid #4f46e5', // 선택 시 테두리 색상
        }
      }
    },
  }), []);

  return (
    <div className="rich-text-editor-container">
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
        }
      `}</style>
    </div>
  );
}
