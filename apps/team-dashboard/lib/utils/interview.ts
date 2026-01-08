// 인터뷰 관리 유틸리티 함수

import type { Interview, InterviewType, InterviewStatus } from "@/lib/types/interview";

const STORAGE_KEY = "interviews";

export function getInterviews(): Interview[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("인터뷰 데이터 로드 실패:", error);
    return [];
  }
}

export function saveInterview(interview: Interview): void {
  try {
    const interviews = getInterviews();
    const existingIndex = interviews.findIndex((i) => i.id === interview.id);
    
    if (existingIndex >= 0) {
      interviews[existingIndex] = interview;
    } else {
      interviews.push(interview);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
  } catch (error) {
    console.error("인터뷰 저장 실패:", error);
    throw error;
  }
}

export function deleteInterview(id: string): void {
  try {
    const interviews = getInterviews().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
  } catch (error) {
    console.error("인터뷰 삭제 실패:", error);
    throw error;
  }
}

export function getInterviewsByType(type: InterviewType): Interview[] {
  return getInterviews().filter((i) => i.type === type);
}

export function getInterviewsByStatus(status: InterviewStatus): Interview[] {
  return getInterviews().filter((i) => i.status === status);
}

export function getInterviewStats() {
  const interviews = getInterviews();
  const coupleInterviews = interviews.filter((i) => i.type === "couple");
  const freelancerInterviews = interviews.filter((i) => i.type === "freelancer");
  const completed = interviews.filter((i) => i.status === "completed");
  const scheduled = interviews.filter((i) => i.status === "scheduled");
  
  const painPoints = interviews
    .filter((i) => i.status === "completed")
    .flatMap((i) => i.painPoints);
  
  const quotes = interviews
    .filter((i) => i.status === "completed")
    .flatMap((i) => i.quotes);
  
  return {
    total: interviews.length,
    couple: coupleInterviews.length,
    freelancer: freelancerInterviews.length,
    completed: completed.length,
    scheduled: scheduled.length,
    painPoints: painPoints.length,
    quotes: quotes.length,
  };
}

