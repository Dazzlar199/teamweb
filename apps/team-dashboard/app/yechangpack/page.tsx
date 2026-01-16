"use client";

import { useState, useEffect } from "react";
import { addActivityLog } from "@/lib/utils/activityLog";
import { getDocuments } from "@/lib/utils/document";
import { getLocalStorage, setLocalStorage } from "@/lib/utils/localStorage";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/lib/context/ToastContext";
import { TEAM_MEMBER_NAMES } from "@/lib/constants/team";

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
  const currentUser = user?.name || TEAM_MEMBER_NAMES[0];
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
          title: "Phase 1: 기획 및 신청 (26.01 ~ 26.03)",
          period: "2026.01 ~ 2026.03",
          status: "in_progress",
          description: "뉴콘텐츠아카데미 기획 + 예창패 서류 접수 (PSF 검증)",
          tasks: [
            { 
              id: "task-1-1", title: "PSST 사업계획서 고도화 (차별화 논리)", completed: false, category: "예창패",
              description: "기존 플랫폼(숨고/크몽)의 한계(버티컬 부재, 스타일 매칭 불가) 명확화 및 AI 솔루션 제시",
              details: { 목표: "서류 합격", 체크리스트: ["시장규모 6조원 근거(통계청)", "페인포인트 인터뷰 인용", "가점 증빙"] }
            },
            { id: "task-1-2", title: "고객 심층 인터뷰 20명 (예비부부10+프리랜서10)", completed: false, category: "기획", description: "녹취록 작성 및 핵심 'Pain Point' 인용구 추출 (사업계획서 삽입용)" },
            { id: "task-1-3", title: "UX/UI 와이어프레임 & BI(캐릭터) 확정", completed: false, category: "디자인", description: "아카데미 멘토링 활용, '인스타그래머블'한 감성 디자인 도출" },
            { id: "task-1-4", title: "K-Startup 접수 및 팀 역량 증빙 준비", completed: false, category: "행정", description: "대표자 경력(웨딩업계), 팀원 개발 역량 포트폴리오 정리" },
          ],
        },
        {
          id: "phase-2",
          title: "Phase 2: MVP 개발 및 평가 (26.04 ~ 26.05)",
          period: "2026.04 ~ 2026.05",
          status: "upcoming",
          description: "아카데미 지원금으로 MVP 개발 → 발표평가 시 '실제 구동' 시연",
          tasks: [
            { id: "task-2-1", title: "핵심 기능 MVP 개발 (매칭+결제)", completed: false, category: "개발", description: "아카데미 지원금(2천만원) 활용, 내부 알파 테스트 완료" },
            { id: "task-2-2", title: "발표 평가용 PT 덱(15P) 및 대본 완성", completed: false, category: "평가", description: "7분 발표 시나리오: '우리는 계획만 있는 게 아니라 이미 만들고 있다' 강조" },
            { id: "task-2-3", title: "정량 설문조사 100명+ (시장성 검증)", completed: false, category: "기획", description: "구글폼/타입폼 활용, 솔루션 지불 의향(WTP) 데이터 확보" },
          ],
        },
        {
          id: "phase-3",
          title: "Phase 3: 런칭 및 초기 트랙션 (26.06 ~ 26.08)",
          period: "2026.06 ~ 2026.08",
          status: "upcoming",
          description: "베타 서비스 런칭 + 예창패 협약 + 콜드스타트 해결",
          tasks: [
            { id: "task-3-1", title: "베타 서비스 정식 오픈 (웹/앱)", completed: false, category: "개발", description: "초기 트래픽 모니터링, 버그 수정, 아카데미 전시회 출품" },
            { id: "task-3-2", title: "공급자(프리랜서) 100명 초기 확보", completed: false, category: "영업", description: "CEO 네트워크 및 인스타 DM 영업, '수수료 0원' 얼리버드 혜택 제공" },
            { id: "task-3-3", title: "예창패 협약 체결 및 사업비 카드 발급", completed: false, category: "행정", description: "수정 사업계획서 제출, 1차 사업비 집행 계획 수립" },
          ],
        },
        {
          id: "phase-4",
          title: "Phase 4: 마케팅 및 스케일업 (26.09 ~ 26.10)",
          period: "2026.09 ~ 2026.10",
          status: "upcoming",
          description: "예창패 자금 본격 투입 → 마케팅 가속화 및 수익 모델 검증",
          tasks: [
            { id: "task-4-1", title: "SNS 퍼포먼스 마케팅 (인스타/틱톡)", completed: false, category: "마케팅", description: "숏폼 광고 집행, 목표 CAC 44,000원 이하 검증" },
            { id: "task-4-2", title: "웨딩 크루(패키지) 상품 정식 출시", completed: false, category: "비즈니스", description: "객단가 상승 유도 (평균 150만원+), 크루장 인센티브 제도 도입" },
            { id: "task-4-3", title: "중간 점검 및 지표 분석 (LTV/CAC)", completed: false, category: "분석", description: "초기 지표 분석, 투자용 IR 자료 초안 작성" },
          ],
        },
        {
          id: "phase-5",
          title: "Phase 5: 성과 보고 및 도약 (26.11 ~ 26.12)",
          period: "2026.11 ~ 2026.12",
          status: "upcoming",
          description: "최종 성과 달성 및 후속 투자(TIPS/초창패) 준비",
          tasks: [
            { id: "task-5-1", title: "핵심 KPI 달성 (프리랜서 1,000명 / MAU 1만)", completed: false, category: "지표", description: "예창패 최우수 졸업 목표" },
            { id: "task-5-2", title: "최종 성과보고서 및 정산 증빙 제출", completed: false, category: "행정", description: "회계 감사 대응, 잔액 " },
            { id: "task-5-3", title: "Series A / TIPS 투자 라운딩", completed: false, category: "투자", description: "검증된 Traction 데이터 기반 투자 유치" },
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
        // 기획/검증 (필수)
        { id: "ck-1", title: "심층 인터뷰: 예비부부 10명 + 프리랜서 10명 (녹취 필수)", completed: false, category: "검증", phase: "phase-1" },
        { id: "ck-2", title: "경쟁사 분석표 (숨고/크몽 vs 특별시 기능 비교)", completed: false, category: "기획", phase: "phase-1" },
        { id: "ck-3", title: "정량 설문조사 100명 이상 응답 확보", completed: false, category: "검증", phase: "phase-2" },
        // 개발/구현
        { id: "ck-4", title: "AI 매칭 알고리즘 로직 설계도 (특허 출원용)", completed: false, category: "기술", phase: "phase-1" },
        { id: "ck-5", title: "MVP 프로토타입 시연 영상 촬영 (발표용)", completed: false, category: "개발", phase: "phase-2" },
        // 행정/서류
        { id: "ck-6", title: "K-Startup 회원가입 및 실명인증", completed: false, category: "행정", phase: "phase-1" },
        { id: "ck-7", title: "사실증명(사업자등록사실여부) 발급", completed: false, category: "행정", phase: "phase-1" },
        // 사업화
        { id: "ck-8", title: "초기 프리랜서 50명 입점 의향서(LOI) 확보", completed: false, category: "영업", phase: "phase-2" },
        { id: "ck-9", title: "표준 계약서 및 에스크로 결제 프로세스 확립", completed: false, category: "법무", phase: "phase-3" },
        { id: "ck-10", title: "LTV/CAC 8배 달성 시뮬레이션 엑셀 검증", completed: false, category: "재무", phase: "phase-4" },
      ];
      setChecklistItems(INITIAL_CHECKLIST);
      setLocalStorage("yechangpack-checklist", INITIAL_CHECKLIST);
    } else {
      setChecklistItems(savedChecklist);
    }

    // 전략 노트 초기화 (핵심 논리 탑재)
    if (savedNotes.length === 0) {
      const INITIAL_NOTES: Note[] = [
        {
          id: "note-1",
          title: "📌 [문제인식] 시장의 구조적 문제",
          content: "1. 스드메 중심의 리베이트 구조 (20~30% 수수료 전가)\n2. 서브서비스(축가, 영상 등)의 '끼워팔기' 관행\n3. 정보 비대칭: 블로그/인스타의 광고성 정보 범람\n4. 가격 불투명성 및 '추가금' 스트레스\n\n-> 결론: '투명한 가격'과 '검증된 퀄리티'를 제공하는 버티컬 플랫폼 부재",
          tags: ["PSST", "문제정의", "시장분석"],
          updatedAt: new Date().toISOString()
        },
        {
          id: "note-2",
          title: "💡 [해결방안] 특별시만의 차별점",
          content: "1. AI 감성 매칭: 자연어 처리로 '디즈니 감성', '힙한 느낌' 등 스타일 매칭\n2. 웨딩 크루 시스템: 스냅+영상+축가 등 프리랜서 연합 패키지 (객단가↑)\n3. 3중 검증 시스템: 실명인증 + 포트폴리오 심사 + 에스크로 결제\n4. 콘텐츠 커뮤니티: 숏폼 리뷰 및 트렌드 큐레이션",
          tags: ["PSST", "솔루션", "차별화"],
          updatedAt: new Date().toISOString()
        },
        {
          id: "note-3",
          title: "📈 [성장전략] 수익 모델 및 확장",
          content: "1. BM: 매칭 수수료(최대 5천원) + 구독 모델(프리랜서 등급제)\n2. Unit Economics: LTV(35만원) / CAC(4.4만원) = 8배 달성 목표\n3. Cold Start 해결: 아카데미 기간 중 수수료 0원으로 공급자 100명 선확보\n4. 확장: 웨딩 -> 돌잔치/행사 -> 기업 이벤트 (TAM 15조원)",
          tags: ["PSST", "BM", "Scale-up"],
          updatedAt: new Date().toISOString()
        }
      ];
      setNotes(INITIAL_NOTES);
      setLocalStorage("yechangpack-notes", INITIAL_NOTES);
    } else {
      setNotes(savedNotes);
    }

    // 나머지 데이터 설정
    setEvaluationScores(savedScores);
    setNotes(savedNotes);
    setEvidenceDocuments(getDocuments());

    // 문서 목록 (항상 최신 경로 반영)
    const YECHANG_DOCS_PATH = "/docs/yechangpack";
    const actualDocs: YechangpackDocument[] = [
      { id: "yp-doc-0", name: "26년 예비창업패키지 합격 가이드북 (특별시)", type: "html", size: "2.5MB", path: `/inbloom/docs/html/26년-예창패-합격-가이드북.html`, category: "가이드" },
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
              onClick={() => setActiveTab(tab.id as "roadmap" | "checklist" | "evidence" | "documents" | "notes")}
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