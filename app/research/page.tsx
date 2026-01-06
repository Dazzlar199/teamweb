"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/context/UserContext";
import { handleError } from "@/lib/utils/errorHandler";
import {
  getInterviews,
  saveInterview,
  deleteInterview,
  getInterviewStats,
} from "@/lib/utils/interview";
import {
  getSurveys,
  saveSurvey,
  deleteSurvey,
  getSurveyStats,
  getResponsesBySurvey,
} from "@/lib/utils/survey";
import type {
  Interview,
  InterviewType,
  InterviewStatus,
} from "@/lib/types/interview";
import type {
  Survey,
  Question,
  QuestionType,
  SurveyStatus,
  SurveyTargetType,
} from "@/lib/types/survey";

// 가이드북 인터뷰 스크립트 (예비부부용)
const COUPLE_INTERVIEW_SCRIPT = `1. 결혼 준비는 어떻게 진행하고 계신가요?
2. 웨딩 서브서비스(스냅, 영상, 메이크업 등)를 찾을 때 어려움이 있었나요?
3. 현재 어떤 방법으로 서브서비스를 찾고 계신가요?
4. 가장 어려웠던 점은 무엇인가요?
5. 가격과 품질 중 어떤 것이 더 중요하신가요?
6. 프리랜서를 선택할 때 가장 중요하게 보는 기준은?
7. 여러 프리랜서를 비교할 때 어려운 점이 있었나요?
8. AI로 스타일에 맞는 프리랜서를 추천받는다면 사용하시겠어요?
9. 지불 의향이 있으신가요? (얼마까지?)
10. 추가로 하고 싶은 말씀이 있으신가요?`;

// 가이드북 인터뷰 스크립트 (프리랜서용)
const FREELANCER_INTERVIEW_SCRIPT = `1. 현재 어떤 플랫폼에서 활동하고 계신가요?
2. 현재 플랫폼의 불만 사항은 무엇인가요?
3. 수수료는 적정하다고 생각하시나요?
4. 웨딩 특화 플랫폼이 있다면 관심이 있으신가요?
5. 구독제 모델에 대한 의견은?
6. 크루 시스템(여러 프리랜서 패키지)에 대한 의견은?
7. 추가로 하고 싶은 말씀이 있으신가요?`;

// 가이드북 설문 항목 (예비부부용)
const COUPLE_SURVEY_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "single",
    question: "결혼 예정일은 언제인가요?",
    options: ["6개월 이내", "6개월~1년", "1년~2년", "2년 이상"],
    required: true,
    order: 1,
  },
  {
    id: "q2",
    type: "single",
    question: "웨딩 서브서비스를 찾을 때 가장 어려운 점은?",
    options: [
      "업체 찾기 어려움",
      "가격 비교 어려움",
      "품질 확인 어려움",
      "스타일 매칭 어려움",
    ],
    required: true,
    order: 2,
  },
  {
    id: "q3",
    type: "scale",
    question: "AI 기반 프리랜서 추천 서비스에 대한 관심도는?",
    options: ["1", "2", "3", "4", "5"],
    required: true,
    order: 3,
  },
  {
    id: "q4",
    type: "single",
    question: "월 구독료로 프리랜서 매칭 서비스를 사용할 의향이 있나요?",
    options: ["있음", "없음", "고려 중"],
    required: true,
    order: 4,
  },
];

// 가이드북 설문 항목 (프리랜서용)
const FREELANCER_SURVEY_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "single",
    question: "현재 주로 사용하는 플랫폼은?",
    options: ["숨고", "크몽", "기타", "없음"],
    required: true,
    order: 1,
  },
  {
    id: "q2",
    type: "single",
    question: "현재 플랫폼의 가장 큰 불만 사항은?",
    options: ["수수료가 높음", "리드 품질 낮음", "경쟁이 치열함", "기타"],
    required: true,
    order: 2,
  },
  {
    id: "q3",
    type: "scale",
    question: "웨딩 특화 플랫폼에 대한 관심도는?",
    options: ["1", "2", "3", "4", "5"],
    required: true,
    order: 3,
  },
  {
    id: "q4",
    type: "single",
    question: "월 구독제 모델에 대한 의견은?",
    options: ["긍정적", "부정적", "중립"],
    required: true,
    order: 4,
  },
];

export default function ResearchPage() {
  const { user } = useUser();
  const currentUser = user?.name || "김찬주";

  const [activeTab, setActiveTab] = useState<"interviews" | "surveys">(
    "interviews"
  );
  const [filterType, setFilterType] = useState<
    InterviewType | SurveyTargetType | "all"
  >("all");

  // 인터뷰 관련
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filterStatus, setFilterStatus] = useState<InterviewStatus | "all">(
    "all"
  );
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [interviewStats, setInterviewStats] = useState(getInterviewStats());

  // 설문조사 관련
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filterSurveyStatus, setFilterSurveyStatus] = useState<
    SurveyStatus | "all"
  >("all");
  const [showAddSurvey, setShowAddSurvey] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyStats, setSurveyStats] = useState(getSurveyStats());

  const [newInterview, setNewInterview] = useState({
    type: "couple" as InterviewType,
    interviewee: {
      name: "",
      age: undefined as number | undefined,
      region: "",
      contact: "",
      anonymous: false,
    },
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "10:00",
    script: COUPLE_INTERVIEW_SCRIPT,
  });

  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    targetType: "couple" as SurveyTargetType,
    targetCount: 150,
    questions: [] as Question[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    loadInterviews();
    loadSurveys();
  };

  const loadInterviews = () => {
    try {
      const loaded = getInterviews();
      setInterviews(loaded);
      setInterviewStats(getInterviewStats());
    } catch (error) {
      handleError(error as Error, {
        component: "ResearchPage",
        action: "인터뷰 로드",
      });
    }
  };

  const loadSurveys = () => {
    try {
      const loaded = getSurveys();
      setSurveys(loaded);
      setSurveyStats(getSurveyStats());
    } catch (error) {
      handleError(error as Error, {
        component: "ResearchPage",
        action: "설문조사 로드",
      });
    }
  };

  const handleAddInterview = () => {
    try {
      const scheduledTimestamp = new Date(
        `${newInterview.scheduledDate}T${newInterview.scheduledTime}`
      ).getTime();

      const interview: Interview = {
        id: `interview-${Date.now()}`,
        type: newInterview.type,
        interviewee: newInterview.interviewee,
        scheduledDate: scheduledTimestamp,
        status: "scheduled",
        script: newInterview.script,
        responses: [],
        painPoints: [],
        quotes: [],
        createdBy: currentUser,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      saveInterview(interview);
      loadInterviews();
      setShowAddInterview(false);
      setNewInterview({
        type: "couple",
        interviewee: {
          name: "",
          age: undefined,
          region: "",
          contact: "",
          anonymous: false,
        },
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTime: "10:00",
        script: COUPLE_INTERVIEW_SCRIPT,
      });
    } catch (error) {
      handleError(error as Error, {
        component: "ResearchPage",
        action: "인터뷰 추가",
      });
    }
  };

  const handleAddSurvey = () => {
    if (!newSurvey.title || newSurvey.questions.length === 0) {
      alert("제목과 질문을 입력해주세요.");
      return;
    }

    try {
      const survey: Survey = {
        id: `survey-${Date.now()}`,
        title: newSurvey.title,
        description: newSurvey.description,
        targetType: newSurvey.targetType,
        questions: newSurvey.questions,
        targetCount: newSurvey.targetCount,
        responseCount: 0,
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: currentUser,
      };

      saveSurvey(survey);
      loadSurveys();
      setShowAddSurvey(false);
      setNewSurvey({
        title: "",
        description: "",
        targetType: "couple",
        targetCount: 150,
        questions: [],
      });
    } catch (error) {
      handleError(error as Error, {
        component: "ResearchPage",
        action: "설문조사 추가",
      });
    }
  };

  const handleDeleteInterview = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      deleteInterview(id);
      loadInterviews();
      if (selectedInterview?.id === id) {
        setSelectedInterview(null);
      }
    } catch (error) {
      handleError(error as Error, {
        component: "ResearchPage",
        action: "인터뷰 삭제",
      });
    }
  };

  const handleDeleteSurvey = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      deleteSurvey(id);
      loadSurveys();
      if (selectedSurvey?.id === id) {
        setSelectedSurvey(null);
      }
    } catch (error) {
      handleError(error as Error, {
        component: "ResearchPage",
        action: "설문조사 삭제",
      });
    }
  };

  const handleUpdateInterview = (updated: Interview) => {
    try {
      updated.updatedAt = Date.now();
      saveInterview(updated);
      loadInterviews();
      setSelectedInterview(updated);
    } catch (error) {
      handleError(error as Error, {
        component: "ResearchPage",
        action: "인터뷰 업데이트",
      });
    }
  };

  const handleTypeChange = (type: InterviewType) => {
    setNewInterview({
      ...newInterview,
      type,
      script:
        type === "couple"
          ? COUPLE_INTERVIEW_SCRIPT
          : FREELANCER_INTERVIEW_SCRIPT,
    });
  };

  const handleSurveyTargetTypeChange = (targetType: SurveyTargetType) => {
    const questions =
      targetType === "couple"
        ? COUPLE_SURVEY_QUESTIONS
        : targetType === "freelancer"
        ? FREELANCER_SURVEY_QUESTIONS
        : [];

    setNewSurvey({
      ...newSurvey,
      targetType,
      questions,
    });
  };

  const handleAddQuestion = () => {
    const question: Question = {
      id: `q-${Date.now()}`,
      type: "single",
      question: "",
      options: [],
      required: false,
      order: newSurvey.questions.length + 1,
    };
    setNewSurvey({
      ...newSurvey,
      questions: [...newSurvey.questions, question],
    });
  };

  const handleUpdateQuestion = (index: number, updated: Question) => {
    const questions = [...newSurvey.questions];
    questions[index] = updated;
    setNewSurvey({ ...newSurvey, questions });
  };

  const handleDeleteQuestion = (index: number) => {
    const questions = newSurvey.questions.filter((_, i) => i !== index);
    setNewSurvey({ ...newSurvey, questions });
  };

  // 필터링된 데이터
  const filteredInterviews = interviews.filter((interview) => {
    if (
      filterType !== "all" &&
      filterType !== "couple" &&
      filterType !== "freelancer"
    )
      return true;
    if (filterType === "all") return true;
    if (filterType === "couple" && interview.type !== "couple") return false;
    if (filterType === "freelancer" && interview.type !== "freelancer")
      return false;
    if (filterStatus !== "all" && interview.status !== filterStatus)
      return false;
    return true;
  });

  const filteredSurveys = surveys.filter((survey) => {
    if (
      filterType !== "all" &&
      filterType !== "couple" &&
      filterType !== "freelancer"
    )
      return true;
    if (filterType === "all") return true;
    if (
      filterType === "couple" &&
      survey.targetType !== "couple" &&
      survey.targetType !== "all"
    )
      return false;
    if (
      filterType === "freelancer" &&
      survey.targetType !== "freelancer" &&
      survey.targetType !== "all"
    )
      return false;
    if (filterSurveyStatus !== "all" && survey.status !== filterSurveyStatus)
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="p-6 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#111827]">
            고객 검증 관리
          </h1>
          <p className="text-xs text-[#6B7280]">
            인터뷰와 설문조사를 통합 관리하고, 예비부부/프리랜서별로 분석합니다
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              전체 인터뷰
            </div>
            <div className="text-2xl font-semibold text-[#111827]">
              {interviewStats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              전체 설문
            </div>
            <div className="text-2xl font-semibold text-[#111827]">
              {surveyStats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              예비부부
            </div>
            <div className="text-2xl font-semibold text-[#111827]">
              {interviewStats.couple +
                surveys.filter(
                  (s) => s.targetType === "couple" || s.targetType === "all"
                ).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <div className="text-xs font-medium text-[#6B7280] mb-1">
              프리랜서
            </div>
            <div className="text-2xl font-semibold text-[#111827]">
              {interviewStats.freelancer +
                surveys.filter(
                  (s) => s.targetType === "freelancer" || s.targetType === "all"
                ).length}
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-6 flex gap-2 border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab("interviews")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "interviews"
                ? "border-[#6B7280] text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            인터뷰 관리
          </button>
          <button
            onClick={() => setActiveTab("surveys")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "surveys"
                ? "border-[#6B7280] text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            설문조사 관리
          </button>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-white"
          >
            <option value="all">전체 타입</option>
            <option value="couple">예비부부</option>
            <option value="freelancer">프리랜서</option>
          </select>
          {activeTab === "interviews" && (
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as InterviewStatus | "all")
              }
              className="px-3 py-2 bg-white"
            >
              <option value="all">전체 상태</option>
              <option value="scheduled">예정</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          )}
          {activeTab === "surveys" && (
            <select
              value={filterSurveyStatus}
              onChange={(e) =>
                setFilterSurveyStatus(e.target.value as SurveyStatus | "all")
              }
              className="px-3 py-2 bg-white"
            >
              <option value="all">전체 상태</option>
              <option value="draft">초안</option>
              <option value="active">진행 중</option>
              <option value="closed">완료</option>
            </select>
          )}
        </div>

        {/* 인터뷰 탭 */}
        {activeTab === "interviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111827]">
                인터뷰 목록
              </h2>
              <button
                onClick={() => setShowAddInterview(true)}
                className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
              >
                + 인터뷰 추가
              </button>
            </div>

            {filteredInterviews.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  인터뷰가 없습니다. 인터뷰를 추가해주세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInterviews.map((interview) => {
                  const scheduledDate = new Date(interview.scheduledDate);
                  const statusColors = {
                    scheduled: "bg-[#9CA3AF] text-white",
                    completed: "bg-[#10B981] text-white",
                    cancelled: "bg-[#6B7280] text-white",
                  };

                  return (
                    <div
                      key={interview.id}
                      onClick={() => setSelectedInterview(interview)}
                      className="bg-white rounded-lg border border-[#E5E7EB] p-4 cursor-pointer hover:border-[#9CA3AF] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#111827] mb-1">
                            {interview.interviewee.anonymous
                              ? "익명"
                              : interview.interviewee.name || "이름 없음"}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {interview.type === "couple"
                              ? "예비부부"
                              : "프리랜서"}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                            statusColors[interview.status]
                          }`}
                        >
                          {interview.status === "scheduled"
                            ? "예정"
                            : interview.status === "completed"
                            ? "완료"
                            : "취소"}
                        </span>
                      </div>
                      <div className="text-sm text-[#6B7280] mb-2">
                        {scheduledDate.toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        {scheduledDate.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {interview.status === "completed" && (
                        <div className="flex items-center gap-4 text-xs text-[#6B7280] pt-2 border-t border-[#E5E7EB]">
                          <span>
                            페인포인트: {interview.painPoints.length}개
                          </span>
                          <span>인용구: {interview.quotes.length}개</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 설문조사 탭 */}
        {activeTab === "surveys" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111827]">
                설문조사 목록
              </h2>
              <button
                onClick={() => setShowAddSurvey(true)}
                className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
              >
                + 설문조사 추가
              </button>
            </div>

            {filteredSurveys.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  설문조사가 없습니다. 설문조사를 추가해주세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSurveys.map((survey) => {
                  const progress =
                    survey.targetCount > 0
                      ? Math.min(
                          100,
                          (survey.responseCount / survey.targetCount) * 100
                        )
                      : 0;
                  const statusColors = {
                    draft: "bg-[#6B7280] text-white",
                    active: "bg-[#9CA3AF] text-white",
                    closed: "bg-[#10B981] text-white",
                  };

                  return (
                    <div
                      key={survey.id}
                      onClick={() => setSelectedSurvey(survey)}
                      className="bg-white rounded-lg border border-[#E5E7EB] p-4 cursor-pointer hover:border-[#9CA3AF] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#111827] mb-1">
                            {survey.title}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {survey.targetType === "couple"
                              ? "예비부부"
                              : survey.targetType === "freelancer"
                              ? "프리랜서"
                              : "전체"}{" "}
                            • 질문 {survey.questions.length}개
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                            statusColors[survey.status]
                          }`}
                        >
                          {survey.status === "draft"
                            ? "초안"
                            : survey.status === "active"
                            ? "진행 중"
                            : "완료"}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                          <span className="font-medium">
                            응답: {survey.responseCount} / {survey.targetCount}
                          </span>
                          <span className="font-semibold">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                          <div
                            className="bg-[#9CA3AF] h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 인터뷰 추가 모달 */}
        {showAddInterview && (
          <InterviewAddModal
            interview={newInterview}
            onUpdate={setNewInterview}
            onAdd={handleAddInterview}
            onClose={() => setShowAddInterview(false)}
            onTypeChange={handleTypeChange}
          />
        )}

        {/* 인터뷰 상세 모달 */}
        {selectedInterview && (
          <InterviewDetailModal
            interview={selectedInterview}
            onClose={() => setSelectedInterview(null)}
            onUpdate={handleUpdateInterview}
            onDelete={handleDeleteInterview}
          />
        )}

        {/* 설문조사 추가 모달 */}
        {showAddSurvey && (
          <SurveyAddModal
            survey={newSurvey}
            onUpdate={setNewSurvey}
            onAdd={handleAddSurvey}
            onClose={() => setShowAddSurvey(false)}
            onTargetTypeChange={handleSurveyTargetTypeChange}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        )}

        {/* 설문조사 상세 모달 */}
        {selectedSurvey && (
          <SurveyDetailModal
            survey={selectedSurvey}
            onClose={() => setSelectedSurvey(null)}
            onUpdate={loadSurveys}
            onDelete={handleDeleteSurvey}
          />
        )}
      </div>
    </div>
  );
}

// 인터뷰 추가 모달
function InterviewAddModal({
  interview,
  onUpdate,
  onAdd,
  onClose,
  onTypeChange,
}: {
  interview: any;
  onUpdate: (interview: any) => void;
  onAdd: () => void;
  onClose: () => void;
  onTypeChange: (type: InterviewType) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">인터뷰 추가</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]">
              인터뷰 타입
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onTypeChange("couple")}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  interview.type === "couple"
                    ? "bg-[#9CA3AF] text-white"
                    : "bg-[#F5F5F5] text-[#111827]"
                }`}
              >
                예비부부
              </button>
              <button
                onClick={() => onTypeChange("freelancer")}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  interview.type === "freelancer"
                    ? "bg-[#9CA3AF] text-white"
                    : "bg-[#F5F5F5] text-[#111827]"
                }`}
              >
                프리랜서
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]">
              인터뷰 대상자 이름
            </label>
            <input
              type="text"
              value={interview.interviewee.name}
              onChange={(e) =>
                onUpdate({
                  ...interview,
                  interviewee: {
                    ...interview.interviewee,
                    name: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-[#E2E8F0]"
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]">
                나이 (선택)
              </label>
              <input
                type="number"
                value={interview.interviewee.age || ""}
                onChange={(e) =>
                  onUpdate({
                    ...interview,
                    interviewee: {
                      ...interview.interviewee,
                      age: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-[#E2E8F0]"
                placeholder="나이"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]">
                지역 (선택)
              </label>
              <input
                type="text"
                value={interview.interviewee.region}
                onChange={(e) =>
                  onUpdate({
                    ...interview,
                    interviewee: {
                      ...interview.interviewee,
                      region: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-[#E2E8F0]"
                placeholder="지역"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]">
              연락처 (선택)
            </label>
            <input
              type="text"
              value={interview.interviewee.contact}
              onChange={(e) =>
                onUpdate({
                  ...interview,
                  interviewee: {
                    ...interview.interviewee,
                    contact: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-[#E2E8F0]"
              placeholder="연락처"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={interview.interviewee.anonymous}
              onChange={(e) =>
                onUpdate({
                  ...interview,
                  interviewee: {
                    ...interview.interviewee,
                    anonymous: e.target.checked,
                  },
                })
              }
              className="w-4 h-4"
            />
            <label className="text-sm text-[#1a1a1a]">익명 처리</label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]">
                예정일
              </label>
              <input
                type="date"
                value={interview.scheduledDate}
                onChange={(e) =>
                  onUpdate({ ...interview, scheduledDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-[#E2E8F0]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]">
                예정 시간
              </label>
              <input
                type="time"
                value={interview.scheduledTime}
                onChange={(e) =>
                  onUpdate({ ...interview, scheduledTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-[#E2E8F0]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-[#F5F5F5]">
            취소
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

// 인터뷰 상세 모달 (기존 코드 재사용)
function InterviewDetailModal({
  interview,
  onClose,
  onUpdate,
  onDelete,
}: {
  interview: Interview;
  onClose: () => void;
  onUpdate: (interview: Interview) => void;
  onDelete: (id: string) => void;
}) {
  const [editedInterview, setEditedInterview] = useState<Interview>(interview);
  const [newResponse, setNewResponse] = useState({ question: "", answer: "" });
  const [newPainPoint, setNewPainPoint] = useState("");
  const [newQuote, setNewQuote] = useState("");

  const handleSave = () => {
    onUpdate(editedInterview);
  };

  const handleAddResponse = () => {
    if (!newResponse.question || !newResponse.answer) return;

    setEditedInterview({
      ...editedInterview,
      responses: [
        ...editedInterview.responses,
        {
          question: newResponse.question,
          answer: newResponse.answer,
          painPoint: false,
          quote: false,
        },
      ],
    });
    setNewResponse({ question: "", answer: "" });
  };

  const handleAddPainPoint = () => {
    if (!newPainPoint) return;
    setEditedInterview({
      ...editedInterview,
      painPoints: [...editedInterview.painPoints, newPainPoint],
    });
    setNewPainPoint("");
  };

  const handleAddQuote = () => {
    if (!newQuote) return;
    setEditedInterview({
      ...editedInterview,
      quotes: [...editedInterview.quotes, newQuote],
    });
    setNewQuote("");
  };

  const handleMarkComplete = () => {
    setEditedInterview({
      ...editedInterview,
      status: "completed",
      completedDate: Date.now(),
    });
    onUpdate({
      ...editedInterview,
      status: "completed",
      completedDate: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1a1a1a]">인터뷰 상세</h2>
          <button onClick={onClose} className="text-[#6B7280]">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="font-semibold text-[#1a1a1a]">기본 정보</h3>
            <div className="bg-[#F9FAFB]">
              <div>
                <span className="text-[#6B7280]">타입: </span>
                <span className="text-[#1a1a1a]">
                  {interview.type === "couple" ? "예비부부" : "프리랜서"}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280]">이름: </span>
                <span className="text-[#1a1a1a]">
                  {interview.interviewee.anonymous
                    ? "익명"
                    : interview.interviewee.name || "이름 없음"}
                </span>
              </div>
              {interview.interviewee.age && (
                <div>
                  <span className="text-[#6B7280]">나이: </span>
                  <span className="text-[#1a1a1a]">
                    {interview.interviewee.age}세
                  </span>
                </div>
              )}
              {interview.interviewee.region && (
                <div>
                  <span className="text-[#6B7280]">지역: </span>
                  <span className="text-[#1a1a1a]">
                    {interview.interviewee.region}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[#6B7280]">예정일: </span>
                <span className="text-[#1a1a1a]">
                  {new Date(interview.scheduledDate).toLocaleString("ko-KR")}
                </span>
              </div>
              {interview.completedDate && (
                <div>
                  <span className="text-[#6B7280]">완료일: </span>
                  <span className="text-[#1a1a1a]">
                    {new Date(interview.completedDate).toLocaleString("ko-KR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 인터뷰 스크립트 */}
          <div>
            <h3 className="font-semibold text-[#1a1a1a]">인터뷰 스크립트</h3>
            <div className="bg-[#F9FAFB]">
              <pre className="text-sm text-[#1a1a1a]">{interview.script}</pre>
            </div>
          </div>

          {/* 응답 추가 */}
          {interview.status === "completed" && (
            <div>
              <h3 className="font-semibold text-[#1a1a1a]">응답 추가</h3>
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={newResponse.question}
                  onChange={(e) =>
                    setNewResponse({ ...newResponse, question: e.target.value })
                  }
                  placeholder="질문"
                  className="w-full px-3 py-2 border border-[#E2E8F0]"
                />
                <textarea
                  value={newResponse.answer}
                  onChange={(e) =>
                    setNewResponse({ ...newResponse, answer: e.target.value })
                  }
                  placeholder="답변"
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E2E8F0]"
                />
                <button
                  onClick={handleAddResponse}
                  className="px-3 py-1 bg-[#6B7280] text-white text-xs font-medium rounded hover:bg-[#4B5563] transition-colors"
                >
                  응답 추가
                </button>
              </div>
            </div>
          )}

          {/* 응답 목록 */}
          {editedInterview.responses.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#111827] mb-3">응답 목록</h3>
              <div className="space-y-3">
                {editedInterview.responses.map((response, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F9FAFB] border border-[#E5E7EB] p-3 rounded"
                  >
                    <div className="font-medium text-[#111827] mb-1">
                      Q: {response.question}
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      A: {response.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 페인포인트 */}
          <div>
            <h3 className="font-semibold text-[#111827] mb-3">페인포인트</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPainPoint}
                onChange={(e) => setNewPainPoint(e.target.value)}
                placeholder="페인포인트 추가"
                className="flex-1 px-3 py-2 border border-[#E2E8F0]"
              />
              <button
                onClick={handleAddPainPoint}
                className="px-3 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedInterview.painPoints.map((point, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-sm text-[#111827]"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>

          {/* 인용구 */}
          <div>
            <h3 className="font-semibold text-[#111827] mb-3">인용구</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="인용구 추가"
                className="flex-1 px-3 py-2 border border-[#E2E8F0]"
              />
              <button
                onClick={handleAddQuote}
                className="px-3 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
              >
                추가
              </button>
            </div>
            <div className="space-y-2">
              {editedInterview.quotes.map((quote, idx) => (
                <div
                  key={idx}
                  className="bg-[#F3F4F6] border border-[#E5E7EB] p-2 rounded text-sm text-[#111827]"
                >
                  "{quote}"
                </div>
              ))}
            </div>
          </div>

          {/* 요약 */}
          <div>
            <h3 className="font-semibold text-[#111827] mb-3">요약</h3>
            <textarea
              value={editedInterview.summary || ""}
              onChange={(e) =>
                setEditedInterview({
                  ...editedInterview,
                  summary: e.target.value,
                })
              }
              placeholder="인터뷰 요약을 작성하세요"
              rows={4}
              className="w-full px-3 py-2 border border-[#E2E8F0]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          {interview.status !== "completed" && (
            <button
              onClick={handleMarkComplete}
              className="px-4 py-2 bg-[#10B981] text-white rounded text-sm font-medium hover:bg-[#059669] transition-colors"
            >
              완료 처리
            </button>
          )}
          <button
            onClick={() => onDelete(interview.id)}
            className="px-4 py-2 bg-[#EF4444] text-white rounded text-sm font-medium hover:bg-[#DC2626] transition-colors"
          >
            삭제
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// 설문조사 추가 모달
function SurveyAddModal({
  survey,
  onUpdate,
  onAdd,
  onClose,
  onTargetTypeChange,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: {
  survey: any;
  onUpdate: (survey: any) => void;
  onAdd: () => void;
  onClose: () => void;
  onTargetTypeChange: (type: SurveyTargetType) => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, question: Question) => void;
  onDeleteQuestion: (index: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">설문조사 추가</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]">
              설문 대상 *
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onTargetTypeChange("couple")}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  survey.targetType === "couple"
                    ? "bg-[#9CA3AF] text-white"
                    : "bg-[#F5F5F5]"
                }`}
              >
                예비부부
              </button>
              <button
                onClick={() => onTargetTypeChange("freelancer")}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  survey.targetType === "freelancer"
                    ? "bg-[#9CA3AF] text-white"
                    : "bg-[#F5F5F5]"
                }`}
              >
                프리랜서
              </button>
              <button
                onClick={() => onTargetTypeChange("all")}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  survey.targetType === "all"
                    ? "bg-[#9CA3AF] text-white"
                    : "bg-[#F5F5F5] text-[#111827]"
                }`}
              >
                전체
              </button>
            </div>
            {survey.targetType && survey.questions.length === 0 && (
              <div className="mt-2 text-xs text-[#6B7280]">
                {survey.targetType === "couple"
                  ? "예비부부용 기본 질문이 자동으로 추가됩니다."
                  : survey.targetType === "freelancer"
                  ? "프리랜서용 기본 질문이 자동으로 추가됩니다."
                  : "대상을 선택하면 기본 질문이 추가됩니다."}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]">
              제목 *
            </label>
            <input
              type="text"
              value={survey.title}
              onChange={(e) => onUpdate({ ...survey, title: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0]"
              placeholder="설문조사 제목"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]">
              설명
            </label>
            <textarea
              value={survey.description}
              onChange={(e) =>
                onUpdate({ ...survey, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-[#E2E8F0]"
              placeholder="설문조사 설명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]">
              목표 응답 수
            </label>
            <input
              type="number"
              value={survey.targetCount}
              onChange={(e) =>
                onUpdate({
                  ...survey,
                  targetCount: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-[#E2E8F0]"
              placeholder="150"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#1a1a1a]">
                질문 목록 ({survey.questions.length}개)
              </label>
              <button
                onClick={onAddQuestion}
                className="px-3 py-1 bg-[#3B82F6]"
              >
                + 질문 추가
              </button>
            </div>

            <div className="space-y-3">
              {survey.questions.map((question: Question, index: number) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={(updated) => onUpdateQuestion(index, updated)}
                  onDelete={() => onDeleteQuestion(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-[#F5F5F5]">
            취소
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

// 질문 에디터 컴포넌트
function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}) {
  const handleTypeChange = (type: QuestionType) => {
    const updated: Question = {
      ...question,
      type,
      options:
        type === "single" || type === "multiple"
          ? question.options || []
          : undefined,
    };
    onUpdate(updated);
  };

  const handleAddOption = () => {
    const options = [...(question.options || []), ""];
    onUpdate({ ...question, options });
  };

  const handleUpdateOption = (optIndex: number, value: string) => {
    const options = [...(question.options || [])];
    options[optIndex] = value;
    onUpdate({ ...question, options });
  };

  const handleDeleteOption = (optIndex: number) => {
    const options = question.options?.filter((_, i) => i !== optIndex) || [];
    onUpdate({ ...question, options });
  };

  return (
    <div className="bg-[#F9FAFB]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#1a1a1a]">
          질문 {index + 1}
        </span>
        <button
          onClick={onDelete}
          className="text-[#EF4444] text-sm hover:underline"
        >
          삭제
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[#6B7280]">질문 유형</label>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="w-full px-2 py-1 border border-[#E2E8F0]"
          >
            <option value="single">단일선택</option>
            <option value="multiple">다중선택</option>
            <option value="text">주관식</option>
            <option value="scale">척도</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-[#6B7280]">질문 내용 *</label>
          <input
            type="text"
            value={question.question}
            onChange={(e) =>
              onUpdate({ ...question, question: e.target.value })
            }
            className="w-full px-2 py-1 border border-[#E2E8F0]"
            placeholder="질문을 입력하세요"
          />
        </div>

        {(question.type === "single" || question.type === "multiple") && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-[#6B7280]">선택지</label>
              <button
                onClick={handleAddOption}
                className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                + 추가
              </button>
            </div>
            <div className="space-y-1">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      handleUpdateOption(optIndex, e.target.value)
                    }
                    className="flex-1 px-2 py-1 border border-[#E2E8F0]"
                    placeholder={`선택지 ${optIndex + 1}`}
                  />
                  <button
                    onClick={() => handleDeleteOption(optIndex)}
                    className="text-[#EF4444] text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === "scale" && (
          <div>
            <label className="block text-xs text-[#6B7280]">
              척도 범위 (예: 1-5)
            </label>
            <input
              type="text"
              value={question.options?.join("-") || "1-5"}
              onChange={(e) => {
                const parts = e.target.value.split("-");
                if (parts.length === 2) {
                  const min = parseInt(parts[0]) || 1;
                  const max = parseInt(parts[1]) || 5;
                  const options: string[] = [];
                  for (let i = min; i <= max; i++) {
                    options.push(i.toString());
                  }
                  onUpdate({ ...question, options });
                }
              }}
              className="w-full px-2 py-1 border border-[#E2E8F0]"
              placeholder="1-5"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) =>
              onUpdate({ ...question, required: e.target.checked })
            }
            className="w-4 h-4"
          />
          <label className="text-xs text-[#1a1a1a]">필수 질문</label>
        </div>
      </div>
    </div>
  );
}

// 설문조사 상세 모달
function SurveyDetailModal({
  survey,
  onClose,
  onUpdate,
  onDelete,
}: {
  survey: Survey;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const responses = getResponsesBySurvey(survey.id);
  const progress =
    survey.targetCount > 0
      ? Math.min(100, (survey.responseCount / survey.targetCount) * 100)
      : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1a1a1a]">{survey.title}</h2>
          <button onClick={onClose} className="text-[#6B7280]">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-[#1a1a1a]">설명</h3>
              <span className="px-2 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-xs text-[#111827]">
                {survey.targetType === "couple"
                  ? "예비부부"
                  : survey.targetType === "freelancer"
                  ? "프리랜서"
                  : "전체"}
              </span>
            </div>
            <p className="text-sm text-[#6B7280]">
              {survey.description || "설명 없음"}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#1a1a1a]">응답 현황</h3>
              <span className="text-sm text-[#6B7280]">
                {survey.responseCount} / {survey.targetCount} (
                {progress.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-2">
              <div
                className="bg-[#9CA3AF] h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#1a1a1a]">질문 목록</h3>
            <div className="space-y-3">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="bg-[#F9FAFB]">
                  <div className="font-medium text-[#1a1a1a]">
                    {index + 1}. {question.question}
                    {question.required && (
                      <span className="text-[#EF4444] ml-1">*</span>
                    )}
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    유형:{" "}
                    {question.type === "single"
                      ? "단일선택"
                      : question.type === "multiple"
                      ? "다중선택"
                      : question.type === "text"
                      ? "주관식"
                      : "척도"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#1a1a1a]">
              응답 목록 ({responses.length}개)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.map((response, idx) => (
                <div key={response.id} className="bg-[#F9FAFB]">
                  <div className="text-xs text-[#6B7280]">
                    응답 #{idx + 1} -{" "}
                    {new Date(response.submittedAt).toLocaleString("ko-KR")}
                  </div>
                  <div className="space-y-1">
                    {response.responses.map((r, rIdx) => {
                      const question = survey.questions.find(
                        (q) => q.id === r.questionId
                      );
                      return (
                        <div key={rIdx} className="text-xs">
                          <span className="font-medium text-[#1a1a1a]">
                            Q: {question?.question || "질문 없음"}
                          </span>
                          <div className="text-[#6B7280]">
                            A:{" "}
                            {Array.isArray(r.answer)
                              ? r.answer.join(", ")
                              : r.answer}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => onDelete(survey.id)}
            className="px-4 py-2 bg-[#EF4444] text-white rounded text-sm font-medium hover:bg-[#DC2626] transition-colors"
          >
            삭제
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#6B7280] text-white text-sm font-medium rounded hover:bg-[#4B5563] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
