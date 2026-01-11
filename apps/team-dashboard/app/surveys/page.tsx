"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/context/UserContext";
import { handleError } from "@/lib/utils/errorHandler";
import {
  getSurveys,
  saveSurvey,
  deleteSurvey,
  getSurveyStats,
  getResponsesBySurvey,
} from "@/lib/utils/survey";
import type { Survey, Question, QuestionType, SurveyStatus, SurveyTargetType } from "@/lib/types/survey";

export default function SurveysPage() {
  const { user } = useUser();
  const currentUser = user?.name || "김찬주";
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filterStatus, setFilterStatus] = useState<SurveyStatus | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [stats, setStats] = useState(getSurveyStats());
  
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    targetType: "all" as SurveyTargetType,
    targetCount: 150,
    questions: [] as Question[],
  });

  const loadSurveys = () => {
    try {
      const loaded = getSurveys();
      setSurveys(loaded);
      setStats(getSurveyStats());
    } catch (error) {
      handleError(error as Error, {
        component: "SurveysPage",
        action: "설문조사 로드",
      });
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const handleAddSurvey = () => {
    if (!newSurvey.title || newSurvey.questions.length === 0) {
      alert("제목과 질문을 입력해주세요.");
      return;
    }

    try {
      const newSurveyData: Survey = {
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

      saveSurvey(newSurveyData);
      loadSurveys();
      setShowAddForm(false);
      setNewSurvey({
        title: "",
        description: "",
        targetType: "all" as SurveyTargetType,
        targetCount: 150,
        questions: [],
      });
    } catch (error) {
      handleError(error as Error, {
        component: "SurveysPage",
        action: "설문조사 추가",
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
        component: "SurveysPage",
        action: "설문조사 삭제",
      });
    }
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

  const filteredSurveys = surveys.filter((survey) => {
    if (filterStatus !== "all" && survey.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-6 ml-64">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
            설문조사 관리
          </h1>
          <p className="text-sm text-[#6B7280]">
            정량 설문조사를 생성하고 응답을 수집하여 분석합니다
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">전체 설문</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">진행 중</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.active}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">완료</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.completed}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">총 응답</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.totalResponses}
            </div>
          </div>
        </div>

        {/* 필터 및 추가 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SurveyStatus | "all")}
            className="px-3 py-2 bg-white border border-[#E2E8F0] rounded text-sm text-[#1a1a1a]"
          >
            <option value="all">전체 상태</option>
            <option value="draft">초안</option>
            <option value="active">진행 중</option>
            <option value="closed">완료</option>
          </select>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
          >
            + 설문조사 추가
          </button>
        </div>

        {/* 설문조사 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredSurveys.map((survey) => {
            const progress = survey.targetCount > 0 
              ? Math.min(100, (survey.responseCount / survey.targetCount) * 100)
              : 0;
            const statusColors = {
              draft: "bg-[#6B7280] text-white",
              active: "bg-[#3B82F6] text-white",
              closed: "bg-[#10B981] text-white",
            };

            return (
              <div
                key={survey.id}
                onClick={() => setSelectedSurvey(survey)}
                className="bg-white rounded-lg border border-[#E2E8F0] p-4 cursor-pointer hover:border-[#1a1a1a] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-[#1a1a1a] mb-1">
                      {survey.title}
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      질문 {survey.questions.length}개
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusColors[survey.status]}`}
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
                    <span>응답: {survey.responseCount} / {survey.targetCount}</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                    <div
                      className="bg-[#3B82F6] h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSurveys.length === 0 && (
          <div className="text-center py-12 text-[#6B7280]">
            설문조사가 없습니다. 설문조사를 추가해주세요.
          </div>
        )}

        {/* 설문조사 추가 모달 */}
        {showAddForm && (
          <SurveyAddModal
            survey={newSurvey}
            onUpdate={setNewSurvey}
            onAdd={handleAddSurvey}
            onClose={() => setShowAddForm(false)}
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

// 설문조사 추가 모달
function SurveyAddModal({
  survey: surveyData,
  onUpdate,
  onAdd,
  onClose,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: {
  survey: { title: string; description: string; targetType: SurveyTargetType; targetCount: number; questions: Question[] };
  onUpdate: (surveyData: { title: string; description: string; targetType: SurveyTargetType; targetCount: number; questions: Question[] }) => void;
  onAdd: () => void;
  onClose: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, question: Question) => void;
  onDeleteQuestion: (index: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">
          설문조사 추가
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={surveyData.title}
              onChange={(e) => onUpdate({ ...surveyData, title: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
              placeholder="설문조사 제목"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              설명
            </label>
            <textarea
              value={surveyData.description}
              onChange={(e) => onUpdate({ ...surveyData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
              placeholder="설문조사 설명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              목표 응답 수
            </label>
            <input
              type="number"
              value={surveyData.targetCount}
              onChange={(e) => onUpdate({ ...surveyData, targetCount: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
              placeholder="150"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#1a1a1a]">
                질문 목록 ({surveyData.questions.length}개)
              </label>
              <button
                onClick={onAddQuestion}
                className="px-3 py-1 bg-[#1a1a1a] text-white rounded text-sm"
              >
                + 질문 추가
              </button>
            </div>

            <div className="space-y-3">
              {surveyData.questions.map((question, index) => (
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
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F5F5F5] text-[#1a1a1a] rounded text-sm font-medium hover:bg-[#E5E5E5] transition-colors"
          >
            취소
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
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
      options: type === "single" || type === "multiple" ? question.options || [] : undefined,
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
    <div className="bg-[#F9FAFB] rounded p-4">
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
          <label className="block text-xs text-[#6B7280] mb-1">
            질문 유형
          </label>
          <select
            value={question.type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="w-full px-2 py-1 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
          >
            <option value="single">단일선택</option>
            <option value="multiple">다중선택</option>
            <option value="text">주관식</option>
            <option value="scale">척도</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] mb-1">
            질문 내용 *
          </label>
          <input
            type="text"
            value={question.question}
            onChange={(e) => onUpdate({ ...question, question: e.target.value })}
            className="w-full px-2 py-1 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
            placeholder="질문을 입력하세요"
          />
        </div>

        {(question.type === "single" || question.type === "multiple") && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-[#6B7280]">
                선택지
              </label>
              <button
                onClick={handleAddOption}
                className="text-xs text-[#3B82F6] hover:underline"
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
                    onChange={(e) => handleUpdateOption(optIndex, e.target.value)}
                    className="flex-1 px-2 py-1 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
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
            <label className="block text-xs text-[#6B7280] mb-1">
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
              className="w-full px-2 py-1 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
              placeholder="1-5"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => onUpdate({ ...question, required: e.target.checked })}
            className="w-4 h-4"
          />
          <label className="text-xs text-[#1a1a1a]">
            필수 질문
          </label>
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
  const progress = survey.targetCount > 0 
    ? Math.min(100, (survey.responseCount / survey.targetCount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            {survey.title}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1a1a1a]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-[#1a1a1a] mb-2">설명</h3>
            <p className="text-sm text-[#6B7280]">
              {survey.description || "설명 없음"}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#1a1a1a]">응답 현황</h3>
              <span className="text-sm text-[#6B7280]">
                {survey.responseCount} / {survey.targetCount} ({progress.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-3">
              <div
                className="bg-[#3B82F6] h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#1a1a1a] mb-2">질문 목록</h3>
            <div className="space-y-3">
              {survey.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-[#F9FAFB] rounded p-3 text-sm"
                >
                  <div className="font-medium text-[#1a1a1a] mb-1">
                    {index + 1}. {question.question}
                    {question.required && (
                      <span className="text-[#EF4444] ml-1">*</span>
                    )}
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    유형: {question.type === "single" ? "단일선택" : question.type === "multiple" ? "다중선택" : question.type === "text" ? "주관식" : "척도"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-[#1a1a1a] mb-2">
              응답 목록 ({responses.length}개)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.map((response, idx) => (
                <div
                  key={response.id}
                  className="bg-[#F9FAFB] rounded p-3 text-sm"
                >
                  <div className="text-xs text-[#6B7280] mb-2">
                    응답 #{idx + 1} - {new Date(response.submittedAt).toLocaleString("ko-KR")}
                  </div>
                  <div className="space-y-1">
                    {response.responses.map((r, rIdx) => {
                      const question = survey.questions.find((q) => q.id === r.questionId);
                      return (
                        <div key={rIdx} className="text-xs">
                          <span className="font-medium text-[#1a1a1a]">
                            Q: {question?.question || "질문 없음"}
                          </span>
                          <div className="text-[#6B7280] mt-0.5">
                            A: {Array.isArray(r.answer) ? r.answer.join(", ") : r.answer}
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
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

