"use client";

import { useState, useEffect } from "react";
import { addActivityLog } from "@/lib/utils/activityLog";
import { getDocuments } from "@/lib/utils/document";
import { getLocalStorage, setLocalStorage } from "@/lib/utils/localStorage";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/lib/context/ToastContext";

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
  const { showToast } = useToast();
  const currentUser = user?.name || "김찬주";
  const [activeTab, setActiveTab] = useState<"roadmap" | "checklist" | "evidence" | "documents" | "notes">("roadmap");

  const [roadmapPhases, setRoadmapPhases] = useState<RoadmapPhase[]>([]);
  const [documents, setDocuments] = useState<YechangpackDocument[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [evidenceDocuments, setEvidenceDocuments] = useState<EvidenceDocument[]>([]);
  const [selectedEvidenceCategory, setSelectedEvidenceCategory] = useState<DocumentCategory | "all">("all");
  const [evaluationScores, setEvaluationScores] = useState({ 문제인식: 0, 해결방안: 0, 성장전략: 0, 팀구성: 0 });

  useEffect(() => {
    // 1. 기존 저장된 데이터 로드 시도
    const savedRoadmap = getLocalStorage<RoadmapPhase[]>("yechangpack-roadmap", []);
    const savedChecklist = getLocalStorage<ChecklistItem[]>("yechangpack-checklist", []);
    const savedScores = getLocalStorage("yechangpack-scores", { 문제인식: 0, 해결방안: 0, 성장전략: 0, 팀구성: 0 });
    const savedNotes = getLocalStorage<Note[]>("yechangpack-notes", []);

    // 2. 데이터가 없을 경우에만 초기값 설정
    if (savedRoadmap.length === 0) {
      const INITIAL_ROADMAP: RoadmapPhase[] = [
        {
          id: "phase-1",
          title: "1단계: 공고 및 서류 접수 (1월 ~ 3월)",
          period: "2026.01 ~ 2026.03.14",
          status: "in_progress",
          description: "2025년 지침 분석 기반 PSST 사업계획서 최종 고도화 및 온라인 접수",
          tasks: [
            { 
              id: "task-1-1", title: "PSST 사업계획서 최종안 작성", completed: false, category: "예창패",
              description: "2025년 공식 양식 벤치마킹 (문제인식, 해결방안, 성장전략, 팀구성)",
              details: { 목표: "서류 합격", 담당자: "김찬주", 체크리스트: ["가점 항목 증빙 확보", "시장 규모 최신화", "BM 도식화"] }
            },
            { id: "task-1-2", title: "사실증명(창업여부) 및 졸업증명서 등 서류 구비", completed: false, category: "예창패" },
            { id: "task-1-3", title: "고객 검증 데이터 및 설문 결과 분석 보고서 완성", completed: false, category: "공통" },
          ],
        },
        {
          id: "phase-2",
          title: "2단계: 선정 평가 및 면접 (4월 ~ 5월)",
          period: "2026.04 ~ 2026.05",
          status: "upcoming",
          description: "서류 통과 후 발표 평가(PT) 및 최종 선정 절차",
          tasks: [
            { id: "task-2-1", title: "발표용 PT 덱(Deck) 제작 및 리허설", completed: false, category: "예창패" },
            { id: "task-2-2", title: "심층 면접 예상 Q&A 및 방어 전략 수립", completed: false, category: "예창패" },
          ],
        },
        {
          id: "phase-3",
          title: "3단계: 협약 및 사업비 세팅 (6월)",
          period: "2026.06",
          status: "upcoming",
          description: "협약 체결 및 사업비 카드 발급, 시스템 등록",
          tasks: [
            { id: "task-3-1", title: "주관기관 협약 체결 및 수정 사업계획서 제출", completed: false, category: "예창패" },
            { id: "task-3-2", title: "사업비 전용 계좌 개설 및 바우처 카드 발급", completed: false, category: "예창패" },
          ],
        },
        {
          id: "phase-4",
          title: "4단계: 사업 수행 및 제품 개발 (6월 ~ 10월)",
          period: "2026.06 ~ 2026.10",
          status: "upcoming",
          description: "본격적인 서비스 MVP 개발 및 사업비 집행 시작",
          tasks: [
            { id: "task-4-1", title: "웨딩 데모 서비스 MVP 정식 런칭", completed: false, category: "공통" },
            { id: "task-4-2", title: "사업비 집행 (외주비, 마케팅비, 운영비)", completed: false, category: "예창패" },
            { id: "task-4-3", title: "전담 멘토링 및 네트워킹 프로그램 참여", completed: false, category: "예창패" },
          ],
        },
        {
          id: "phase-5",
          title: "5단계: 중간 점검 및 목표 달성 (11월)",
          period: "2026.11",
          status: "upcoming",
          description: "중간 보고서 제출 및 핵심 지표(KPI) 달성 여부 확인",
          tasks: [
            { id: "task-5-1", title: "중간 보고서 및 집행 실적 온라인 제출", completed: false, category: "예창패" },
            { id: "task-5-2", title: "사용자 피드백 기반 서비스 고도화", completed: false, category: "공통" },
          ],
        },
        {
          id: "phase-6",
          title: "6단계: 최종 성과 보고 및 정산 (12월 ~ 27.01)",
          period: "2026.12 ~ 2027.01",
          status: "upcoming",
          description: "사업 성과 최종 보고서 제출 및 회계 감사/정산 완료",
          tasks: [
            { id: "task-6-1", title: "최종 성과 보고서 제출 및 증빙 정리", completed: false, category: "예창패" },
            { id: "task-6-2", title: "사업비 정산 및 회계 감사 대응", completed: false, category: "예창패" },
            { id: "task-6-3", title: "초기창업패키지 연계 지원 사업 준비", completed: false, category: "공통" },
          ],
        },
      ];
      setRoadmapPhases(INITIAL_ROADMAP);
      setLocalStorage("yechangpack-roadmap", INITIAL_ROADMAP);
    } else {
      setRoadmapPhases(savedRoadmap);
    }

    if (savedChecklist.length === 0) {
      const INITIAL_CHECKLIST: ChecklistItem[] = [
        { id: "ck-1", title: "K-Startup 회원가입 및 본인인증 완료", completed: false, category: "행정", phase: "phase-1" },
        { id: "ck-2", title: "2025년 가이드 기반 PSST 양식 확보", completed: false, category: "서류", phase: "phase-1" },
        { id: "ck-3", title: "창업여부 확인용 사실증명 발급", completed: false, category: "서류", phase: "phase-1" },
        { id: "ck-4", title: "건강보험 자격득실 확인서 준비", completed: false, category: "서류", phase: "phase-1" },
        { id: "ck-5", title: "발표 평가용 PT 초안(15P) 기획", completed: false, category: "평가", phase: "phase-2" },
        { id: "ck-6", title: "사업비 전용 카드 발급 및 시스템 등록", completed: false, category: "행정", phase: "phase-3" },
        { id: "ck-7", title: "외주용역 비교견적서 및 계약서 구비", completed: false, category: "정산", phase: "phase-4" },
        { id: "ck-8", title: "최종 보고용 성과 지표 증빙 수집", completed: false, category: "정산", phase: "phase-6" },
      ];
      setChecklistItems(INITIAL_CHECKLIST);
      setLocalStorage("yechangpack-checklist", INITIAL_CHECKLIST);
    } else {
      setChecklistItems(savedChecklist);
    }

    // 나머지 데이터 설정
    setEvaluationScores(savedScores);
    setNotes(savedNotes);
    setEvidenceDocuments(getDocuments());

    // 문서 목록 (항상 최신 경로 반영)
    const YECHANG_DOCS_PATH = "/inbloom/docs/예창패";
    const actualDocs: YechangpackDocument[] = [
      { id: "yp-doc-1", name: "[참고용] 2025년도 예창패 모집공고문", type: "pdf", size: "1.2MB", path: `${YECHANG_DOCS_PATH}/[공고문] 2025년도 예비창업패키지 예비창업자 모집공고.pdf`, category: "공고" },
      { id: "yp-doc-2", name: "[양식] 2025년도 예창패 사업계획서 (PSST)", type: "docx", size: "450KB", path: `${YECHANG_DOCS_PATH}/[별첨 1] 2025년도 예비창업패키지 사업계획서 양식.docx`, category: "양식" },
      { id: "yp-doc-6", name: "[Q&A] 2025년도 예창패 주요 질의응답", type: "pdf", size: "340KB", path: `${YECHANG_DOCS_PATH}/[별첨 4] 2025년도 예비창업패키지 예비창업자 모집공고 관련 주요 질의응답.pdf`, category: "참고" },
    ];
    setDocuments(actualDocs);
  }, []);

  const updateRoadmapPhases = (newPhases: RoadmapPhase[]) => {
    setRoadmapPhases(newPhases);
    setLocalStorage("yechangpack-roadmap", newPhases);
  };

  const handleTaskToggle = (phaseId: string, taskId: string) => {
    const newPhases = roadmapPhases.map((phase) => {
      if (phase.id === phaseId) {
        return { ...phase, tasks: phase.tasks.map((task) => {
          if (task.id === taskId) {
            const newCompleted = !task.completed;
            addActivityLog({ user: currentUser, type: "task", action: newCompleted ? "과업 완료" : "취소", targetTitle: task.title });
            return { ...task, completed: newCompleted };
          }
          return task;
        })};
      }
      return phase;
    });
    updateRoadmapPhases(newPhases);
  };

  const handleTaskSave = (taskData: Partial<RoadmapTask>, phaseId: string, existingTaskId?: string) => {
    const newPhases = roadmapPhases.map((phase) => {
      if (phase.id === phaseId) {
        let newTasks = [...phase.tasks];
        if (existingTaskId) {
          newTasks = newTasks.map((t) => t.id === existingTaskId ? { ...t, ...taskData } : t);
        } else {
          const newTask: RoadmapTask = { id: `task-${Date.now()}`, completed: false, category: "예창패", title: "", ...taskData } as RoadmapTask;
          newTasks.push(newTask);
        }
        return { ...phase, tasks: newTasks };
      }
      return phase;
    });
    updateRoadmapPhases(newPhases);
    showToast("로드맵이 업데이트되었습니다.", "success");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더: 2026년 도전에 맞춰 텍스트 전면 수정 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md">2026 Yechangpack Strategy</span>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Based on 2025 Guide</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">2026 예비창업패키지 도전 로드맵</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">2025년 공식 지침 분석 기반 | 예상 집행 주기(26.05 ~ 27.01) 및 PSST 전략 관리</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Strategy Synced</span>
            <span className="w-px h-3 bg-slate-200" />
            <span>Preparation Phase</span>
          </div>
        </div>

        {/* 탭 내비게이션 */}
        <nav className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
          {[
            { id: "roadmap", label: "집행 로드맵" },
            { id: "checklist", label: "행정 체크리스트" },
            { id: "evidence", label: "증빙/실적" },
            { id: "documents", label: "문서 보관함" },
            { id: "notes", label: "전략 메모" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* 콘텐츠 */}
        <div className="animate-slide-in">
          {activeTab === "roadmap" && (
            <RoadmapTab
              roadmapPhases={roadmapPhases}
              documents={documents}
              currentUser={currentUser}
              evaluationScores={evaluationScores}
              onUpdateScores={(s: { 문제인식: number; 해결방안: number; 성장전략: number; 팀구성: number; }) => { setEvaluationScores(s); setLocalStorage("yechangpack-scores", s); }}
              onTaskToggle={handleTaskToggle}
              onTaskSave={handleTaskSave}
              onTaskDelete={(pid: string, tid: string) => { updateRoadmapPhases(roadmapPhases.map(p => p.id === pid ? {...p, tasks: p.tasks.filter(t => t.id !== tid)} : p)); }}
              onTaskNoteAdd={() => {}}
              onTaskNoteDelete={() => {}}
              onDownloadDocument={(d: YechangpackDocument) => window.open(encodeURI(d.path), "_blank")}
            />
          )}

          {activeTab === "checklist" && (
            <ChecklistTab 
              checklistItems={checklistItems} 
              roadmapPhases={roadmapPhases} 
              onToggle={(id: string) => { const next = checklistItems.map(i => i.id === id ? {...i, completed: !i.completed} : i); setChecklistItems(next); setLocalStorage("yechangpack-checklist", next); }} 
              onEdit={() => {}} 
              onDelete={(id: string) => { const next = checklistItems.filter(i => i.id !== id); setChecklistItems(next); setLocalStorage("yechangpack-checklist", next); }} 
              onAdd={() => {
                const title = prompt("추가할 항목:");
                if(title) {
                  const next: ChecklistItem[] = [...checklistItems, { id: Date.now().toString(), title, completed: false, category: '일반', phase: 'phase-1' }];
                  setChecklistItems(next);
                  setLocalStorage("yechangpack-checklist", next);
                }
              }} 
            />
          )}

          {activeTab === "evidence" && (
            <EvidenceTab 
              evidenceDocuments={evidenceDocuments} 
              onDelete={(id: string) => { setEvidenceDocuments(prev => prev.filter(d => d.id !== id)); }} 
              onSave={(d, f) => { showToast("증빙자료가 저장되었습니다 (시뮬레이션)", "success"); }} 
              selectedCategory={selectedEvidenceCategory} 
              onCategoryChange={(c: DocumentCategory | "all") => setSelectedEvidenceCategory(c)} 
            />
          )}
          
          {activeTab === "documents" && (
            <DocumentsTab documents={documents} onDownload={(d) => window.open(encodeURI(d.path), "_blank")} />
          )}

          {activeTab === "notes" && (
            <NotesTab notes={notes} onAdd={(n) => { const next = [n, ...notes]; setNotes(next); setLocalStorage("yechangpack-notes", next); }} onUpdate={(id, u) => { const next = notes.map(n => n.id === id ? {...n, ...u} : n); setNotes(next); setLocalStorage("yechangpack-notes", next); }} onDelete={(id) => { const next = notes.filter(n => n.id !== id); setNotes(next); setLocalStorage("yechangpack-notes", next); }} />
          )}
        </div>
      </div>
    </div>
  );
}