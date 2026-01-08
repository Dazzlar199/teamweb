"use client";

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
  evaluationScores: { 문제인식: number; 해결방안: number; 성장전략: number; 팀구성: number; };
  onUpdateScores: (scores: any) => void;
  onTaskToggle: (phaseId: string, taskId: string) => void;
  onTaskSave: (taskData: Partial<RoadmapTask>, phaseId: string, existingTaskId?: string) => void;
  onTaskDelete: (phaseId: string, taskId: string) => void;
  onTaskNoteAdd: (phaseId: string, taskId: string, content: string, files: File[]) => void;
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
  const [expandedPhase, setExpandedPhase] = useState<string | null>("phase-1");
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<{ phaseId: string; task: RoadmapTask } | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ phaseId: string; taskId: string } | null>(null);
  
  // 가이드 모달 상태
  const [guideCategory, setGuideCategory] = useState<keyof typeof EVALUATION_GUIDES | null>(null);

  const calculateProgress = (phase: RoadmapPhase) => {
    if (!phase.tasks || phase.tasks.length === 0) return 0;
    const completed = phase.tasks.filter((t) => t.completed).length;
    return Math.round((completed / phase.tasks.length) * 100);
  };

  // 공고문 기반 평가 가이드 데이터 (복구)
  const EVALUATION_GUIDES = {
    "문제인식": {
      title: "문제인식 (PS: Problem Solving)",
      points: ["창업 아이템의 개발 동기 및 목적의 명확성", "창업 아이템의 필요성 및 차별성", "타겟 고객의 페인 포인트(Pain Point) 분석 수준"],
      advice: "공고문의 '사업의 필요성' 섹션을 참고하여 현재 시장의 결핍을 데이터로 증명하세요."
    },
    "해결방안": {
      title: "해결방안 (Solution)",
      points: ["창업 아이템의 구현 가능성 및 구체성", "창업 아이템의 시장 적합성(Product-Market Fit)", "경쟁사 대비 우위 요소 및 기술적 차별성"],
      advice: "비즈니스 모델(BM)과 서비스 흐름도를 시각화하여 실현 가능성을 강조하세요."
    },
    "성장전략": {
      title: "성장전략 (Scale-up)",
      points: ["자금 조달 계획 및 집행의 적정성", "시장 진입 전략 및 마케팅 방안", "국내외 시장 확장성 및 글로벌 진출 가능성"],
      advice: "연도별 목표 매출과 고용 계획을 구체적으로 제시하고, 현실적인 마케팅 채널을 확보하세요."
    },
    "팀구성": {
      title: "팀구성 (Team)",
      points: ["대표자 및 팀원의 역량(경력, 학력, 전문성)", "업무 분담의 적정성 및 협업 체계", "사회적 가치 창출 및 ESG 경영 의지"],
      advice: "팀원이 아이템 구현에 최적화된 인재임을 강조하고, 부족한 역량의 보완 계획(외주, 채용 등)을 명시하세요."
    }
  };

  return (
    <div className="space-y-10">
      
      {/* 1. 평가 기준 및 자가진단 가이드 (연동형) */}
      <div className="glass-card rounded-3xl bg-white p-8 border-l-8 border-l-indigo-600 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              사업계획서 자가 진단 및 가이드
            </h2>
            <p className="text-sm text-slate-400 font-bold mt-1">항목을 클릭하면 공고문 기반 가이드가 나타납니다</p>
          </div>
          <button 
            onClick={() => {
              const doc = documents.find(d => d.category === "공고");
              if (doc) onDownloadDocument(doc);
            }}
            className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all"
          >
            공고문 전체 보기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {(["문제인식", "해결방안", "성장전략", "팀구성"] as const).map((key) => {
            const score = evaluationScores[key];
            const isActive = guideCategory === key;
            return (
              <div 
                key={key} 
                onClick={() => setGuideCategory(isActive ? null : key)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all group ${isActive ? "bg-indigo-600 border-indigo-600 shadow-lg scale-105" : "bg-slate-50/50 border-slate-100 hover:border-indigo-200"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[13px] font-black ${isActive ? "text-white" : "text-slate-700"}`}>{key}</span>
                  <span className={`text-[11px] font-bold ${isActive ? "text-indigo-200" : "text-slate-400"}`}>/ 25</span>
                </div>
                <div className={`text-2xl font-black mb-4 ${isActive ? "text-white" : "text-slate-900"}`}>{score}점</div>
                <div className={`h-1 w-full rounded-full overflow-hidden ${isActive ? "bg-indigo-400" : "bg-slate-100"}`}>
                  <div className={`h-full bg-current transition-all duration-700 ${isActive ? "text-white" : "text-indigo-500"}`} style={{ width: `${(score/25)*100}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 항목의 가이드 (지능형 노출) */}
        {guideCategory && (
          <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 animate-slide-in">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-black text-indigo-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {EVALUATION_GUIDES[guideCategory].title} 평가 포인트
                </h4>
                <ul className="space-y-2 mb-4">
                  {EVALUATION_GUIDES[guideCategory].points.map((p, i) => (
                    <li key={i} className="text-sm text-indigo-700 font-bold flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-400" /> {p}
                    </li>
                  ))}
                </ul>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-medium italic">💡 {EVALUATION_GUIDES[guideCategory].advice}</p>
                </div>
              </div>
              <button onClick={() => setGuideCategory(null)} className="text-indigo-300 hover:text-indigo-600 font-black">✕</button>
            </div>
          </div>
        )}
      </div>

      {/* 2. 추진 단계 (로드맵 카드 리스트) */}
      <div className="space-y-6">
        <h2 className="text-lg font-black text-slate-900 px-2">프로젝트 마일스톤</h2>
        <div className="space-y-4">
          {roadmapPhases.map((phase) => {
            const progress = calculateProgress(phase);
            const isExpanded = expandedPhase === phase.id;
            return (
              <div key={phase.id} className="glass-card rounded-3xl bg-white overflow-hidden shadow-sm">
                <div 
                  className={`p-6 cursor-pointer flex items-center justify-between transition-colors ${isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50/30"}`}
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
                      phase.status === 'completed' ? "bg-emerald-500 text-white" : 
                      phase.status === 'in_progress' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {phase.id.split('-')[1]}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{phase.title}</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{phase.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-black text-slate-900 mb-1.5">{progress}%</div>
                      <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-white border-t border-slate-50">
                    <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">{phase.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {phase.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group">
                          <input 
                            type="checkbox" 
                            checked={task.completed} 
                            onChange={() => onTaskToggle(phase.id, task.id)}
                            className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${task.completed ? "text-slate-300 line-through" : "text-slate-700"}`}>{task.title}</p>
                            {task.description && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{task.description}</p>}
                          </div>
                          <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            {task.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAddTask && (
        <AddTaskModal 
          phases={roadmapPhases} initialTask={editingTask?.task || null} 
          initialPhaseId={selectedPhaseForTask} onClose={() => setShowAddTask(false)} 
          onSave={(data, pid) => onTaskSave(data, pid, editingTask?.task.id)} 
        />
      )}
    </div>
  );
}
