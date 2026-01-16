"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";

type BlockType = "paragraph" | "heading1" | "heading2" | "heading3" | "bullet" | "number" | "todo" | "quote";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // for todo blocks
}

interface NotionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function NotionEditor({ value, onChange, placeholder = "내용을 입력하세요..." }: NotionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [slashSearchQuery, setSlashSearchQuery] = useState("");

  // 초기값 파싱
  useEffect(() => {
    if (value && blocks.length === 0) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
        } else {
          // HTML 또는 텍스트인 경우
          setBlocks([{ id: Date.now().toString(), type: "paragraph", content: value }]);
        }
      } catch {
        // 파싱 실패시 텍스트로 처리
        setBlocks([{ id: Date.now().toString(), type: "paragraph", content: value }]);
      }
    } else if (!value && blocks.length === 0) {
      setBlocks([{ id: Date.now().toString(), type: "paragraph", content: "" }]);
    }
  }, [value, blocks.length]);

  // 블록 변경시 부모에게 전달
  useEffect(() => {
    if (blocks.length > 0) {
      onChange(JSON.stringify(blocks));
    }
  }, [blocks, onChange]);

  const slashCommands = [
    { label: "일반 텍스트", type: "paragraph" as BlockType, icon: "T", shortcut: "/p" },
    { label: "제목 1", type: "heading1" as BlockType, icon: "H1", shortcut: "/h1" },
    { label: "제목 2", type: "heading2" as BlockType, icon: "H2", shortcut: "/h2" },
    { label: "제목 3", type: "heading3" as BlockType, icon: "H3", shortcut: "/h3" },
    { label: "불릿 리스트", type: "bullet" as BlockType, icon: "•", shortcut: "/bullet" },
    { label: "번호 리스트", type: "number" as BlockType, icon: "1.", shortcut: "/number" },
    { label: "할 일", type: "todo" as BlockType, icon: "☐", shortcut: "/todo" },
    { label: "인용구", type: "quote" as BlockType, icon: '"', shortcut: "/quote" },
  ];

  const filteredCommands = slashCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(slashSearchQuery.toLowerCase()) ||
    cmd.shortcut.includes(slashSearchQuery.toLowerCase())
  );

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  };

  const addBlock = (afterId: string, type: BlockType = "paragraph") => {
    const index = blocks.findIndex((b) => b.id === afterId);
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: "",
    };
    setBlocks((prev) => [
      ...prev.slice(0, index + 1),
      newBlock,
      ...prev.slice(index + 1),
    ]);
    return newBlock.id;
  };

  const deleteBlock = (id: string) => {
    if (blocks.length === 1) {
      setBlocks([{ id: Date.now().toString(), type: "paragraph", content: "" }]);
    } else {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;

    // Enter: 새 블록 추가
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newBlockId = addBlock(blockId);
      setTimeout(() => {
        const nextInput = document.querySelector(`[data-block-id="${newBlockId}"]`) as HTMLTextAreaElement;
        nextInput?.focus();
      }, 0);
    }

    // Backspace: 비어있으면 블록 삭제
    if (e.key === "Backspace" && block.content === "" && cursorPos === 0) {
      e.preventDefault();
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index > 0) {
        deleteBlock(blockId);
        const prevBlock = blocks[index - 1];
        setTimeout(() => {
          const prevInput = document.querySelector(`[data-block-id="${prevBlock.id}"]`) as HTMLTextAreaElement;
          if (prevInput) {
            prevInput.focus();
            prevInput.selectionStart = prevInput.value.length;
          }
        }, 0);
      }
    }

    // Slash command 감지
    if (e.key === "/" && cursorPos === 0 && block.content === "") {
      e.preventDefault();
      setShowSlashMenu(true);
      setFocusedBlockId(blockId);
      const rect = textarea.getBoundingClientRect();
      setSlashMenuPosition({ x: rect.left, y: rect.bottom });
      updateBlock(blockId, { content: "/" });
    }
  };

  const handleInput = (blockId: string, content: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    // Slash 메뉴 표시/숨김
    if (content.startsWith("/") && content.length > 1) {
      setShowSlashMenu(true);
      setFocusedBlockId(blockId);
      setSlashSearchQuery(content.slice(1));
    } else if (content === "/") {
      setShowSlashMenu(true);
      setFocusedBlockId(blockId);
      setSlashSearchQuery("");
    } else {
      setShowSlashMenu(false);
    }

    updateBlock(blockId, { content });
  };

  const applyCommand = (type: BlockType) => {
    if (focusedBlockId) {
      updateBlock(focusedBlockId, { type, content: "" });
      setShowSlashMenu(false);
      setSlashSearchQuery("");
      setTimeout(() => {
        const input = document.querySelector(`[data-block-id="${focusedBlockId}"]`) as HTMLTextAreaElement;
        input?.focus();
      }, 0);
    }
  };

  const getBlockStyle = (type: BlockType) => {
    switch (type) {
      case "heading1":
        return "text-3xl font-black text-slate-900";
      case "heading2":
        return "text-2xl font-bold text-slate-900";
      case "heading3":
        return "text-xl font-bold text-slate-900";
      case "quote":
        return "border-l-4 border-slate-300 pl-4 italic text-slate-600";
      case "paragraph":
      default:
        return "text-base text-slate-700";
    }
  };

  const renderBlockPrefix = (block: Block, index: number) => {
    switch (block.type) {
      case "bullet":
        return <span className="absolute left-0 top-3 text-slate-400">•</span>;
      case "number":
        return <span className="absolute left-0 top-3 text-slate-400 text-sm">{index + 1}.</span>;
      case "todo":
        return (
          <button
            onClick={() => updateBlock(block.id, { checked: !block.checked })}
            className="absolute left-0 top-3"
          >
            {block.checked ? (
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-300 hover:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
              </svg>
            )}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="notion-editor relative">
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <div key={block.id} className="relative pl-7">
            {renderBlockPrefix(block, index)}
            <textarea
              data-block-id={block.id}
              value={block.content}
              onChange={(e) => handleInput(block.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              placeholder={index === 0 && !block.content ? placeholder : ""}
              className={`
                w-full resize-none overflow-hidden bg-transparent border-none outline-none
                ${getBlockStyle(block.type)}
                ${block.checked ? "line-through text-slate-400" : ""}
                placeholder:text-slate-300
              `}
              rows={1}
              onInput={(e) => {
                // 자동 높이 조절
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
          </div>
        ))}
      </div>

      {/* Slash 커맨드 메뉴 */}
      {showSlashMenu && (
        <div
          className="absolute z-50 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 max-h-80 overflow-y-auto"
          style={{ left: slashMenuPosition.x, top: slashMenuPosition.y }}
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.type}
                onClick={() => applyCommand(cmd.type)}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-sm font-bold">
                  {cmd.icon}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{cmd.label}</div>
                  <div className="text-xs text-slate-400">{cmd.shortcut}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
