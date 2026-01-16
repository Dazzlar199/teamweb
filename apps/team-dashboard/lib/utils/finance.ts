// NCA 지출 내역 DB 연동 유틸리티

import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { addNotification } from "./notifications";
import { TEAM_MEMBER_NAMES } from "@/lib/constants/team";

export interface NCAExpenditure {
  id: string;
  bimok: string;
  item_name: string;
  specification: string;
  quantity: number;
  unit: string;
  unit_price: number;
  currency: string;
  amount_in_krw: number;
  vendor: string;
  date: string;
  description: string;
  evidence_status: string;
  type: string;
}

export async function getExpenditures(): Promise<NCAExpenditure[]> {
  if (!isSupabaseConfigured()) {
    return JSON.parse(localStorage.getItem("nca-expenditures") || "[]");
  }

  try {
    const { data, error } = await supabase
      .from("nca_expenditures")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.warn("Supabase 지출 내역 로드 실패, 로컬 데이터 사용:", error.message);
      return JSON.parse(localStorage.getItem("nca-expenditures") || "[]");
    }
    return data || [];
  } catch (e) {
    return JSON.parse(localStorage.getItem("nca-expenditures") || "[]");
  }
}

export async function saveExpenditure(exp: NCAExpenditure, userName: string): Promise<boolean> {
  // 로컬 스토리지 선저장 (안정성 보장)
  const local = JSON.parse(localStorage.getItem("nca-expenditures") || "[]");
  localStorage.setItem("nca-expenditures", JSON.stringify([exp, ...local]));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("nca_expenditures").insert([exp]);
      if (error) throw error;
      
      // 팀원들에게 실시간 알림 전송 (정정된 명단)
      await addNotification({
        type: 'finance',
        title: '새로운 지출 등록',
        message: `${userName}님이 ${exp.item_name} (${exp.amount_in_krw.toLocaleString()}원) 내역을 등록했습니다.`,
        link: '/finance'
      }, [...TEAM_MEMBER_NAMES].filter(u => u !== userName));

      return true;
    } catch (e) {
      console.error("DB 동기화 실패:", e);
      return true; // 로컬엔 저장되었으므로 true 리턴
    }
  }
  return true;
}

export async function deleteExpenditure(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from("nca_expenditures").delete().eq("id", id);
  } else {
    const local = JSON.parse(localStorage.getItem("nca-expenditures") || "[]");
    localStorage.setItem("nca-expenditures", JSON.stringify(local.filter((e: any) => e.id !== id)));
  }
}

export async function updateExpenditureStatus(id: string, status: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from("nca_expenditures").update({ evidence_status: status }).eq("id", id);
  }
}
