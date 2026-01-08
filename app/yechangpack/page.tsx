"use client";

import { useState, useEffect } from "react";
import { addActivityLog } from "@/lib/utils/activityLog";
import {
  saveDocument,
  deleteDocument,
  getDocuments,
} from "@/lib/utils/document";
import { getLocalStorage, setLocalStorage } from "@/lib/utils/localStorage";
import { useUser } from "@/lib/context/UserContext";

import type {
  RoadmapPhase,
  RoadmapTask,
  Note,
  ChecklistItem,
  YechangpackDocument,
} from "@/lib/types/yechangpack";
import type {
  Document as EvidenceDocument,
  DocumentCategory,
} from "@/lib/types/document";

// Sub-components
import RoadmapTab from "./components/RoadmapTab";
import DocumentsTab from "./components/DocumentsTab";
import EvidenceTab from "./components/EvidenceTab";
import NotesTab from "./components/NotesTab";
import ChecklistTab from "./components/ChecklistTab";

export default function YechangpackPage() {
  const { user } = useUser();
  const currentUser = user?.name || "김찬주";
  const [activeTab, setActiveTab] = useState<
    "roadmap" | "documents" | "notes" | "checklist" | "evidence"
  >("roadmap");

  // Data State
  const [roadmapPhases, setRoadmapPhases] = useState<RoadmapPhase[]>([]);
  const [documents, setDocuments] = useState<YechangpackDocument[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [evidenceDocuments, setEvidenceDocuments] = useState<
    EvidenceDocument[]
  >([]);
  const [selectedEvidenceCategory, setSelectedEvidenceCategory] = useState<
    DocumentCategory | "all"
  >("all");

  const [evaluationScores, setEvaluationScores] = useState({
    문제인식: 0,
    해결방안: 0,
    성장전략: 0,
    팀구성: 0,
  });

  // --- Initial Data Loading ---
  useEffect(() => {
    // Roadmap Data
    let roadmapData = getLocalStorage<RoadmapPhase[]>(
      "yechangpack-roadmap",
      []
    );
    if (roadmapData.length === 0) {
      const initialPhases: RoadmapPhase[] = [
        {
          id: "phase-1",
          title: "사전준비 + 기획 + 신청 (26년 1~3월)",
          period: "2026.01 ~ 2026.03",
          status: "in_progress",
          description:
            "사전준비 완료 + 예창패 신청 완료 + 아카데미 기획 완료",
          tasks: [],
        },
        {
          id: "phase-2",
          title: "개발 + 평가 (26년 4~5월)",
          period: "2026.04 ~ 2026.05",
          status: "upcoming",
          description: "MVP 개발 + 서류/발표 평가 대응",
          tasks: [],
        },
        {
          id: "phase-3",
          title: "런칭 + 사업수행 (26년 6~8월)",
          period: "2026.06 ~ 2026.08",
          status: "upcoming",
          description: "서비스 정식 런칭 + 초기 고객 확보",
          tasks: [],
        },
        {
          id: "phase-4",
          title: "사업 확장 (26년 9~12월)",
          period: "2026.09 ~ 2026.12",
          status: "upcoming",
          description: "서비스 고도화 + 마케팅 확대",
          tasks: [],
        },
      ];
      roadmapData = initialPhases;
      setLocalStorage("yechangpack-roadmap", roadmapData);
    }
    setRoadmapPhases(roadmapData);

    // Other Data
    setDocuments(
      getLocalStorage<YechangpackDocument[]>("yechangpack-documents", [])
    );
    setNotes(getLocalStorage<Note[]>("yechangpack-notes", []));
    setChecklistItems(
      getLocalStorage<ChecklistItem[]>("yechangpack-checklist", [])
    );
    setEvaluationScores(
      getLocalStorage("yechangpack-scores", {
        문제인식: 0,
        해결방안: 0,
        성장전략: 0,
        팀구성: 0,
      })
    );
    setEvidenceDocuments(getDocuments());
  }, []);

  // --- Handlers: Roadmap ---
  const updateRoadmapPhases = (newPhases: RoadmapPhase[]) => {
    setRoadmapPhases(newPhases);
    setLocalStorage("yechangpack-roadmap", newPhases);
  };

  const handleTaskToggle = (phaseId: string, taskId: string) => {
    const newPhases = roadmapPhases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map((task) => {
            if (task.id === taskId) {
              const newCompleted = !task.completed;
              addActivityLog({
                user: currentUser,
                type: "task",
                action: newCompleted ? "complete_task" : "uncomplete_task",
                targetTitle: task.title,
              });
              return { ...task, completed: newCompleted };
            }
            return task;
          }),
        };
      }
      return phase;
    });
    updateRoadmapPhases(newPhases);
  };

  const handleTaskSave = (
    taskData: Partial<RoadmapTask>,
    phaseId: string,
    existingTaskId?: string
  ) => {
    const newPhases = roadmapPhases.map((phase) => {
      if (phase.id === phaseId) {
        let newTasks = [...phase.tasks];
        if (existingTaskId) {
          // Update
          newTasks = newTasks.map((t) =>
            t.id === existingTaskId ? { ...t, ...taskData } : t
          );
          addActivityLog({
            user: currentUser,
            type: "task",
            action: "update_task",
            targetTitle: taskData.title || "작업 수정",
          });
        } else {
          // Add
          const newTask: RoadmapTask = {
            id: `task-${Date.now()}`,
            completed: false,
            category: "예창패", // default
            title: "", // default
            ...taskData,
          } as RoadmapTask;
          newTasks.push(newTask);
          addActivityLog({
            user: currentUser,
            type: "task",
            action: "create_task",
            targetTitle: newTask.title,
          });
        }
        return { ...phase, tasks: newTasks };
      }
      return phase;
    });
    updateRoadmapPhases(newPhases);
  };

  const handleTaskDelete = (phaseId: string, taskId: string) => {
    if (!confirm("정말 이 작업을 삭제하시겠습니까?")) return;
    const newPhases = roadmapPhases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.filter((t) => t.id !== taskId),
        };
      }
      return phase;
    });
    updateRoadmapPhases(newPhases);
    addActivityLog({
      user: currentUser,
      type: "task",
      action: "delete_task",
      targetTitle: "작업 삭제",
    });
  };

  const handleTaskNoteAdd = (
    phaseId: string,
    taskId: string,
    content: string,
    files: File[]
  ) => {
    const newPhases = roadmapPhases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map((task) => {
            if (task.id === taskId) {
              const newNote = {
                id: Date.now().toString(),
                content,
                author: currentUser,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                attachments: files.map((file) => ({
                  id: Date.now().toString() + Math.random(),
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  uploadedBy: currentUser,
                  uploadedAt: new Date().toISOString(),
                })),
              };
              return {
                ...task,
                notes: [newNote, ...(task.notes || [])],
              };
            }
            return task;
          }),
        };
      }
      return phase;
    });
    updateRoadmapPhases(newPhases);
  };

  const handleTaskNoteDelete = (
    phaseId: string,
    taskId: string,
    noteId: string
  ) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const newPhases = roadmapPhases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                notes: (task.notes || []).filter((n) => n.id !== noteId),
              };
            }
            return task;
          }),
        };
      }
      return phase;
    });
    updateRoadmapPhases(newPhases);
  };

  const handleUpdateScores = (newScores: typeof evaluationScores) => {
    setEvaluationScores(newScores);
    setLocalStorage("yechangpack-scores", newScores);
  };

  // --- Handlers: Checklist ---
  const updateChecklist = (newItems: ChecklistItem[]) => {
    setChecklistItems(newItems);
    setLocalStorage("yechangpack-checklist", newItems);
  };

  const handleChecklistToggle = (id: string) => {
    const newItems = checklistItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateChecklist(newItems);
  };

  const handleChecklistEdit = (item: ChecklistItem) => {
    // Simplified edit: Prompt for now to keep functionality without new modals
    const newTitle = prompt("수정할 내용을 입력하세요:", item.title);
    if (newTitle !== null) {
      const newItems = checklistItems.map((i) =>
        i.id === item.id ? { ...i, title: newTitle } : i
      );
      updateChecklist(newItems);
    }
  };

  const handleChecklistDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    updateChecklist(checklistItems.filter((i) => i.id !== id));
  };

  const handleChecklistAdd = () => {
    const title = prompt("체크리스트 항목을 입력하세요:");
    if (title) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        title,
        completed: false,
        category: "서류",
        phase: "phase-1",
      };
      updateChecklist([...checklistItems, newItem]);
    }
  };

  // --- Handlers: Notes ---
  const handleNoteAdd = (note: Note) => {
    const newNotes = [note, ...notes];
    setNotes(newNotes);
    setLocalStorage("yechangpack-notes", newNotes);
    addActivityLog({
      user: currentUser,
      type: "note",
      action: "create_note",
      targetTitle: note.title,
    });
  };

  const handleNoteUpdate = (id: string, updates: Partial<Note>) => {
    const newNotes = notes.map((n) =>
      n.id === id ? { ...n, ...updates } : n
    );
    setNotes(newNotes);
    setLocalStorage("yechangpack-notes", newNotes);
  };

  const handleNoteDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const newNotes = notes.filter((n) => n.id !== id);
    setNotes(newNotes);
    setLocalStorage("yechangpack-notes", newNotes);
  };

  // --- Handlers: Evidence ---
  const handleEvidenceSave = (data: any, file: File | null) => {
    const newDoc: EvidenceDocument = {
      id: Date.now().toString(),
      name: data.name,
      category: data.category,
      type: data.type,
      fileUrl: file ? URL.createObjectURL(file) : "",
      fileSize: file ? file.size : 0,
      fileType: file ? file.type : "",
      required: data.required,
      status: "uploaded",
      uploadedBy: currentUser,
      uploadedAt: Date.now(),
      tags: [],
      description: data.description,
    };
    saveDocument(newDoc);
    setEvidenceDocuments(getDocuments());
  };

  const handleEvidenceDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    deleteDocument(id);
    setEvidenceDocuments(getDocuments());
  };

  // --- Handlers: Documents (Downloads) ---
  const handleDownload = (doc: YechangpackDocument) => {
    alert(`다운로드 시작: ${doc.name}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              2026 예비창업패키지
            </h1>
            <p className="text-sm text-[#6B7280]">
              특별시 팀의 예창패 도전 로드맵 및 관리 대시보드
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280]">
              마지막 업데이트: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#E5E7EB] mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: "roadmap", label: "로드맵" },
              { id: "checklist", label: "체크리스트" },
              { id: "evidence", label: "증빙자료" },
              { id: "documents", label: "자료실" },
              { id: "notes", label: "기록" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-[#3B82F6] text-[#3B82F6]"
                      : "border-transparent text-[#6B7280] hover:text-[#374151] hover:border-[#D1D5DB]"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === "roadmap" && (
            <RoadmapTab
              roadmapPhases={roadmapPhases}
              documents={documents}
              currentUser={currentUser}
              evaluationScores={evaluationScores}
              onUpdateScores={handleUpdateScores}
              onTaskToggle={handleTaskToggle}
              onTaskSave={handleTaskSave}
              onTaskDelete={handleTaskDelete}
              onTaskNoteAdd={handleTaskNoteAdd}
              onTaskNoteDelete={handleTaskNoteDelete}
              onDownloadDocument={handleDownload}
            />
          )}

          {activeTab === "checklist" && (
            <ChecklistTab
              checklistItems={checklistItems}
              roadmapPhases={roadmapPhases}
              onToggle={handleChecklistToggle}
              onEdit={handleChecklistEdit}
              onDelete={handleChecklistDelete}
              onAdd={handleChecklistAdd}
            />
          )}

          {activeTab === "evidence" && (
            <EvidenceTab
              evidenceDocuments={evidenceDocuments}
              onDelete={handleEvidenceDelete}
              onSave={handleEvidenceSave}
              selectedCategory={selectedEvidenceCategory}
              onCategoryChange={setSelectedEvidenceCategory}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsTab
              documents={documents}
              onDownload={handleDownload}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab
              notes={notes}
              onAdd={handleNoteAdd}
              onUpdate={handleNoteUpdate}
              onDelete={handleNoteDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
