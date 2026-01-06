// 설문조사 관리 유틸리티 함수

import type { Survey, SurveyResponse } from "@/lib/types/survey";

const SURVEY_STORAGE_KEY = "surveys";
const RESPONSE_STORAGE_KEY = "survey-responses";

export function getSurveys(): Survey[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(SURVEY_STORAGE_KEY);
    if (!data) return [];
    const loaded = JSON.parse(data);
    // 기존 데이터 마이그레이션 (targetType 필드가 없는 경우)
    const migrated = loaded.map((survey: any) => {
      if (!survey.targetType) {
        return {
          ...survey,
          targetType: "all" as const, // 기본값은 전체
        };
      }
      return survey;
    });
    // 마이그레이션된 데이터 저장
    if (migrated.some((s: any, i: number) => !loaded[i]?.targetType)) {
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch (error) {
    console.error("설문조사 데이터 로드 실패:", error);
    return [];
  }
}

export function saveSurvey(survey: Survey): void {
  try {
    const surveys = getSurveys();
    const existingIndex = surveys.findIndex((s) => s.id === survey.id);
    
    if (existingIndex >= 0) {
      surveys[existingIndex] = survey;
    } else {
      surveys.push(survey);
    }
    
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(surveys));
  } catch (error) {
    console.error("설문조사 저장 실패:", error);
    throw error;
  }
}

export function deleteSurvey(id: string): void {
  try {
    const surveys = getSurveys().filter((s) => s.id !== id);
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(surveys));
    
    // 관련 응답도 삭제
    const responses = getSurveyResponses().filter((r) => r.surveyId !== id);
    localStorage.setItem(RESPONSE_STORAGE_KEY, JSON.stringify(responses));
  } catch (error) {
    console.error("설문조사 삭제 실패:", error);
    throw error;
  }
}

export function getSurveyResponses(): SurveyResponse[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(RESPONSE_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("설문 응답 데이터 로드 실패:", error);
    return [];
  }
}

export function saveSurveyResponse(response: SurveyResponse): void {
  try {
    const responses = getSurveyResponses();
    responses.push(response);
    localStorage.setItem(RESPONSE_STORAGE_KEY, JSON.stringify(responses));
    
    // 설문조사 응답 수 업데이트
    const surveys = getSurveys();
    const survey = surveys.find((s) => s.id === response.surveyId);
    if (survey) {
      survey.responseCount = responses.filter((r) => r.surveyId === response.surveyId).length;
      saveSurvey(survey);
    }
  } catch (error) {
    console.error("설문 응답 저장 실패:", error);
    throw error;
  }
}

export function getResponsesBySurvey(surveyId: string): SurveyResponse[] {
  return getSurveyResponses().filter((r) => r.surveyId === surveyId);
}

export function getSurveyStats() {
  const surveys = getSurveys();
  const responses = getSurveyResponses();
  
  const active = surveys.filter((s) => s.status === "active");
  const completed = surveys.filter((s) => s.status === "closed");
  const totalResponses = responses.length;
  
  return {
    total: surveys.length,
    active: active.length,
    completed: completed.length,
    totalResponses,
  };
}

