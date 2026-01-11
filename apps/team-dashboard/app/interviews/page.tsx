"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/context/UserContext";
import { handleError } from "@/lib/utils/errorHandler";
import {
  getInterviews,
  saveInterview,
  deleteInterview,
  getInterviewStats,
  getInterviewsByType,
} from "@/lib/utils/interview";
import type { Interview, InterviewType, InterviewStatus } from "@/lib/types/interview";

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

export default function InterviewsPage() {
  const { user } = useUser();
  const currentUser = user?.name || "김찬주";
  
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filterType, setFilterType] = useState<InterviewType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<InterviewStatus | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [stats, setStats] = useState(getInterviewStats());
  
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

  const loadInterviews = () => {
    try {
      const loaded = getInterviews();
      setInterviews(loaded);
      
      const upcoming = loaded.filter(i => i.status === 'scheduled');
      const completed = loaded.filter(i => i.status === 'completed');
      
      setStats({
        total: loaded.length,
        upcoming: upcoming.length,
        completed: completed.length,
        insightCount: loaded.reduce((acc, curr) => acc + (curr.painPoints?.length || 0), 0)
      });
    } catch (e) {
      console.error("인터뷰 로드 실패:", e);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

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
      setShowAddForm(false);
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
        component: "InterviewsPage",
        action: "인터뷰 추가",
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
        component: "InterviewsPage",
        action: "인터뷰 삭제",
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
        component: "InterviewsPage",
        action: "인터뷰 업데이트",
      });
    }
  };

  const filteredInterviews = interviews.filter((interview) => {
    if (filterType !== "all" && interview.type !== filterType) return false;
    if (filterStatus !== "all" && interview.status !== filterStatus) return false;
    return true;
  });

  const handleTypeChange = (type: InterviewType) => {
    setNewInterview({
      ...newInterview,
      type,
      script: type === "couple" ? COUPLE_INTERVIEW_SCRIPT : FREELANCER_INTERVIEW_SCRIPT,
    });
  };

  return (
    <div className="p-6 ml-64">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
            인터뷰 관리
          </h1>
          <p className="text-sm text-[#6B7280]">
            예비부부 및 프리랜서 인터뷰를 체계적으로 관리하고 분석합니다
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">전체 인터뷰</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">예비부부</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.couple}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">프리랜서</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.freelancer}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <div className="text-sm text-[#6B7280] mb-1">완료</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {stats.completed}
            </div>
          </div>
        </div>

        {/* 필터 및 추가 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as InterviewType | "all")}
              className="px-3 py-2 bg-white border border-[#E2E8F0] rounded text-sm text-[#1a1a1a]"
            >
              <option value="all">전체 타입</option>
              <option value="couple">예비부부</option>
              <option value="freelancer">프리랜서</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InterviewStatus | "all")}
              className="px-3 py-2 bg-white border border-[#E2E8F0] rounded text-sm text-[#1a1a1a]"
            >
              <option value="all">전체 상태</option>
              <option value="scheduled">예정</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
          >
            + 인터뷰 추가
          </button>
        </div>

        {/* 인터뷰 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredInterviews.map((interview) => {
            const scheduledDate = new Date(interview.scheduledDate);
            const statusColors = {
              scheduled: "bg-blue-100 text-blue-800",
              completed: "bg-[#10B981] text-white",
              cancelled: "bg-[#6B7280] text-white",
            };

            return (
              <div
                key={interview.id}
                onClick={() => setSelectedInterview(interview)}
                className="bg-white rounded-lg border border-[#E2E8F0] p-4 cursor-pointer hover:border-[#1a1a1a] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-[#1a1a1a] mb-1">
                      {interview.interviewee.anonymous
                        ? "익명"
                        : interview.interviewee.name || "이름 없음"}
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {interview.type === "couple" ? "예비부부" : "프리랜서"}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusColors[interview.status]}`}
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
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span>페인포인트: {interview.painPoints.length}개</span>
                    <span>인용구: {interview.quotes.length}개</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredInterviews.length === 0 && (
          <div className="text-center py-12 text-[#6B7280]">
            인터뷰가 없습니다. 인터뷰를 추가해주세요.
          </div>
        )}

        {/* 인터뷰 추가 모달 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">
                인터뷰 추가
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    인터뷰 타입
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleTypeChange("couple")}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        newInterview.type === "couple"
                          ? "bg-[#1a1a1a] text-white"
                          : "bg-[#F5F5F5] text-[#1a1a1a]"
                      }`}
                    >
                      예비부부
                    </button>
                    <button
                      onClick={() => handleTypeChange("freelancer")}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        newInterview.type === "freelancer"
                          ? "bg-[#1a1a1a] text-white"
                          : "bg-[#F5F5F5] text-[#1a1a1a]"
                      }`}
                    >
                      프리랜서
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    인터뷰 대상자 이름
                  </label>
                  <input
                    type="text"
                    value={newInterview.interviewee.name}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        interviewee: { ...newInterview.interviewee, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      나이 (선택)
                    </label>
                    <input
                      type="number"
                      value={newInterview.interviewee.age || ""}
                      onChange={(e) =>
                        setNewInterview({
                          ...newInterview,
                          interviewee: {
                            ...newInterview.interviewee,
                            age: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
                      placeholder="나이"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      지역 (선택)
                    </label>
                    <input
                      type="text"
                      value={newInterview.interviewee.region}
                      onChange={(e) =>
                        setNewInterview({
                          ...newInterview,
                          interviewee: { ...newInterview.interviewee, region: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
                      placeholder="지역"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    연락처 (선택)
                  </label>
                  <input
                    type="text"
                    value={newInterview.interviewee.contact}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        interviewee: { ...newInterview.interviewee, contact: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
                    placeholder="연락처"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newInterview.interviewee.anonymous}
                    onChange={(e) =>
                      setNewInterview({
                        ...newInterview,
                        interviewee: { ...newInterview.interviewee, anonymous: e.target.checked },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-[#1a1a1a]">
                    익명 처리
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      예정일
                    </label>
                    <input
                      type="date"
                      value={newInterview.scheduledDate}
                      onChange={(e) =>
                        setNewInterview({ ...newInterview, scheduledDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      예정 시간
                    </label>
                    <input
                      type="time"
                      value={newInterview.scheduledTime}
                      onChange={(e) =>
                        setNewInterview({ ...newInterview, scheduledTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[#F5F5F5] text-[#1a1a1a] rounded text-sm font-medium hover:bg-[#E5E5E5] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddInterview}
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
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
      </div>
    </div>
  );
}

// 인터뷰 상세 모달 컴포넌트
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
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            인터뷰 상세
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1a1a1a]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="font-semibold text-[#1a1a1a] mb-2">기본 정보</h3>
            <div className="bg-[#F9FAFB] rounded p-4 space-y-2 text-sm">
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
            <h3 className="font-semibold text-[#1a1a1a] mb-2">인터뷰 스크립트</h3>
            <div className="bg-[#F9FAFB] rounded p-4">
              <pre className="text-sm text-[#1a1a1a] whitespace-pre-wrap">
                {interview.script}
              </pre>
            </div>
          </div>

          {/* 응답 추가 */}
          {interview.status === "completed" && (
            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-2">응답 추가</h3>
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={newResponse.question}
                  onChange={(e) => setNewResponse({ ...newResponse, question: e.target.value })}
                  placeholder="질문"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
                />
                <textarea
                  value={newResponse.answer}
                  onChange={(e) => setNewResponse({ ...newResponse, answer: e.target.value })}
                  placeholder="답변"
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
                />
                <button
                  onClick={handleAddResponse}
                  className="px-3 py-1 bg-[#1a1a1a] text-white rounded text-sm"
                >
                  응답 추가
                </button>
              </div>
            </div>
          )}

          {/* 응답 목록 */}
          {editedInterview.responses.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-2">응답 목록</h3>
              <div className="space-y-3">
                {editedInterview.responses.map((response, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F9FAFB] rounded p-3 text-sm"
                  >
                    <div className="font-medium text-[#1a1a1a] mb-1">
                      Q: {response.question}
                    </div>
                    <div className="text-[#6B7280]">
                      A: {response.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 페인포인트 */}
          <div>
            <h3 className="font-semibold text-[#1a1a1a] mb-2">페인포인트</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPainPoint}
                onChange={(e) => setNewPainPoint(e.target.value)}
                placeholder="페인포인트 추가"
                className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
              />
              <button
                onClick={handleAddPainPoint}
                className="px-3 py-2 bg-[#1a1a1a] text-white rounded text-sm"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedInterview.painPoints.map((point, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-[#FEF2F2] text-[#991B1B] rounded text-sm"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>

          {/* 인용구 */}
          <div>
            <h3 className="font-semibold text-[#1a1a1a] mb-2">인용구</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="인용구 추가"
                className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
              />
              <button
                onClick={handleAddQuote}
                className="px-3 py-2 bg-[#1a1a1a] text-white rounded text-sm"
              >
                추가
              </button>
            </div>
            <div className="space-y-2">
              {editedInterview.quotes.map((quote, idx) => (
                <div
                  key={idx}
                  className="bg-[#EFF6FF] rounded p-3 text-sm italic text-[#1E40AF]"
                >
                  "{quote}"
                </div>
              ))}
            </div>
          </div>

          {/* 요약 */}
          <div>
            <h3 className="font-semibold text-[#1a1a1a] mb-2">요약</h3>
            <textarea
              value={editedInterview.summary || ""}
              onChange={(e) =>
                setEditedInterview({ ...editedInterview, summary: e.target.value })
              }
              placeholder="인터뷰 요약을 작성하세요"
              rows={4}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded bg-white text-[#1a1a1a] text-sm"
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
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded text-sm font-medium hover:bg-[#2d2d2d] transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

