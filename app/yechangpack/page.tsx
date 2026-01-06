"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TEAM_MEMBERS } from "@/lib/constants/team";
import { addActivityLog } from "@/lib/utils/activityLog";
import {
  saveFile,
  getFile,
  deleteFile,
  getImageUrl,
} from "@/lib/utils/storage";
import {
  getDocuments,
  saveDocument,
  deleteDocument,
  getDocumentChecklist,
  getDocumentStats,
} from "@/lib/utils/document";
import { getLocalStorage, setLocalStorage } from "@/lib/utils/localStorage";
import type {
  Document as EvidenceDocument,
  DocumentCategory,
} from "@/lib/types/document";

// 로드맵 단계 인터페이스
interface RoadmapPhase {
  id: string;
  title: string;
  period: string;
  status: "completed" | "in_progress" | "upcoming";
  tasks: RoadmapTask[];
  description: string;
}

interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface TaskNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  attachments?: TaskAttachment[];
}

interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
  category: "아카데미" | "예창패" | "공통";
  description?: string;
  details?: {
    목표?: string;
    방법?: string;
    기간?: string;
    담당자?: string;
    참고자료?: string[];
    체크리스트?: string[];
  };
  notes?: TaskNote[];
}

// 문서 인터페이스
interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "hwp" | "md";
  size: string;
  path: string;
  category: "공고" | "양식" | "가이드" | "참고";
}

// 노트 인터페이스
interface Note {
  id: string;
  title: string;
  content: string;
  category: "일정" | "체크리스트" | "메모" | "아이디어";
  createdAt: string;
  updatedAt: string;
}

// 체크리스트 항목 인터페이스
interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  category: string;
  phase: string;
}

export default function YechangpackPage() {
  const currentUser = "김찬주";
  const [activeTab, setActiveTab] = useState<
    "roadmap" | "documents" | "notes" | "checklist" | "evidence"
  >("roadmap");
  const [roadmapPhases, setRoadmapPhases] = useState<RoadmapPhase[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "메모" as Note["category"],
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [roadmapView, setRoadmapView] = useState<"vertical" | "horizontal">(
    "vertical"
  );
  const [selectedTask, setSelectedTask] = useState<{
    phaseId: string;
    taskId: string;
  } | null>(null);
  const [newTaskNoteContent, setNewTaskNoteContent] = useState("");
  const [taskNoteAttachments, setTaskNoteAttachments] = useState<File[]>([]);
  const taskFileInputRef = useRef<HTMLInputElement>(null);
  const [expandedSchedulePeriod, setExpandedSchedulePeriod] = useState<
    string | null
  >(null);

  // 증빙자료 관련 상태
  const [evidenceDocuments, setEvidenceDocuments] = useState<
    EvidenceDocument[]
  >([]);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [selectedEvidenceCategory, setSelectedEvidenceCategory] = useState<
    DocumentCategory | "all"
  >("all");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [newEvidence, setNewEvidence] = useState({
    name: "",
    category: "corporate" as DocumentCategory,
    type: "",
    required: false,
    description: "",
  });

  // 평가 점수 상태
  const [evaluationScores, setEvaluationScores] = useState({
    문제인식: 0,
    해결방안: 0,
    성장전략: 0,
    팀구성: 0,
  });

  // 체크리스트 편집 상태
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] =
    useState<ChecklistItem | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState({
    title: "",
    category: "서류",
    phase: "phase-1",
    dueDate: "",
  });

  // 로드맵 작업 편집 상태
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    phaseId: string;
    task: RoadmapTask;
  } | null>(null);
  const [selectedPhaseForTask, setSelectedPhaseForTask] =
    useState<string>("phase-1");
  const [newTask, setNewTask] = useState({
    title: "",
    category: "예창패" as RoadmapTask["category"],
    description: "",
  });

  // 로드맵 데이터 초기화
  useEffect(() => {
    let roadmapData = getLocalStorage<RoadmapPhase[]>(
      "yechangpack-roadmap",
      []
    );

    // 25년 12월 사전준비(phase-0)를 1월(phase-1)로 통합하는 마이그레이션
    const phase0Index = roadmapData.findIndex((p) => p.id === "phase-0");
    const phase1Index = roadmapData.findIndex((p) => p.id === "phase-1");

    if (phase0Index !== -1) {
      const phase0 = roadmapData[phase0Index];
      const phase0Tasks = phase0.tasks || [];

      if (phase1Index !== -1) {
        // phase-1이 있으면 phase-0의 작업들을 phase-1 앞에 추가
        roadmapData[phase1Index].tasks = [
          ...phase0Tasks,
          ...roadmapData[phase1Index].tasks,
        ];
        // phase-1 제목 업데이트
        if (!roadmapData[phase1Index].title.includes("사전준비")) {
          roadmapData[phase1Index].title =
            "사전준비 + 기획 + 신청 (26년 1~3월)";
        }
      } else {
        // phase-1이 없으면 phase-0를 phase-1로 변경
        roadmapData[phase0Index] = {
          ...phase0,
          id: "phase-1",
          title: "사전준비 + 기획 + 신청 (26년 1~3월)",
          period: "2026.01 ~ 2026.03",
          status: phase0.status === "completed" ? "in_progress" : phase0.status,
          description: "사전준비 완료 + 예창패 신청 완료 + 아카데미 기획 완료",
        };
      }

      // phase-0 제거
      roadmapData = roadmapData.filter((p) => p.id !== "phase-0");

      // LocalStorage에 저장
      setLocalStorage("yechangpack-roadmap", roadmapData);
    }

    if (roadmapData.length === 0) {
      roadmapData = [
        {
          id: "phase-1",
          title: "사전준비 + 기획 + 신청 (26년 1~3월)",
          period: "2026.01 ~ 2026.03",
          status: "in_progress",
          description: "사전준비 완료 + 예창패 신청 완료 + 아카데미 기획 완료",
          tasks: [
            {
              id: "task-1-0",
              title: "캐릭터/BI 디자인 시작",
              completed: true,
              category: "공통",
              description:
                "브랜드 아이덴티티 구축을 위한 캐릭터 및 BI 디자인 작업을 시작합니다.",
              details: {
                목표: "특별시 브랜드의 시각적 아이덴티티 완성",
                방법: "디자이너 섭외 → 컨셉 기획 → 초안 제작 → 피드백 반영 → 최종 확정",
                기간: "2026.01 (약 4주)",
                담당자: "김찬주, 외부 디자이너",
                참고자료: ["브랜드 가이드라인", "경쟁사 분석 자료"],
                체크리스트: [
                  "디자이너 섭외 완료",
                  "브랜드 컨셉 확정",
                  "캐릭터 초안 3종 제작",
                  "BI 로고 초안 5종 제작",
                  "팀 내부 검토 및 피드백",
                  "최종안 확정 및 파일 정리",
                ],
              },
            },
            {
              id: "task-1-1",
              title: "블로그 개설 (네이버/티스토리)",
              completed: true,
              category: "공통",
            },
            {
              id: "task-1-2",
              title: "인스타그램 계정 세팅",
              completed: true,
              category: "공통",
            },
            {
              id: "task-1-3",
              title: "스냅/영상 작가 10명 컨택",
              completed: true,
              category: "공통",
            },
            {
              id: "task-1-4",
              title: "설문 양식 설계",
              completed: true,
              category: "공통",
            },
            {
              id: "task-1-5",
              title: "뉴콘텐츠아카데미 선발 및 OT",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-1-6",
              title: "UX/UI 와이어프레임 완성",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-1-7",
              title: "예창패 공고 확인 (2월 중순)",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-1-8",
              title: "사업계획서 초안 작성",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-1-9",
              title: "심층인터뷰 35명 진행",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-1-10",
              title: "K-Startup 온라인 접수",
              completed: false,
              category: "예창패",
            },
          ],
        },
        {
          id: "phase-2",
          title: "개발 + 평가 (26년 4~5월)",
          period: "2026.04 ~ 2026.05",
          status: "upcoming",
          description: "MVP 완성 + 발표평가 통과",
          tasks: [
            {
              id: "task-2-1",
              title: "MVP 핵심 기능 완성",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-2-2",
              title: "1차 서류평가 대응",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-2-3",
              title: "7분 발표 스크립트 완성",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-2-4",
              title: "모의 발표 10회 이상",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-2-5",
              title: "정량 설문조사 150명+",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-2-6",
              title: "2차 발표평가 (7분 발표 + 8분 Q&A)",
              completed: false,
              category: "예창패",
            },
          ],
        },
        {
          id: "phase-3",
          title: "런칭 + 사업수행 (26년 6~8월)",
          period: "2026.06 ~ 2026.08",
          status: "upcoming",
          description: "베타 런칭 + 예창패 선정 후 자금 집행",
          tasks: [
            {
              id: "task-3-1",
              title: "최종 선정 발표",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-3-2",
              title: "협약 체결",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-3-3",
              title: "베타 서비스 오픈",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-3-4",
              title: "실제 매칭 50건+ 성사",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-3-5",
              title: "8월 전시회 발표",
              completed: false,
              category: "아카데미",
            },
            {
              id: "task-3-6",
              title: "아카데미 수료",
              completed: false,
              category: "아카데미",
            },
          ],
        },
        {
          id: "phase-4",
          title: "사업 확장 (26년 9~12월)",
          period: "2026.09 ~ 2026.12",
          status: "upcoming",
          description: "예창패 자금으로 사업 확장",
          tasks: [
            {
              id: "task-4-1",
              title: "프리랜서 1,000명 목표 달성",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-4-2",
              title: "BEP 달성 (11월 목표)",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-4-3",
              title: "월 매출 650만원 이상 안정화",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-4-4",
              title: "최종 정산 및 성과 보고서 제출",
              completed: false,
              category: "예창패",
            },
            {
              id: "task-4-5",
              title: "Series A 투자 준비",
              completed: false,
              category: "공통",
            },
          ],
        },
      ];
      setRoadmapPhases(roadmapData);
      setLocalStorage("yechangpack-roadmap", roadmapData);
    } else {
      setRoadmapPhases(roadmapData);
    }
  }, []);

  // 문서 데이터 초기화
  useEffect(() => {
    const docs: Document[] = [
      {
        id: "doc-1",
        name: "[공고문] 2025년도 예비창업패키지 예비창업자 모집공고",
        type: "pdf",
        size: "927KB",
        path: "/docs/yechangpack/[공고문] 2025년도 예비창업패키지 예비창업자 모집공고.pdf",
        category: "공고",
      },
      {
        id: "doc-2",
        name: "[별첨 1] 2025년도 예비창업패키지 사업계획서 양식",
        type: "pdf",
        size: "771KB",
        path: "/docs/yechangpack/[별첨 1] 2025년도 예비창업패키지 사업계획서 양식.pdf",
        category: "양식",
      },
      {
        id: "doc-3",
        name: "[별첨 1] 사업계획서 양식 (DOCX)",
        type: "docx",
        size: "126KB",
        path: "/docs/yechangpack/[별첨 1] 2025년도 예비창업패키지 사업계획서 양식.docx",
        category: "양식",
      },
      {
        id: "doc-4",
        name: "[별첨 2] 증빙서류 제출목록 안내",
        type: "hwp",
        size: "159KB",
        path: "/docs/yechangpack/[별첨 2] 2025년 예비창업패키지 예비창업자 증빙서류 제출목록 안내.hwp",
        category: "양식",
      },
      {
        id: "doc-5",
        name: "[별첨 4] 주요 질의응답",
        type: "pdf",
        size: "1.8MB",
        path: "/docs/yechangpack/[별첨 4] 2025년도 예비창업패키지 예비창업자 모집공고 관련 주요 질의응답.pdf",
        category: "공고",
      },
      {
        id: "doc-6",
        name: "[별첨 5] 온라인 사업신청 매뉴얼",
        type: "pdf",
        size: "1.1MB",
        path: "/docs/yechangpack/[별첨 5] 2025년도 예비창업패키지 예비창업자 온라인 사업신청 매뉴얼.pdf",
        category: "가이드",
      },
      {
        id: "doc-7",
        name: "[별첨 6] K-Startup 회원가입 매뉴얼",
        type: "pdf",
        size: "2.2MB",
        path: "/docs/yechangpack/[별첨 6] K-Startup 회원가입 및 정보등록 매뉴얼 1.pdf",
        category: "가이드",
      },
      {
        id: "doc-8",
        name: "예창패 상세분석 보고서",
        type: "md",
        size: "약 50KB",
        path: "/docs/yechangpack/예창패_상세분석_보고서.md",
        category: "가이드",
      },
      {
        id: "doc-9",
        name: "스타트업 투자유치 마스터링",
        type: "pdf",
        size: "5.7MB",
        path: "/docs/yechangpack/스타트업 투자유치 마스터링.pdf",
        category: "참고",
      },
      {
        id: "doc-10",
        name: "콘텐츠 스타트업 지원사업 운영 성과 분석 강의 자료",
        type: "pdf",
        size: "19MB",
        path: "/docs/yechangpack/콘텐츠 스타트업 지원사업 운영 성과 분석 강의 자료_김진환_251216.pdf",
        category: "참고",
      },
    ];
    setDocuments(docs);
  }, []);

  // 평가 점수 로드
  useEffect(() => {
    const savedScores = localStorage.getItem("yechangpack-evaluation-scores");
    if (savedScores) {
      try {
        setEvaluationScores(JSON.parse(savedScores));
      } catch (e) {
        console.error("평가 점수 로드 실패:", e);
      }
    }
  }, []);

  // 평가 점수 저장
  const saveEvaluationScores = (scores: typeof evaluationScores) => {
    setEvaluationScores(scores);
    localStorage.setItem(
      "yechangpack-evaluation-scores",
      JSON.stringify(scores)
    );
  };

  // 로컬 스토리지에서 노트 로드
  useEffect(() => {
    const savedNotes = getLocalStorage<Note[]>("yechangpack-notes", []);
    setNotes(savedNotes);
  }, []);

  // 로컬 스토리지에서 체크리스트 로드
  useEffect(() => {
    const loadedChecklist = getLocalStorage<ChecklistItem[]>(
      "yechangpack-checklist",
      []
    );

    if (loadedChecklist.length > 0) {
      // 기존 체크리스트에 phase-3, phase-4 항목이 있는지 확인
      const hasPhase3 = loadedChecklist.some(
        (item) => item.phase === "phase-3"
      );
      const hasPhase4 = loadedChecklist.some(
        (item) => item.phase === "phase-4"
      );

      // phase-3, phase-4 항목이 없으면 추가
      if (!hasPhase3 || !hasPhase4) {
        const newItems: ChecklistItem[] = [];

        if (!hasPhase3) {
          // phase-3 (6~8월) 체크리스트 추가
          newItems.push(
            {
              id: "check-9",
              title: "최종 선정 발표 확인",
              completed: false,
              category: "예창패",
              phase: "phase-3",
            },
            {
              id: "check-10",
              title: "협약 체결 완료",
              completed: false,
              category: "예창패",
              phase: "phase-3",
            },
            {
              id: "check-11",
              title: "베타 서비스 오픈",
              completed: false,
              category: "제품",
              phase: "phase-3",
            },
            {
              id: "check-12",
              title: "실제 매칭 50건+ 성사",
              completed: false,
              category: "사업",
              phase: "phase-3",
            },
            {
              id: "check-13",
              title: "8월 전시회 발표 준비",
              completed: false,
              category: "마케팅",
              phase: "phase-3",
            },
            {
              id: "check-14",
              title: "아카데미 수료 완료",
              completed: false,
              category: "교육",
              phase: "phase-3",
            }
          );
        }

        if (!hasPhase4) {
          // phase-4 (9~12월) 체크리스트 추가
          newItems.push(
            {
              id: "check-15",
              title: "프리랜서 1,000명 목표 달성",
              completed: false,
              category: "사업",
              phase: "phase-4",
            },
            {
              id: "check-16",
              title: "BEP 달성 (11월 목표)",
              completed: false,
              category: "재무",
              phase: "phase-4",
            },
            {
              id: "check-17",
              title: "월 매출 650만원 이상 안정화",
              completed: false,
              category: "재무",
              phase: "phase-4",
            },
            {
              id: "check-18",
              title: "최종 정산 및 성과 보고서 제출",
              completed: false,
              category: "서류",
              phase: "phase-4",
            },
            {
              id: "check-19",
              title: "Series A 투자 준비",
              completed: false,
              category: "투자",
              phase: "phase-4",
            }
          );
        }

        const updatedChecklist = [...loadedChecklist, ...newItems];
        setChecklistItems(updatedChecklist);
        setLocalStorage("yechangpack-checklist", updatedChecklist);
      } else {
        setChecklistItems(loadedChecklist);
      }
    } else {
      // 초기 체크리스트 생성
      const initialChecklist: ChecklistItem[] = [
        {
          id: "check-1",
          title: "사업계획서 최종 완성",
          completed: false,
          category: "서류",
          phase: "phase-1",
        },
        {
          id: "check-2",
          title: "K-Startup 온라인 접수",
          completed: false,
          category: "서류",
          phase: "phase-1",
        },
        {
          id: "check-3",
          title: "발표 피칭덱 초안 준비",
          completed: false,
          category: "발표",
          phase: "phase-2",
        },
        {
          id: "check-4",
          title: "예상 질문 30개 준비",
          completed: false,
          category: "발표",
          phase: "phase-2",
        },
        {
          id: "check-5",
          title: "7분 발표 스크립트 완성",
          completed: false,
          category: "발표",
          phase: "phase-2",
        },
        {
          id: "check-6",
          title: "모의 발표 10회 이상",
          completed: false,
          category: "발표",
          phase: "phase-2",
        },
        {
          id: "check-7",
          title: "MVP 시연 준비",
          completed: false,
          category: "제품",
          phase: "phase-2",
        },
        {
          id: "check-8",
          title: "증빙서류 모두 준비",
          completed: false,
          category: "서류",
          phase: "phase-1",
        },
        // phase-3 (6~8월) 체크리스트
        {
          id: "check-9",
          title: "최종 선정 발표 확인",
          completed: false,
          category: "예창패",
          phase: "phase-3",
        },
        {
          id: "check-10",
          title: "협약 체결 완료",
          completed: false,
          category: "예창패",
          phase: "phase-3",
        },
        {
          id: "check-11",
          title: "베타 서비스 오픈",
          completed: false,
          category: "제품",
          phase: "phase-3",
        },
        {
          id: "check-12",
          title: "실제 매칭 50건+ 성사",
          completed: false,
          category: "사업",
          phase: "phase-3",
        },
        {
          id: "check-13",
          title: "8월 전시회 발표 준비",
          completed: false,
          category: "마케팅",
          phase: "phase-3",
        },
        {
          id: "check-14",
          title: "아카데미 수료 완료",
          completed: false,
          category: "교육",
          phase: "phase-3",
        },
        // phase-4 (9~12월) 체크리스트
        {
          id: "check-15",
          title: "프리랜서 1,000명 목표 달성",
          completed: false,
          category: "사업",
          phase: "phase-4",
        },
        {
          id: "check-16",
          title: "BEP 달성 (11월 목표)",
          completed: false,
          category: "재무",
          phase: "phase-4",
        },
        {
          id: "check-17",
          title: "월 매출 650만원 이상 안정화",
          completed: false,
          category: "재무",
          phase: "phase-4",
        },
        {
          id: "check-18",
          title: "최종 정산 및 성과 보고서 제출",
          completed: false,
          category: "서류",
          phase: "phase-4",
        },
        {
          id: "check-19",
          title: "Series A 투자 준비",
          completed: false,
          category: "투자",
          phase: "phase-4",
        },
      ];
      setChecklistItems(initialChecklist);
      setLocalStorage("yechangpack-checklist", initialChecklist);
    }
  }, []);

  // 증빙자료 로드
  useEffect(() => {
    loadEvidenceDocuments();
  }, []);

  const loadEvidenceDocuments = () => {
    try {
      const loaded = getDocuments();
      setEvidenceDocuments(loaded);
    } catch (error) {
      console.error("증빙자료 로드 실패:", error);
    }
  };

  const handleAddEvidence = async () => {
    if (!newEvidence.name || !newEvidence.type) {
      alert("이름과 타입을 입력해주세요.");
      return;
    }

    try {
      const document: EvidenceDocument = {
        id: `evidence-${Date.now()}`,
        name: newEvidence.name,
        category: newEvidence.category,
        type: newEvidence.type,
        fileUrl: "",
        fileSize: 0,
        fileType: "",
        required: newEvidence.required,
        status: "pending",
        uploadedBy: currentUser,
        uploadedAt: Date.now(),
        tags: [],
        description: newEvidence.description,
      };

      await saveDocument(document, evidenceFile || undefined);
      loadEvidenceDocuments();
      setShowAddEvidence(false);
      setNewEvidence({
        name: "",
        category: "corporate",
        type: "",
        required: false,
        description: "",
      });
      setEvidenceFile(null);
    } catch (error) {
      console.error("증빙자료 추가 실패:", error);
      alert("증빙자료 추가에 실패했습니다.");
    }
  };

  const handleDeleteEvidence = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteDocument(id);
      loadEvidenceDocuments();
    } catch (error) {
      console.error("증빙자료 삭제 실패:", error);
      alert("증빙자료 삭제에 실패했습니다.");
    }
  };

  // 노트 저장
  const saveNotes = useCallback((updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    setLocalStorage("yechangpack-notes", updatedNotes);
  }, []);

  // 체크리스트 저장
  const saveChecklist = useCallback((updatedChecklist: ChecklistItem[]) => {
    setChecklistItems(updatedChecklist);
    setLocalStorage("yechangpack-checklist", updatedChecklist);
  }, []);

  // 노트 추가
  const handleAddNote = () => {
    if (!newNote.title.trim()) return;

    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      category: newNote.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [note, ...notes];
    saveNotes(updatedNotes);
    addActivityLog({
      type: "note",
      action: "created",
      item: note.title,
      user: currentUser,
    });

    setNewNote({ title: "", content: "", category: "메모" });
    setShowAddNote(false);
  };

  // 노트 삭제
  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    saveNotes(updatedNotes);
    addActivityLog({
      type: "note",
      action: "deleted",
      item: notes.find((n) => n.id === id)?.title || "",
      user: currentUser,
    });
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  // 노트 업데이트
  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map((note) =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );
    saveNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote(updatedNotes.find((n) => n.id === id) || null);
    }
  };

  // 체크리스트 토글
  const handleToggleChecklist = useCallback(
    (id: string) => {
      const updatedChecklist = checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      const toggledItem = updatedChecklist.find((i) => i.id === id);
      saveChecklist(updatedChecklist);
      if (toggledItem) {
        addActivityLog({
          type: "checklist",
          action: toggledItem.completed ? "completed" : "uncompleted",
          item: toggledItem.title,
          user: currentUser,
        });
      }
    },
    [checklistItems, saveChecklist, currentUser]
  );

  // 체크리스트 추가
  const handleAddChecklistItem = (
    title: string,
    category: string,
    phase: string
  ) => {
    const item: ChecklistItem = {
      id: `check-${Date.now()}`,
      title,
      completed: false,
      category,
      phase,
    };
    const updatedChecklist = [item, ...checklistItems];
    saveChecklist(updatedChecklist);
    addActivityLog({
      type: "checklist",
      action: "created",
      item: title,
      user: currentUser,
    });
  };

  // 체크리스트 저장 (추가/수정)
  const handleSaveChecklistItem = () => {
    if (!newChecklistItem.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (editingChecklistItem) {
      // 수정
      const updatedChecklist = checklistItems.map((item) =>
        item.id === editingChecklistItem.id
          ? {
              ...item,
              title: newChecklistItem.title,
              category: newChecklistItem.category,
              phase: newChecklistItem.phase,
              dueDate: newChecklistItem.dueDate || undefined,
            }
          : item
      );
      saveChecklist(updatedChecklist);
      addActivityLog({
        type: "checklist",
        action: "updated",
        item: newChecklistItem.title,
        user: currentUser,
      });
      setEditingChecklistItem(null);
    } else {
      // 추가
      const item: ChecklistItem = {
        id: `check-${Date.now()}`,
        title: newChecklistItem.title,
        completed: false,
        category: newChecklistItem.category,
        phase: newChecklistItem.phase,
        dueDate: newChecklistItem.dueDate || undefined,
      };
      const updatedChecklist = [item, ...checklistItems];
      saveChecklist(updatedChecklist);
      addActivityLog({
        type: "checklist",
        action: "created",
        item: newChecklistItem.title,
        user: currentUser,
      });
    }

    setNewChecklistItem({
      title: "",
      category: "서류",
      phase: "phase-1",
      dueDate: "",
    });
    setShowAddChecklist(false);
  };

  // 체크리스트 삭제
  const handleDeleteChecklistItem = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const item = checklistItems.find((i) => i.id === id);
    const updatedChecklist = checklistItems.filter((item) => item.id !== id);
    saveChecklist(updatedChecklist);

    if (item) {
      addActivityLog({
        type: "checklist",
        action: "deleted",
        item: item.title,
        user: currentUser,
      });
    }
  };

  // 체크리스트 편집 시작
  const handleEditChecklistItem = (item: ChecklistItem) => {
    setEditingChecklistItem(item);
    setNewChecklistItem({
      title: item.title,
      category: item.category,
      phase: item.phase,
      dueDate: item.dueDate || "",
    });
    setShowAddChecklist(true);
  };

  // 로드맵 작업 저장 (추가/수정)
  const handleSaveTask = () => {
    if (!newTask.title.trim()) {
      alert("작업 제목을 입력해주세요.");
      return;
    }

    const updatedPhases = roadmapPhases.map((phase) => {
      if (editingTask && phase.id === editingTask.phaseId) {
        // 수정
        return {
          ...phase,
          tasks: phase.tasks.map((task) =>
            task.id === editingTask.task.id
              ? {
                  ...task,
                  title: newTask.title,
                  category: newTask.category,
                  description: newTask.description,
                }
              : task
          ),
        };
      } else if (!editingTask && phase.id === selectedPhaseForTask) {
        // 추가
        const newTaskItem: RoadmapTask = {
          id: `task-${Date.now()}`,
          title: newTask.title,
          completed: false,
          category: newTask.category,
          description: newTask.description,
        };
        return {
          ...phase,
          tasks: [...phase.tasks, newTaskItem],
        };
      }
      return phase;
    });

    setRoadmapPhases(updatedPhases);
    setLocalStorage("yechangpack-roadmap", updatedPhases);

    addActivityLog({
      type: "task",
      action: editingTask ? "updated" : "created",
      item: newTask.title,
      user: currentUser,
    });

    setNewTask({ title: "", category: "예창패", description: "" });
    setShowAddTask(false);
    setEditingTask(null);
    setSelectedPhaseForTask("phase-1");
  };

  // 로드맵 작업 삭제
  const handleDeleteTask = (phaseId: string, taskId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const phase = roadmapPhases.find((p) => p.id === phaseId);
    const task = phase?.tasks.find((t) => t.id === taskId);

    const updatedPhases = roadmapPhases.map((phase) =>
      phase.id === phaseId
        ? {
            ...phase,
            tasks: phase.tasks.filter((task) => task.id !== taskId),
          }
        : phase
    );

    setRoadmapPhases(updatedPhases);
    setLocalStorage("yechangpack-roadmap", updatedPhases);

    if (task) {
      addActivityLog({
        type: "task",
        action: "deleted",
        item: task.title,
        user: currentUser,
      });
    }

    if (selectedTask?.phaseId === phaseId && selectedTask?.taskId === taskId) {
      setSelectedTask(null);
    }
  };

  // 로드맵 작업 편집 시작
  const handleEditTask = (phaseId: string, task: RoadmapTask) => {
    setEditingTask({ phaseId, task });
    setNewTask({
      title: task.title,
      category: task.category,
      description: task.description || "",
    });
    setSelectedPhaseForTask(phaseId);
    setShowAddTask(true);
  };

  // 문서 다운로드
  const handleDownloadDocument = (doc: Document) => {
    try {
      // URL 인코딩하여 특수문자 처리
      const encodedPath = encodeURI(doc.path);
      const link = document.createElement("a");
      link.href = encodedPath;
      link.download = doc.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addActivityLog({
        type: "document",
        action: "downloaded",
        item: doc.name,
        user: currentUser,
      });
    } catch (error) {
      console.error("문서 다운로드 실패:", error);
      // 새 창에서 열기 시도
      window.open(encodeURI(doc.path), "_blank");
    }
  };

  // 로드맵 태스크 토글
  const handleToggleRoadmapTask = useCallback(
    (phaseId: string, taskId: string) => {
      setRoadmapPhases((prevPhases) => {
        const updatedPhases = prevPhases.map((phase) => {
          if (phase.id === phaseId) {
            const updatedTasks = phase.tasks.map((task) =>
              task.id === taskId
                ? { ...task, completed: !task.completed }
                : task
            );
            return { ...phase, tasks: updatedTasks };
          }
          return phase;
        });
        setLocalStorage("yechangpack-roadmap", updatedPhases);
        return updatedPhases;
      });
    },
    []
  );

  // 파일 업로드 처리
  const handleFileUpload = async (files: File[]): Promise<TaskAttachment[]> => {
    const attachments: TaskAttachment[] = [];

    for (const file of files) {
      const fileId = `file-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.includes("html")
        ? "html"
        : "file";

      let url: string | undefined;

      if (fileType === "image") {
        url = URL.createObjectURL(file);
      } else {
        // 파일을 IndexedDB에 저장
        await saveFile(
          {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedBy: currentUser,
            date: new Date().toISOString(),
            isImage: false,
          },
          file
        );
        url = fileId; // ID를 URL로 사용
      }

      attachments.push({
        id: fileId,
        name: file.name,
        type: fileType,
        size: file.size,
        url,
        uploadedBy: currentUser,
        uploadedAt: new Date().toISOString(),
      });
    }

    return attachments;
  };

  // 태스크 노트 추가
  const handleAddTaskNote = async () => {
    if (!newTaskNoteContent.trim() && taskNoteAttachments.length === 0) {
      alert("내용 또는 파일을 입력해주세요.");
      return;
    }

    if (!selectedTask) return;

    const phase = roadmapPhases.find((p) => p.id === selectedTask.phaseId);
    const task = phase?.tasks.find((t) => t.id === selectedTask.taskId);
    if (!task) return;

    const attachments =
      taskNoteAttachments.length > 0
        ? await handleFileUpload(taskNoteAttachments)
        : [];

    const newNote: TaskNote = {
      id: `note-${Date.now()}`,
      content: newTaskNoteContent,
      author: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const updatedPhases = roadmapPhases.map((phase) => {
      if (phase.id === selectedTask.phaseId) {
        const updatedTasks = phase.tasks.map((task) => {
          if (task.id === selectedTask.taskId) {
            return {
              ...task,
              notes: [...(task.notes || []), newNote],
            };
          }
          return task;
        });
        return { ...phase, tasks: updatedTasks };
      }
      return phase;
    });

    setRoadmapPhases(updatedPhases);
    setLocalStorage("yechangpack-roadmap", updatedPhases);

    setNewTaskNoteContent("");
    setTaskNoteAttachments([]);
    if (taskFileInputRef.current) {
      taskFileInputRef.current.value = "";
    }

    addActivityLog({
      type: "note",
      action: "created",
      item: `태스크: ${task.title}`,
      user: currentUser,
    });
  };

  // 태스크 노트 삭제
  const handleDeleteTaskNote = (noteId: string) => {
    if (!selectedTask) return;

    const updatedPhases = roadmapPhases.map((phase) => {
      if (phase.id === selectedTask.phaseId) {
        const updatedTasks = phase.tasks.map((task) => {
          if (task.id === selectedTask.taskId) {
            return {
              ...task,
              notes: task.notes?.filter((note) => note.id !== noteId) || [],
            };
          }
          return task;
        });
        return { ...phase, tasks: updatedTasks };
      }
      return phase;
    });

    setRoadmapPhases(updatedPhases);
    setLocalStorage("yechangpack-roadmap", updatedPhases);
  };

  // 첨부파일 삭제
  const handleDeleteAttachment = async (
    noteId: string,
    attachmentId: string
  ) => {
    if (!selectedTask) return;

    const updatedPhases = roadmapPhases.map((phase) => {
      if (phase.id === selectedTask.phaseId) {
        const updatedTasks = phase.tasks.map((task) => {
          if (task.id === selectedTask.taskId) {
            const updatedNotes = task.notes?.map((note) => {
              if (note.id === noteId) {
                const updatedAttachments = note.attachments?.filter(
                  (att) => att.id !== attachmentId
                );
                // IndexedDB에서 파일 삭제
                deleteFile(attachmentId);
                return {
                  ...note,
                  attachments:
                    updatedAttachments && updatedAttachments.length > 0
                      ? updatedAttachments
                      : undefined,
                };
              }
              return note;
            });
            return { ...task, notes: updatedNotes };
          }
          return task;
        });
        return { ...phase, tasks: updatedTasks };
      }
      return phase;
    });

    setRoadmapPhases(updatedPhases);
    setLocalStorage("yechangpack-roadmap", updatedPhases);
  };

  // 진행률 계산
  const calculateProgress = (phase: RoadmapPhase) => {
    if (phase.tasks.length === 0) return 0;
    const completed = phase.tasks.filter((t) => t.completed).length;
    return Math.round((completed / phase.tasks.length) * 100);
  };

  const overallProgress =
    roadmapPhases.reduce((acc, phase) => {
      const phaseProgress = calculateProgress(phase);
      return acc + phaseProgress;
    }, 0) / roadmapPhases.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#111827]">
          2026 예비창업패키지
        </h1>
        <p className="text-xs text-[#6B7280]">
          예비창업패키지는 창업 전 단계의 예비창업자를 대상으로 창업 역량 강화
          및 사업화 자금을 지원하는 정부 사업입니다. 최대 1억원의 자금을
          지원받을 수 있으며, 뉴콘텐츠아카데미와 병행하여 총 1.2억원의 지원을
          받을 수 있습니다.
        </p>
      </div>

      {/* 전체 진행률 */}
      <div className="mb-6 bg-white rounded-lg border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#111827]">
            전체 진행률
          </span>
          <span className="text-sm font-semibold text-[#111827]">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="mb-6 flex gap-2 border-b border-[#E5E7EB]">
        {[
          { id: "roadmap", label: "로드맵" },
          { id: "documents", label: "문서" },
          { id: "notes", label: "기록" },
          { id: "checklist", label: "체크리스트" },
          { id: "evidence", label: "증빙자료" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#3B82F6] text-[#3B82F6]"
                : "border-transparent text-[#4a5568] hover:text-[#111827]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로드맵 탭 */}
      {activeTab === "roadmap" && (
        <div className="space-y-4">
          {/* 뷰 전환 버튼 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">로드맵</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingTask(null);
                  setNewTask({
                    title: "",
                    category: "예창패",
                    description: "",
                  });
                  setSelectedPhaseForTask("phase-1");
                  setShowAddTask(true);
                }}
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

          {/* 예창패 소개 카드 - 개선된 버전 */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15m-15 0v18m15-18v18M9 6.75h6m-6 3h6m-2.25-4.5V21m-9-1.5h13.5"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#111827]">
                예비창업패키지란?
              </h2>
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
                  const phase = roadmapPhases.find(
                    (p) => p.id === item.phaseId
                  );
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
                          setExpandedSchedulePeriod(
                            isExpanded ? null : item.period
                          )
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
                            {phase?.description ||
                              `사업수행 기간: ${item.period}`}
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
                                    width: `${
                                      (completedTasks / totalTasks) * 100
                                    }%`,
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
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
              <div className="flex items-center gap-2 mb-4">
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
                <div className="ml-auto text-sm text-[#6B7280]">
                  총점:{" "}
                  {Object.values(evaluationScores).reduce((a, b) => a + b, 0)}점
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      className={`bg-white rounded-lg border-2 p-4 ${
                        isDanger ? "border-[#EF4444]" : "border-[#E5E7EB]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-[#6B7280]"
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
                          <span className="font-semibold text-sm text-[#111827]">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#6B7280]">
                          /25점
                        </span>
                      </div>

                      {/* 점수 입력 */}
                      <div className="mb-3">
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
                            saveEvaluationScores({
                              ...evaluationScores,
                              [item.key]: newScore,
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded text-sm text-center font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                          placeholder="0"
                        />
                      </div>

                      {/* 진행률 바 */}
                      <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                        <div
                          className={`${
                            item.color
                          } h-2 rounded-full transition-all duration-500 ${
                            isDanger ? "animate-pulse" : ""
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`${
                            isDanger
                              ? "text-[#EF4444] font-bold"
                              : "text-[#6B7280]"
                          }`}
                        >
                          {score}점 ({percentage.toFixed(0)}%)
                        </span>
                        {isDanger && (
                          <span className="text-[#EF4444] font-bold flex items-center gap-1">
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
                4개 항목 중 어느 하나라도 60% 미만(15점 미만)이면 무조건
                탈락합니다.
              </span>
            </div>
          </div>

          {/* 가로 타임라인 뷰 */}
          {roadmapView === "horizontal" ? (
            <div className="relative">
              {/* 타임라인 선 */}
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#E5E7EB] transform -translate-y-1/2 z-0" />

              {/* 단계 카드들 */}
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {roadmapPhases.map((phase, index) => {
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
                            <span className="text-xs text-[#6B7280]">
                              진행률
                            </span>
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
                                      handleToggleRoadmapTask(
                                        phase.id,
                                        task.id
                                      );
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
                                        handleEditTask(phase.id, task);
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
                                        handleDeleteTask(phase.id, task.id);
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
                                    handleToggleRoadmapTask(phase.id, task.id);
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
                                      handleEditTask(phase.id, task);
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
                                      handleDeleteTask(phase.id, task.id);
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
        </div>
      )}

      {/* 문서 탭 */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">
              문서 다운로드
            </h2>
            <div className="text-sm text-[#6B7280]">
              총 {documents.length}개 문서
            </div>
          </div>

          {/* 카테고리별 그룹 */}
          {["공고", "양식", "가이드", "참고"].map((category) => {
            const categoryDocs = documents.filter(
              (doc) => doc.category === category
            );
            if (categoryDocs.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-lg border border-[#E5E7EB] p-4 hover:border-[#3B82F6] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {doc.type === "pdf" && (
                              <svg
                                className="w-5 h-5 text-[#DC2626] flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                            )}
                            {doc.type === "docx" && (
                              <svg
                                className="w-5 h-5 text-[#2B579A] flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                            )}
                            {doc.type === "hwp" && (
                              <svg
                                className="w-5 h-5 text-blue-500 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                            )}
                            {doc.type === "md" && (
                              <svg
                                className="w-5 h-5 text-[#6B7280] flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                            )}
                            <span className="text-sm font-medium text-[#111827] truncate">
                              {doc.name}
                            </span>
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {doc.size}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="ml-3 px-3 py-1.5 bg-[#3B82F6] text-white text-xs font-medium rounded hover:bg-[#2563EB] transition-colors flex-shrink-0"
                        >
                          다운로드
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 기록 탭 */}
      {activeTab === "notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 노트 목록 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111827]">기록</h2>
              <button
                onClick={() => setShowAddNote(true)}
                className="px-3 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
              >
                + 새 기록
              </button>
            </div>

            {/* 새 기록 폼 */}
            {showAddNote && (
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="제목"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <select
                  value={newNote.category}
                  onChange={(e) =>
                    setNewNote({
                      ...newNote,
                      category: e.target.value as Note["category"],
                    })
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                >
                  <option value="메모">메모</option>
                  <option value="일정">일정</option>
                  <option value="체크리스트">체크리스트</option>
                  <option value="아이디어">아이디어</option>
                </select>
                <textarea
                  placeholder="내용"
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    className="flex-1 px-3 py-1.5 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setShowAddNote(false);
                      setNewNote({ title: "", content: "", category: "메모" });
                    }}
                    className="px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] text-sm font-medium rounded hover:bg-[#E5E7EB] transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 노트 목록 */}
            <div className="space-y-2">
              {notes.map((note) => {
                const categoryColors = {
                  일정: "bg-[#3B82F6]",
                  체크리스트: "bg-[#10B981]",
                  메모: "bg-[#6B7280]",
                  아이디어: "bg-[#F59E0B]",
                };

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-3 bg-white rounded-lg border cursor-pointer transition-colors ${
                      selectedNote?.id === note.id
                        ? "border-blue-600"
                        : "border-[#E5E7EB] hover:border-[#D1D5DB]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            categoryColors[note.category]
                          }`}
                        />
                        <span className="text-sm font-medium text-[#111827] truncate">
                          {note.title}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors flex-shrink-0 ml-2"
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
                    <div className="text-xs text-[#6B7280] mt-1">
                      {new Date(note.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                );
              })}
              {notes.length === 0 && (
                <div className="text-center py-8 text-sm text-[#9CA3AF] bg-white rounded-lg border border-[#E5E7EB]">
                  기록이 없습니다. 새 기록을 추가해보세요.
                </div>
              )}
            </div>
          </div>

          {/* 노트 상세 */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                <div className="mb-4">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) =>
                      handleUpdateNote(selectedNote.id, {
                        title: e.target.value,
                      })
                    }
                    className="w-full text-lg font-semibold text-[#111827] border-none focus:outline-none focus:ring-0 pb-2 border-b border-[#E5E7EB] mb-3"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={selectedNote.category}
                      onChange={(e) =>
                        handleUpdateNote(selectedNote.id, {
                          category: e.target.value as Note["category"],
                        })
                      }
                      className="px-2 py-1 text-xs border border-[#D1D5DB] rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                    >
                      <option value="메모">메모</option>
                      <option value="일정">일정</option>
                      <option value="체크리스트">체크리스트</option>
                      <option value="아이디어">아이디어</option>
                    </select>
                    <span className="text-xs text-[#6B7280]">
                      {new Date(selectedNote.updatedAt).toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>
                <textarea
                  value={selectedNote.content}
                  onChange={(e) =>
                    handleUpdateNote(selectedNote.id, {
                      content: e.target.value,
                    })
                  }
                  rows={20}
                  className="w-full px-4 py-3 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="내용을 입력하세요..."
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-12 text-center">
                <svg
                  className="w-16 h-16 text-[#D1D5DB] mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm text-[#6B7280]">
                  기록을 선택하거나 새 기록을 추가하세요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 체크리스트 탭 */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">체크리스트</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-[#6B7280]">
                완료: {checklistItems.filter((i) => i.completed).length} /{" "}
                {checklistItems.length}
              </div>
              <button
                onClick={() => {
                  setEditingChecklistItem(null);
                  setNewChecklistItem({
                    title: "",
                    category: "서류",
                    phase: "phase-1",
                    dueDate: "",
                  });
                  setShowAddChecklist(true);
                }}
                className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
              >
                + 체크리스트 추가
              </button>
            </div>
          </div>

          {/* 단계별 체크리스트 */}
          {roadmapPhases.map((phase) => {
            const phaseItems = checklistItems.filter(
              (item) => item.phase === phase.id
            );
            if (phaseItems.length === 0) return null;

            const completedCount = phaseItems.filter((i) => i.completed).length;
            const progress =
              phaseItems.length > 0
                ? (completedCount / phaseItems.length) * 100
                : 0;

            return (
              <div
                key={phase.id}
                className="bg-white rounded-lg border border-[#E5E7EB] p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#111827]">
                      {phase.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {phase.period}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-[#111827]">
                      {Math.round(progress)}%
                    </div>
                    <div className="w-32 bg-[#E5E7EB] rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {phaseItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="w-4 h-4 text-[#3B82F6] rounded border-[#D1D5DB] focus:ring-[#3B82F6]"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.completed
                            ? "text-[#9CA3AF] line-through"
                            : "text-[#111827]"
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.dueDate && (
                        <span className="text-xs text-[#6B7280]">
                          {new Date(item.dueDate).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChecklistItem(item);
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
                            handleDeleteChecklistItem(item.id);
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
                  ))}
                </div>
              </div>
            );
          })}

          {/* 전체 체크리스트 (단계 없음) */}
          {checklistItems.filter(
            (item) =>
              !item.phase || !roadmapPhases.find((p) => p.id === item.phase)
          ).length > 0 && (
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <h3 className="font-semibold text-[#111827] mb-3">기타</h3>
              <div className="space-y-2">
                {checklistItems
                  .filter(
                    (item) =>
                      !item.phase ||
                      !roadmapPhases.find((p) => p.id === item.phase)
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 hover:bg-[#F9FAFB] rounded transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="w-4 h-4 text-[#3B82F6] rounded border-[#D1D5DB] focus:ring-[#3B82F6]"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.completed
                            ? "text-[#9CA3AF] line-through"
                            : "text-[#111827]"
                        }`}
                      >
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChecklistItem(item);
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
                            handleDeleteChecklistItem(item.id);
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
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 증빙자료 탭 */}
      {activeTab === "evidence" && (
        <div className="space-y-6">
          {/* 증빙자료 관리 */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  증빙자료 관리
                </h2>
                <p className="text-sm text-[#6B7280]">
                  예창패 지원에 필요한 증빙자료를 업로드하고 관리하세요
                </p>
              </div>
              <button
                onClick={() => setShowAddEvidence(true)}
                className="px-4 py-2 bg-[#3B82F6]"
              >
                + 증빙자료 추가
              </button>
            </div>

            {/* 통계 */}
            {(() => {
              const stats = getDocumentStats();
              const checklist = getDocumentChecklist();
              const requiredCount = checklist.reduce(
                (sum, cat) => sum + cat.items.filter((i) => i.required).length,
                0
              );
              const uploadedCount = checklist.reduce(
                (sum, cat) =>
                  sum + cat.items.filter((i) => i.status === "uploaded").length,
                0
              );

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                    <div className="text-xs font-medium text-[#6B7280] mb-1">
                      전체 증빙자료
                    </div>
                    <div className="text-2xl font-bold text-[#111827]">
                      {stats.total}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                    <div className="text-xs font-medium text-[#6B7280] mb-1">
                      필수 항목
                    </div>
                    <div className="text-2xl font-bold text-[#111827]">
                      {requiredCount}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                    <div className="text-xs font-medium text-[#6B7280] mb-1">
                      업로드 완료
                    </div>
                    <div className="text-2xl font-bold text-[#10B981]">
                      {uploadedCount}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
                    <div className="text-xs font-medium text-[#6B7280] mb-1">
                      진행률
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {requiredCount > 0
                        ? Math.round((uploadedCount / requiredCount) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 필터 */}
            <div className="mb-4">
              <select
                value={selectedEvidenceCategory}
                onChange={(e) =>
                  setSelectedEvidenceCategory(
                    e.target.value as DocumentCategory | "all"
                  )
                }
                className="px-3 py-2 bg-white border border-[#D1D5DB] rounded text-sm"
              >
                <option value="all">전체 카테고리</option>
                <option value="corporate">법인/사업자</option>
                <option value="team">팀 구성</option>
                <option value="technical">기술 역량</option>
                <option value="validation">검증 자료</option>
                <option value="market">시장 조사</option>
              </select>
            </div>

            {/* 필수 증빙자료 체크리스트 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#111827]">
                필수 증빙자료 체크리스트
              </h3>
              <div className="space-y-4">
                {getDocumentChecklist().map((category) => {
                  const categoryNames = {
                    corporate: "법인/사업자",
                    team: "팀 구성",
                    technical: "기술 역량",
                    validation: "검증 자료",
                    market: "시장 조사",
                  };

                  if (
                    selectedEvidenceCategory !== "all" &&
                    selectedEvidenceCategory !== category.category
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={category.category}
                      className="bg-white rounded-lg border border-[#E5E7EB] p-4"
                    >
                      <h4 className="font-medium text-[#111827] mb-3">
                        {categoryNames[category.category]}
                      </h4>
                      <div className="space-y-2">
                        {category.items.map((item, idx) => {
                          const document = item.documentId
                            ? evidenceDocuments.find(
                                (d) => d.id === item.documentId
                              )
                            : null;

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB] hover:bg-white transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center ${
                                    item.status === "uploaded"
                                      ? "bg-[#10B981]"
                                      : item.status === "expired"
                                      ? "bg-[#EF4444]"
                                      : "bg-[#E5E7EB]"
                                  }`}
                                >
                                  {item.status === "uploaded" && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-[#111827]">
                                    {item.type}
                                    {item.required && (
                                      <span className="text-[#EF4444] ml-1">
                                        *
                                      </span>
                                    )}
                                  </div>
                                  {document && (
                                    <div className="text-xs text-[#6B7280]">
                                      {document.name} •{" "}
                                      {new Date(
                                        document.uploadedAt
                                      ).toLocaleDateString("ko-KR")}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {document && (
                                <a
                                  href={document.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                >
                                  보기
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 업로드된 증빙자료 목록 */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">
                업로드된 증빙자료
              </h3>
              {evidenceDocuments.filter(
                (doc) =>
                  selectedEvidenceCategory === "all" ||
                  doc.category === selectedEvidenceCategory
              ).length === 0 ? (
                <div className="text-center py-8 text-sm text-[#6B7280] bg-white rounded-lg border border-[#E5E7EB]">
                  업로드된 증빙자료가 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {evidenceDocuments
                    .filter(
                      (doc) =>
                        selectedEvidenceCategory === "all" ||
                        doc.category === selectedEvidenceCategory
                    )
                    .map((doc) => {
                      const categoryNames = {
                        corporate: "법인/사업자",
                        team: "팀 구성",
                        technical: "기술 역량",
                        validation: "검증 자료",
                        market: "시장 조사",
                      };

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E5E7EB] hover:border-[#3B82F6] transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-[#111827]">
                                {doc.name}
                              </span>
                              <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] text-xs font-medium rounded">
                                {categoryNames[doc.category]}
                              </span>
                              {doc.required && (
                                <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#991B1B] text-xs font-medium rounded">
                                  필수
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {doc.type} •{" "}
                              {new Date(doc.uploadedAt).toLocaleDateString(
                                "ko-KR"
                              )}{" "}
                              • {doc.uploadedBy}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-[#3B82F6] text-white text-xs font-medium rounded hover:bg-[#2563EB] transition-colors"
                              >
                                보기
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteEvidence(doc.id)}
                              className="text-[#EF4444] hover:text-[#DC2626] transition-colors p-1"
                            >
                              <svg
                                className="w-5 h-5"
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
              )}
            </div>
          </div>

          {/* 증빙자료 추가 모달 */}
          {showAddEvidence && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-[#111827]">
                  증빙자료 추가
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#111827]">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={newEvidence.name}
                      onChange={(e) =>
                        setNewEvidence({ ...newEvidence, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                      placeholder="예: 법인등기부등본"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#111827]">
                      카테고리 *
                    </label>
                    <select
                      value={newEvidence.category}
                      onChange={(e) =>
                        setNewEvidence({
                          ...newEvidence,
                          category: e.target.value as DocumentCategory,
                        })
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white"
                    >
                      <option value="corporate">법인/사업자</option>
                      <option value="team">팀 구성</option>
                      <option value="technical">기술 역량</option>
                      <option value="validation">검증 자료</option>
                      <option value="market">시장 조사</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#111827]">
                      타입 *
                    </label>
                    <input
                      type="text"
                      value={newEvidence.type}
                      onChange={(e) =>
                        setNewEvidence({ ...newEvidence, type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                      placeholder="예: 법인등기부등본"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#111827]">
                      파일
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        setEvidenceFile(e.target.files?.[0] || null)
                      }
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#111827]">
                      설명
                    </label>
                    <textarea
                      value={newEvidence.description}
                      onChange={(e) =>
                        setNewEvidence({
                          ...newEvidence,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                      placeholder="설명을 입력하세요"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newEvidence.required}
                      onChange={(e) =>
                        setNewEvidence({
                          ...newEvidence,
                          required: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#3B82F6] rounded border-[#D1D5DB] focus:ring-[#3B82F6]"
                    />
                    <label className="text-sm text-[#111827]">
                      필수 증빙자료
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowAddEvidence(false)}
                    className="flex-1 px-4 py-2 border border-[#D1D5DB] rounded text-sm font-medium text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddEvidence}
                    className="flex-1 px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 태스크 상세 모달 */}
      {selectedTask &&
        (() => {
          const phase = roadmapPhases.find(
            (p) => p.id === selectedTask.phaseId
          );
          const task = phase?.tasks.find((t) => t.id === selectedTask.taskId);

          if (!task) return null;

          const categoryColors = {
            아카데미: "bg-[#F59E0B] text-white",
            예창패: "bg-[#A855F7] text-white",
            공통: "bg-[#6B7280] text-white",
          };

          return (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedTask(null)}
            >
              <div className="bg-white" onClick={(e) => e.stopPropagation()}>
                {/* 모달 헤더 */}
                <div className="sticky top-0 bg-white border-b border-[#E5E7EB] p-6 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          categoryColors[task.category]
                        }`}
                      >
                        {task.category}
                      </span>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleRoadmapTask(
                            selectedTask.phaseId,
                            selectedTask.taskId
                          );
                        }}
                        className="w-4 h-4 text-black rounded border-[#D1D5DB] focus:ring-black"
                      />
                      <span className="text-xs text-[#6B7280]">
                        {task.completed ? "완료" : "진행중"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#111827] mb-2">
                      {task.title}
                    </h2>
                    {task.description && (
                      <p className="text-sm text-[#6B7280]">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* 모달 내용 */}
                <div className="p-6 space-y-6">
                  {task.details ? (
                    <>
                      {task.details.목표 && (
                        <div>
                          <h3 className="text-sm font-semibold text-[#111827] mb-2">
                            목표
                          </h3>
                          <p className="text-sm text-[#6B7280] bg-[#F9FAFB] p-3 rounded border border-[#E5E7EB]">
                            {task.details.목표}
                          </p>
                        </div>
                      )}

                      {task.details.방법 && (
                        <div>
                          <h3 className="text-sm font-semibold text-[#111827] mb-2">
                            방법
                          </h3>
                          <p className="text-sm text-[#6B7280] bg-[#F9FAFB] p-3 rounded border border-[#E5E7EB]">
                            {task.details.방법}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {task.details.기간 && (
                          <div>
                            <h3 className="text-sm font-semibold text-[#111827] mb-2">
                              기간
                            </h3>
                            <p className="text-sm text-[#6B7280]">
                              {task.details.기간}
                            </p>
                          </div>
                        )}

                        {task.details.담당자 && (
                          <div>
                            <h3 className="text-sm font-semibold text-[#111827] mb-2">
                              담당자
                            </h3>
                            <p className="text-sm text-[#6B7280]">
                              {task.details.담당자}
                            </p>
                          </div>
                        )}
                      </div>

                      {task.details.체크리스트 &&
                        task.details.체크리스트.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-[#111827] mb-3">
                              체크리스트
                            </h3>
                            <div className="space-y-2">
                              {task.details.체크리스트.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]"
                                >
                                  <div className="w-5 h-5 rounded border-2 border-[#D1D5DB] flex items-center justify-center flex-shrink-0">
                                    <svg
                                      className="w-3 h-3 text-[#10B981] hidden"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-sm text-[#111827]">
                                    {item}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {task.details.참고자료 &&
                        task.details.참고자료.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-[#111827] mb-3">
                              참고자료
                            </h3>
                            <div className="space-y-2">
                              {task.details.참고자료.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]"
                                >
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
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <span className="text-sm text-[#111827]">
                                    {item}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-sm text-[#9CA3AF]">
                      상세 내용이 없습니다.
                    </div>
                  )}

                  {/* 노트 섹션 */}
                  <div className="border-t border-[#E5E7EB] pt-6">
                    <h3 className="text-sm font-semibold text-[#111827] mb-4">
                      노트 및 기록 ({task.notes?.length || 0})
                    </h3>

                    {/* 노트 작성 폼 */}
                    <div className="mb-6 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-4">
                      <textarea
                        value={newTaskNoteContent}
                        onChange={(e) => setNewTaskNoteContent(e.target.value)}
                        placeholder="노트를 작성하세요..."
                        rows={4}
                        className="w-full px-3 py-2 border border-[#D1D5DB]"
                      />

                      {/* 첨부파일 미리보기 */}
                      {taskNoteAttachments.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {taskNoteAttachments.map(
                            (file: File, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-white rounded border border-[#E5E7EB]"
                              >
                                {file.type.startsWith("image/") ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                ) : (
                                  <svg
                                    className="w-8 h-8 text-[#6B7280]"
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
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-[#111827] truncate">
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-[#6B7280]">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setTaskNoteAttachments(
                                      taskNoteAttachments.filter(
                                        (_: File, i: number) => i !== index
                                      )
                                    );
                                  }}
                                  className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
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
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          ref={taskFileInputRef}
                          type="file"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setTaskNoteAttachments([
                                ...taskNoteAttachments,
                                ...Array.from(e.target.files || []),
                              ]);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() => taskFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-sm font-medium text-[#6B7280] rounded hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
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
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          파일 첨부
                        </button>
                        <button
                          onClick={handleAddTaskNote}
                          className="px-4 py-1.5 bg-[#3B82F6]"
                        >
                          작성
                        </button>
                      </div>
                    </div>

                    {/* 노트 목록 */}
                    <div className="space-y-4">
                      {task.notes && task.notes.length > 0 ? (
                        task.notes.map((note) => (
                          <div key={note.id} className="bg-white">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#3B82F6]">
                                  <span className="text-xs font-medium text-white">
                                    {note.author.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-[#111827]">
                                    {note.author}
                                  </div>
                                  <div className="text-xs text-[#6B7280]">
                                    {new Date(note.createdAt).toLocaleString(
                                      "ko-KR"
                                    )}
                                  </div>
                                </div>
                              </div>
                              {note.author === currentUser && (
                                <button
                                  onClick={() => handleDeleteTaskNote(note.id)}
                                  className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
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
                              )}
                            </div>
                            <div className="text-sm text-[#111827] whitespace-pre-wrap mb-3">
                              {note.content}
                            </div>

                            {/* 첨부파일 표시 */}
                            {note.attachments &&
                              note.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {note.attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="relative group"
                                      >
                                        {attachment.type === "image" &&
                                        attachment.url ? (
                                          <div className="relative">
                                            <img
                                              src={attachment.url}
                                              alt={attachment.name}
                                              className="w-full h-24 object-cover rounded border border-[#E5E7EB]"
                                            />
                                            <button
                                              onClick={() =>
                                                handleDeleteAttachment(
                                                  note.id,
                                                  attachment.id
                                                )
                                              }
                                              className="absolute top-1 right-1 w-5 h-5 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
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
                                                  d="M6 18L18 6M6 6l12 12"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                                            <svg
                                              className="w-6 h-6 text-[#6B7280] flex-shrink-0"
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
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium text-[#111827] truncate">
                                                {attachment.name}
                                              </div>
                                              <div className="text-xs text-[#6B7280]">
                                                {(
                                                  attachment.size / 1024
                                                ).toFixed(1)}{" "}
                                                KB
                                              </div>
                                            </div>
                                            {note.author === currentUser && (
                                              <button
                                                onClick={() =>
                                                  handleDeleteAttachment(
                                                    note.id,
                                                    attachment.id
                                                  )
                                                }
                                                className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
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
                                                    d="M6 18L18 6M6 6l12 12"
                                                  />
                                                </svg>
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-sm text-[#9CA3AF]">
                          작성된 노트가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 모달 푸터 */}
                <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-4 flex justify-end">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 bg-[#3B82F6]"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* 체크리스트 편집 모달 */}
      {showAddChecklist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">
              {editingChecklistItem ? "체크리스트 수정" : "체크리스트 추가"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={newChecklistItem.title}
                  onChange={(e) =>
                    setNewChecklistItem({
                      ...newChecklistItem,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded"
                  placeholder="체크리스트 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  카테고리
                </label>
                <select
                  value={newChecklistItem.category}
                  onChange={(e) =>
                    setNewChecklistItem({
                      ...newChecklistItem,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white"
                >
                  <option value="서류">서류</option>
                  <option value="발표">발표</option>
                  <option value="제품">제품</option>
                  <option value="예창패">예창패</option>
                  <option value="사업">사업</option>
                  <option value="마케팅">마케팅</option>
                  <option value="교육">교육</option>
                  <option value="재무">재무</option>
                  <option value="투자">투자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  단계 (Phase)
                </label>
                <select
                  value={newChecklistItem.phase}
                  onChange={(e) =>
                    setNewChecklistItem({
                      ...newChecklistItem,
                      phase: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white"
                >
                  {roadmapPhases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.title} ({phase.period})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  마감일 (선택)
                </label>
                <input
                  type="date"
                  value={newChecklistItem.dueDate}
                  onChange={(e) =>
                    setNewChecklistItem({
                      ...newChecklistItem,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddChecklist(false);
                  setEditingChecklistItem(null);
                  setNewChecklistItem({
                    title: "",
                    category: "서류",
                    phase: "phase-1",
                    dueDate: "",
                  });
                }}
                className="px-4 py-2 bg-[#F5F5F5] text-[#1a1a1a] rounded hover:bg-[#E5E7EB] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveChecklistItem}
                className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로드맵 작업 편집 모달 */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">
              {editingTask ? "작업 수정" : "작업 추가"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  작업 제목 *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded"
                  placeholder="작업 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  카테고리
                </label>
                <select
                  value={newTask.category}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      category: e.target.value as RoadmapTask["category"],
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white"
                >
                  <option value="예창패">예창패</option>
                  <option value="아카데미">아카데미</option>
                  <option value="공통">공통</option>
                </select>
              </div>

              {!editingTask && (
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    단계 (Phase)
                  </label>
                  <select
                    value={selectedPhaseForTask}
                    onChange={(e) => setSelectedPhaseForTask(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white"
                  >
                    {roadmapPhases.map((phase) => (
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
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded"
                  placeholder="작업에 대한 설명을 입력하세요"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setEditingTask(null);
                  setNewTask({
                    title: "",
                    category: "예창패",
                    description: "",
                  });
                  setSelectedPhaseForTask("phase-1");
                }}
                className="px-4 py-2 bg-[#F5F5F5] text-[#1a1a1a] rounded hover:bg-[#E5E7EB] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
