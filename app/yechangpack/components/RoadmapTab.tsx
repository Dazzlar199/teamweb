import React, { useState } from "react";
import type {
  RoadmapPhase,
  RoadmapTask,
  YechangpackDocument,
} from "@/lib/types/yechangpack";
import AddTaskModal from "./modals/AddTaskModal";
import AnnouncementModal from "./modals/AnnouncementModal";
import TaskDetailModal from "./modals/TaskDetailModal";

interface RoadmapTabProps {
  roadmapPhases: RoadmapPhase[];
  documents: YechangpackDocument[];
  currentUser: string;
  evaluationScores: {
    문제인식: number;
    해결방안: number;
    성장전략: number;
    팀구성: number;
  };
  onUpdateScores: (scores: any) => void;
  onTaskToggle: (phaseId: string, taskId: string) => void;
  // onTaskEdit is handled internally via openEditTask
  onTaskSave: (
    taskData: Partial<RoadmapTask>,
    phaseId: string,
    existingTaskId?: string
  ) => void;
  onTaskDelete: (phaseId: string, taskId: string) => void;
  onTaskNoteAdd: (
    phaseId: string,
    taskId: string,
    content: string,
    files: File[]
  ) => void;
  onTaskNoteDelete: (phaseId: string, taskId: string, noteId: string) => void;
  onDownloadDocument: (doc: YechangpackDocument) => void;
}

export default function RoadmapTab({
  roadmapPhases,
  documents,
  currentUser,
  evaluationScores,
  onUpdateScores,
  onTaskToggle,
  onTaskSave,
  onTaskDelete,
  onTaskNoteAdd,
  onTaskNoteDelete,
  onDownloadDocument,
}: RoadmapTabProps) {
  const [roadmapView, setRoadmapView] = useState<"vertical" | "horizontal">(
    "vertical"
  );
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [expandedSchedulePeriod, setExpandedSchedulePeriod] = useState<
    string | null
  >(null);

  // Modals state
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    phaseId: string;
    task: RoadmapTask;
  } | null>(null);
  const [selectedPhaseForTask, setSelectedPhaseForTask] =
    useState<string>("phase-1");

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncementDoc, setSelectedAnnouncementDoc] =
    useState<YechangpackDocument | null>(null);

  const [selectedTask, setSelectedTask] = useState<{
    phaseId: string;
    taskId: string;
  } | null>(null);

  const calculateProgress = (phase: RoadmapPhase) => {
    if (!phase.tasks || phase.tasks.length === 0) return 0;
    const completed = phase.tasks.filter((t) => t.completed).length;
    return Math.round((completed / phase.tasks.length) * 100);
  };

  const openAddTask = () => {
    setEditingTask(null);
    setSelectedPhaseForTask("phase-1");
    setShowAddTask(true);
  };

  const openEditTask = (phaseId: string, task: RoadmapTask) => {
    setEditingTask({ phaseId, task });
    setSelectedPhaseForTask(phaseId);
    setShowAddTask(true);
  };

  const handleSaveTaskWrapper = (
    taskData: Partial<RoadmapTask>,
    phaseId: string
  ) => {
    onTaskSave(taskData, phaseId, editingTask?.task.id);
  };

  // Find actual task object for detail modal
  const getSelectedTaskObject = () => {
    if (!selectedTask) return null;
    const phase = roadmapPhases.find((p) => p.id === selectedTask.phaseId);
    return phase?.tasks.find((t) => t.id === selectedTask.taskId) || null;
  };

  const selectedTaskObject = getSelectedTaskObject();

  return (
    <div className="space-y-4">
      {/* 뷰 전환 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">로드맵</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddTask}
            className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
          >
            + 작업 추가
          </button>
          <button
            onClick={() => setRoadmapView("vertical")}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              roadmapView === "vertical"
                ? "bg-[#3B82F6] text-white"
                : "bg-white border border-[#E2E8F0] text-[#4a5568] hover:bg-[#F5F5F5]"
            }`}
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              />
            </svg>
            세로
          </button>
          <button
            onClick={() => setRoadmapView("horizontal")}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              roadmapView === "horizontal"
                ? "bg-[#3B82F6] text-white"
                : "bg-white border border-[#E2E8F0] text-[#4a5568] hover:bg-[#F5F5F5]"
            }`}
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            가로
          </button>
        </div>
      </div>

      {/* 지원기간 일정표 */}
      <div className="bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-4">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-[#10B981]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
            />
          </svg>
          <div className="font-bold text-lg text-[#111827]">
            지원기간 일정표
          </div>
        </div>
        <div className="space-y-3">
          {[
            {
              period: "1~3월",
              title: "사전준비 + 기획 + 신청",
              status: "in_progress",
              color: "bg-blue-600",
              phaseId: "phase-1",
            },
            {
              period: "4~5월",
              title: "개발 + 평가",
              status: "upcoming",
              color: "bg-green-600",
              phaseId: "phase-2",
            },
            {
              period: "6~8월",
              title: "런칭 + 사업수행",
              status: "upcoming",
              color: "bg-amber-500",
              phaseId: "phase-3",
            },
            {
              period: "9~12월",
              title: "사업 확장",
              status: "upcoming",
              color: "bg-indigo-600",
              phaseId: "phase-4",
            },
          ].map((item, index) => {
            const phase = roadmapPhases.find((p) => p.id === item.phaseId);
            const isExpanded = expandedSchedulePeriod === item.period;
            const completedTasks =
              phase?.tasks.filter((t) => t.completed).length || 0;
            const totalTasks = phase?.tasks.length || 0;

            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden"
              >
                <div
                  className="flex items-center gap-4 p-3 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                  onClick={() =>
                    setExpandedSchedulePeriod(isExpanded ? null : item.period)
                  }
                >
                  <div
                    className={`w-20 h-12 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-xs font-bold text-white">
                      {item.period}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1 text-[#111827]">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {phase?.description || `사업수행 기간: ${item.period}`}
                      {totalTasks > 0 && (
                        <span className="ml-2">
                          • 작업 {completedTasks}/{totalTasks} 완료
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === "in_progress" && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                        진행중
                      </span>
                    )}
                    {item.status === "upcoming" && (
                      <span className="px-2 py-1 bg-[#F3F4F6] text-[#6B7280] text-xs font-medium rounded">
                        예정
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* 세부내역 */}
                {isExpanded && phase && (
                  <div className="border-t border-[#E5E7EB]">
                    <div className="mb-3">
                      <div className="text-xs text-[#6B7280]">
                        {phase.period} •{" "}
                        {phase.status === "completed"
                          ? "완료"
                          : phase.status === "in_progress"
                          ? "진행중"
                          : "예정"}
                      </div>
                      <div className="text-sm text-[#111827]">
                        {phase.description}
                      </div>
                      {totalTasks > 0 && (
                        <div className="w-full bg-[#E5E7EB] rounded-full h-2 mt-2">
                          <div
                            className="bg-[#10B981] h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(completedTasks / totalTasks) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {phase.tasks && phase.tasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-[#111827]">
                          주요 작업 ({totalTasks}개)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {phase.tasks.slice(0, 6).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start gap-2 p-2 bg-white rounded border border-[#E5E7EB]"
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 ${
                                  task.completed
                                    ? "bg-[#10B981] border-[#10B981]"
                                    : "border-[#D1D5DB]"
                                }`}
                              >
                                {task.completed && (
                                  <svg
                                    className="w-full h-full text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-xs ${
                                    task.completed
                                      ? "text-[#6B7280]"
                                      : "text-[#111827]"
                                  }`}
                                >
                                  {task.title}
                                </div>
                                {task.category && (
                                  <div className="text-xs text-[#9CA3AF]">
                                    {task.category}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {phase.tasks.length > 6 && (
                          <div className="text-xs text-[#6B7280]">
                            외 {phase.tasks.length - 6}개 작업 더...
                          </div>
                        )}
                      </div>
                    )}

                    {(!phase.tasks || phase.tasks.length === 0) && (
                      <div className="text-xs text-[#6B7280]">
                        등록된 작업이 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 평가 기준 - 점수 입력 가능 */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <svg
            className="w-5 h-5 text-indigo-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          <div className="font-bold text-lg text-[#111827]">
            평가 기준 (총 100점)
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm text-[#6B7280]">
              총점:{" "}
              <span className="font-bold text-[#111827]">
                {Object.values(evaluationScores).reduce((a, b) => a + b, 0)}점
              </span>
            </div>
            <button
              onClick={() => {
                const announcementDoc = documents.find(
                  (doc) =>
                    doc.category === "공고" && doc.name.includes("모집공고")
                );
                if (announcementDoc) {
                  setSelectedAnnouncementDoc(announcementDoc);
                  setShowAnnouncementModal(true);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#3B82F6] bg-[#EFF6FF] rounded-md hover:bg-[#DBEAFE] transition-colors flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              2025 공고문 확인
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: "문제인식",
              color: "bg-[#EF4444]",
              iconPath:
                "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
              key: "문제인식" as keyof typeof evaluationScores,
            },
            {
              name: "해결방안",
              color: "bg-blue-500",
              iconPath:
                "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
              key: "해결방안" as keyof typeof evaluationScores,
            },
            {
              name: "성장전략",
              color: "bg-[#10B981]",
              iconPath:
                "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94",
              key: "성장전략" as keyof typeof evaluationScores,
            },
            {
              name: "팀구성",
              color: "bg-[#F59E0B]",
              iconPath:
                "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
              key: "팀구성" as keyof typeof evaluationScores,
            },
          ].map((item) => {
            const score = evaluationScores[item.key];
            const percentage = (score / 25) * 100;
            const isDanger = score < 15;

            return (
              <div
                key={item.key}
                className={`bg-gradient-to-br from-white to-[#FAFBFC] rounded-lg border-2 p-5 shadow-sm transition-all hover:shadow-md ${
                  isDanger
                    ? "border-[#EF4444] bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2]"
                    : "border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-2.5 flex-1">
                    <div
                      className={`p-2 rounded-lg ${item.color} bg-opacity-10`}
                    >
                      <svg
                        className={`w-5 h-5 ${item.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={item.iconPath}
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#111827]">
                          {item.name}
                        </span>
                        <span className="text-xs font-medium text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">
                          /25점
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 점수 입력 */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={score}
                      onChange={(e) => {
                        const newScore = Math.min(
                          25,
                          Math.max(0, parseInt(e.target.value) || 0)
                        );
                        onUpdateScores({
                          ...evaluationScores,
                          [item.key]: newScore,
                        });
                      }}
                      className="w-full px-4 py-3 bg-white border-2 border-[#D1D5DB] rounded-lg text-lg text-center font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all"
                      placeholder="0"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-[#9CA3AF] font-medium">
                      점
                    </div>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="w-full bg-[#E5E7EB] rounded-full h-3 mb-3 overflow-hidden">
                  <div
                    className={`${
                      item.color
                    } h-3 rounded-full transition-all duration-500 ${
                      isDanger ? "animate-pulse" : ""
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isDanger ? "text-[#EF4444]" : "text-[#111827]"
                      }`}
                    >
                      {score}점
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  {isDanger && (
                    <span className="text-[#EF4444] font-bold text-xs flex items-center gap-1 bg-[#FEF2F2] px-2 py-1 rounded">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      탈락 위험
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 탈락조건 - 작게 표시 */}
      <div className="text-xs text-[#6B7280]">
        <svg
          className="w-3 h-3 text-[#EF4444]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>
          4개 항목 중 어느 하나라도 60% 미만(15점 미만)이면 무조건 탈락합니다.
        </span>
      </div>

      {/* 가로 타임라인 뷰 */}
      {roadmapView === "horizontal" ? (
        <div className="relative">
          {/* 타임라인 선 */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#E5E7EB] transform -translate-y-1/2 z-0" />

          {/* 단계 카드들 */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {roadmapPhases.map((phase) => {
              const progress = calculateProgress(phase);
              const statusColors = {
                completed: "bg-[#22c55e]",
                in_progress: "bg-[#3B82F6]",
                upcoming: "bg-white",
              };
              const dotColors = {
                completed: "bg-[#22c55e]",
                in_progress: "bg-[#3B82F6]",
                upcoming: "bg-[#CBD5E0]",
              };

              return (
                <div key={phase.id} className="relative z-10">
                  {/* 타임라인 점 */}
                  <div className="flex justify-center mb-3">
                    <div
                      className={`w-5 h-5 rounded-full ${
                        dotColors[phase.status]
                      } border-2 border-white`}
                    />
                  </div>

                  {/* 카드 */}
                  <div
                    className={`bg-white rounded-lg border-2 p-4 min-h-[200px] cursor-pointer transition-colors ${
                      statusColors[phase.status]
                    }`}
                    onClick={() =>
                      setExpandedPhase(
                        expandedPhase === phase.id ? null : phase.id
                      )
                    }
                  >
                    <div className="mb-3">
                      <div
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                          phase.status === "completed"
                            ? "bg-[#22c55e] text-white"
                            : phase.status === "in_progress"
                            ? "bg-[#3B82F6]"
                            : "bg-[#F5F5F5]"
                        }`}
                      >
                        {phase.status === "completed" && "완료"}
                        {phase.status === "in_progress" && "진행중"}
                        {phase.status === "upcoming" && "예정"}
                      </div>
                      <h3 className="font-semibold text-[#111827] text-sm mb-1 leading-tight">
                        {phase.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] mb-2">
                        {phase.period}
                      </p>
                    </div>

                    {/* 진행률 */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#6B7280]">진행률</span>
                        <span className="text-xs font-semibold text-[#1a1a1a]">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-[#F5F5F5] rounded-full h-1.5">
                        <div
                          className="bg-[#3B82F6] h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* 설명 */}
                    <p className="text-xs text-[#6B7280] line-clamp-2">
                      {phase.description}
                    </p>

                    {/* 태스크 개수 */}
                    <div className="mt-3 pt-2 border-t border-[#E5E7EB]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">
                          {phase.tasks.filter((t) => t.completed).length} /{" "}
                          {phase.tasks.length} 완료
                        </span>
                        <svg
                          className={`w-4 h-4 text-[#6B7280] transition-transform ${
                            expandedPhase === phase.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 확장된 태스크 목록 */}
                  {expandedPhase === phase.id && (
                    <div className="mt-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-3">
                      <div className="space-y-1.5">
                        {phase.tasks.map((task) => {
                          const categoryColors = {
                            아카데미: "bg-[#F59E0B] text-white",
                            예창패: "bg-[#A855F7] text-white",
                            공통: "bg-[#6B7280] text-white",
                          };

                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 p-1.5 bg-white group/task"
                            >
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  onTaskToggle(phase.id, task.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3 h-3 text-[#1a1a1a]"
                              />
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  categoryColors[task.category]
                                }`}
                              >
                                {task.category}
                              </span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask({
                                    phaseId: phase.id,
                                    taskId: task.id,
                                  });
                                }}
                                className={`flex-1 text-xs cursor-pointer hover:text-[#1a1a1a] ${
                                  task.completed
                                    ? "text-[#9CA3AF] line-through"
                                    : "text-[#111827]"
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.details && (
                                <svg
                                  className="w-3 h-3 text-[#6B7280]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                              <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditTask(phase.id, task);
                                  }}
                                  className="p-0.5 text-[#6B7280] hover:text-[#3B82F6] transition-colors"
                                  title="수정"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskDelete(phase.id, task.id);
                                  }}
                                  className="p-0.5 text-[#6B7280] hover:text-[#EF4444] transition-colors"
                                  title="삭제"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 세로 뷰 */
        <>
          {/* 로드맵 단계들 */}
          {roadmapPhases.map((phase) => {
            const progress = calculateProgress(phase);
            const statusColors = {
              completed: "bg-[#22c55e] text-white",
              in_progress: "bg-[#3B82F6]",
              upcoming: "bg-[#F5F5F5]",
            };

            return (
              <div key={phase.id} className="bg-white">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedPhase(
                      expandedPhase === phase.id ? null : phase.id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[phase.status]
                        }`}
                      >
                        {phase.status === "completed" && "완료"}
                        {phase.status === "in_progress" && "진행중"}
                        {phase.status === "upcoming" && "예정"}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#111827]">
                          {phase.title}
                        </h3>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {phase.period}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-[#111827]">
                          {progress}%
                        </div>
                        <div className="w-24 bg-[#F3F4F6]">
                          <div
                            className="bg-[#3B82F6]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-[#6B7280] transition-transform ${
                          expandedPhase === phase.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-2">
                    {phase.description}
                  </p>
                </div>

                {expandedPhase === phase.id && (
                  <div className="border-t border-[#E5E7EB] p-4 bg-[#F9FAFB]">
                    <div className="space-y-2">
                      {phase.tasks.map((task) => {
                        const categoryColors = {
                          아카데미: "bg-[#F59E0B] text-white",
                          예창패: "bg-[#A855F7] text-white",
                          공통: "bg-[#6B7280] text-white",
                        };

                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-2 bg-white group/task"
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                onTaskToggle(phase.id, task.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-[#1a1a1a]"
                            />
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                categoryColors[task.category]
                              }`}
                            >
                              {task.category}
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask({
                                  phaseId: phase.id,
                                  taskId: task.id,
                                });
                              }}
                              className={`flex-1 text-sm cursor-pointer hover:text-[#1a1a1a] ${
                                task.completed
                                  ? "text-[#9CA3AF] line-through"
                                  : "text-[#111827]"
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.details && (
                              <svg
                                className="w-4 h-4 text-[#6B7280]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTask(phase.id, task);
                                }}
                                className="p-1 text-[#6B7280] hover:text-[#3B82F6] transition-colors"
                                title="수정"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTaskDelete(phase.id, task.id);
                                }}
                                className="p-1 text-[#6B7280] hover:text-[#EF4444] transition-colors"
                                title="삭제"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* 모달 렌더링 */}
      {showAddTask && (
        <AddTaskModal
          phases={roadmapPhases}
          initialTask={editingTask?.task || null}
          initialPhaseId={selectedPhaseForTask}
          onClose={() => setShowAddTask(false)}
          onSave={handleSaveTaskWrapper}
        />
      )}

      {showAnnouncementModal && selectedAnnouncementDoc && (
        <AnnouncementModal
          document={selectedAnnouncementDoc}
          documents={documents}
          onClose={() => setShowAnnouncementModal(false)}
          onDownload={onDownloadDocument}
        />
      )}

      {selectedTask && selectedTaskObject && (
        <TaskDetailModal
          task={selectedTaskObject}
          phaseId={selectedTask.phaseId}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onToggleComplete={() =>
            onTaskToggle(selectedTask.phaseId, selectedTask.taskId)
          }
          onAddNote={(content, files) =>
            onTaskNoteAdd(
              selectedTask.phaseId,
              selectedTask.taskId,
              content,
              files
            )
          }
          onDeleteNote={(noteId) =>
            onTaskNoteDelete(
              selectedTask.phaseId,
              selectedTask.taskId,
              noteId
            )
          }
        />
      )}
    </div>
  );
}
