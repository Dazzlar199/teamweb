"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/lib/context/ToastContext";
import {
  getInterviews,
  saveInterview,
} from "@/lib/utils/interview";
import {
  getSurveys,
} from "@/lib/utils/survey";
import type { Interview } from "@/lib/types/interview";
import type { Survey } from "@/lib/types/survey";
import { TEAM_MEMBER_NAMES } from "@/lib/constants/team";

export default function ResearchPage() {
  const { user } = useUser();
  const { showToast } = useToast();
  const currentUser = user?.name || TEAM_MEMBER_NAMES[0];

  const [activeTab, setActiveTab] = useState<"interviews" | "surveys">("interviews");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setInterviews(await getInterviews());
      setSurveys(await getSurveys());
    };
    loadData();
  }, []);

  const handleAddInterview = async () => {
    const name = prompt("인터뷰 대상자 성함:");
    if (!name) return;

    const interview: Interview = {
      id: `interview-${Date.now()}`,
      type: "couple",
      interviewee: { name, anonymous: false },
      scheduledDate: Date.now(),
      status: "scheduled",
      script: "",
      responses: [],
      painPoints: [],
      quotes: [],
      createdBy: currentUser,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveInterview(interview);
    setInterviews(await getInterviews());
    showToast("인터뷰 일정이 등록되었습니다.", "success");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">고객 검증</h1>
            <p className="text-sm text-slate-500 font-medium">인터뷰와 설문조사를 통해 서비스의 가치를 검증합니다</p>
          </div>
          <button 
            onClick={handleAddInterview}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            새 리서치 추가
          </button>
        </div>

        {/* 탭 내비게이션 */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
          <button 
            onClick={() => setActiveTab("interviews")} 
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === "interviews" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
          >
            심층 인터뷰
          </button>
          <button 
            onClick={() => setActiveTab("surveys")} 
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === "surveys" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
          >
            설문조사
          </button>
        </div>

        {/* 리스트 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
          {activeTab === "interviews" ? (
            interviews.map(item => (
              <div key={item.id} className="glass-card rounded-2xl bg-white p-6 group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.status === 'completed' ? '완료' : '진행중'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                    {item.interviewee.name[0]}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{item.interviewee.name} 고객 인터뷰</h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-6">{item.summary || "인터뷰 내용 요약이 없습니다."}</p>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">{new Date(item.scheduledDate).toLocaleDateString()}</span>
                  <button className="text-[11px] font-black text-indigo-600">상세 보기 →</button>
                </div>
              </div>
            ))
          ) : (
            surveys.map(item => (
              <div key={item.id} className="glass-card rounded-2xl bg-white p-6 group">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-black uppercase">설문</span>
                  <span className="text-[11px] font-bold text-slate-400">응답 {item.responseCount}명</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-6 mb-2 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${(item.responseCount / (item.targetCount || 100)) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>진행률</span>
                  <span>목표: {item.targetCount || 100}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
