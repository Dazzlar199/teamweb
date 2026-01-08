import React from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-2xl border border-slate-200" />,
});

interface EditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["blockquote", "code-block"],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "color",
  "background",
  "blockquote",
  "code-block",
  "link",
  "image",
  "video",
];

export default function RichTextEditor({ value, onChange, placeholder }: EditorProps) {
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
      `}</style>
    </div>
  );
}
