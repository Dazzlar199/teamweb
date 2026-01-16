import React, { useState, useEffect } from "react";
import type { RoadmapPhase, RoadmapTask } from "@/lib/types/yechangpack";

interface AddTaskModalProps {
  phases: RoadmapPhase[];
  initialTask: RoadmapTask | null;
  initialPhaseId: string; // Default phase ID if adding new, or existing phase ID if editing
  onClose: () => void;
  onSave: (
    task: {
      title: string;
      category: RoadmapTask["category"];
      description: string;
    },
    phaseId: string
  ) => void;
}

export default function AddTaskModal({
  phases,
  initialTask,
  initialPhaseId,
  onClose,
  onSave,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RoadmapTask["category"]>("예창패");
  const [description, setDescription] = useState("");
  const [selectedPhase, setSelectedPhase] = useState(initialPhaseId);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setCategory(initialTask.category);
      setDescription(initialTask.description || "");
    } else {
      setTitle("");
      setCategory("예창패");
      setDescription("");
      setSelectedPhase(initialPhaseId);
    }
     
  }, [initialTask, initialPhaseId]);

  const handleSave = () => {
    if (!title.trim()) {
      alert("작업 제목을 입력해주세요.");
      return;
    }
    onSave(
      {
        title,
        category,
        description,
      },
      selectedPhase
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">
          {initialTask ? "작업 수정" : "작업 추가"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              작업 제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded"
              placeholder="작업 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as RoadmapTask["category"])
              }
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white"
            >
              <option value="예창패">예창패</option>
              <option value="아카데미">아카데미</option>
              <option value="공통">공통</option>
            </select>
          </div>

          {!initialTask && (
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                단계 (Phase)
              </label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white"
              >
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.title} ({phase.period})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded"
              placeholder="작업에 대한 설명을 입력하세요"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F5F5F5] text-[#1a1a1a] rounded hover:bg-[#E5E7EB] transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
