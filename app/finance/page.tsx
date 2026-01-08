"use client";

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/lib/context/ToastContext";
import { useUser } from "@/lib/context/UserContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getExpenditures, saveExpenditure, deleteExpenditure, updateExpenditureStatus, NCAExpenditure } from "@/lib/utils/finance";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

// --- Types ---
type NCABimok = "전문가활용비" | "임차비" | "재료구입비" | "외주용역비";
type EvidenceStatus = "미첨부" | "검토중" | "완료";
type Currency = "KRW" | "USD";

export default function FinancePage() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "excel">("overview");
  const [expenditures, setExpenditures] = useState<NCAExpenditure[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1350);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"일반" | "구독">("일반");
  const [newExp, setNewExp] = useState<Partial<NCAExpenditure>>({
    bimok: "재료구입비", item_name: "", specification: "N/A", quantity: 1, unit: "EA", unit_price: 0, currency: "KRW", vendor: "", description: "", evidence_status: "미첨부"
  });

  const ncaGrant = { max: 20000000 };
  const deadline = new Date("2026-06-12");

  // --- Real-time Sync & Init ---
  useEffect(() => {
    loadInitialData();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('finance-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nca_expenditures' }, () => {
          loadInitialData(); // 실시간 변경 시 데이터 다시 로드
        })
        .subscribe();
      return () => { channel.unsubscribe(); };
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const data = await getExpenditures();
      setExpenditures(data || []);
    } catch (e) {
      console.warn("데이터 로드 중 오류 발생, 로컬 저장소를 확인합니다.");
    }
    const savedRate = localStorage.getItem("finance-exchange-rate");
    if (savedRate) setExchangeRate(parseFloat(savedRate));
  };

  const fetchRealTimeRate = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      const newRate = Math.round(data.rates.KRW);
      setExchangeRate(newRate);
      localStorage.setItem("finance-exchange-rate", newRate.toString());
      showToast(`최신 환율(₩${newRate.toLocaleString()}) 적용 완료`, "success");
    } catch (e) {
      showToast("환율 연동 실패", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/templates/nca_template.xlsx");
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const sheet = workbook.getWorksheet("세부집행계획") || workbook.worksheets[1]; 
      
      let startRow = 6;
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => { if (cell.value?.toString().includes("품명")) startRow = rowNumber + 1; });
      });

      expenditures.forEach((e, index) => {
        const r = startRow + index;
        sheet.getCell(`B${r}`).value = e.bimok;
        sheet.getCell(`C${r}`).value = e.item_name;
        sheet.getCell(`D${r}`).value = e.specification;
        sheet.getCell(`E${r}`).value = e.quantity;
        sheet.getCell(`F${r}`).value = e.unit;
        sheet.getCell(`G${r}`).value = Math.round(e.amount_in_krw / e.quantity);
        sheet.getCell(`H${r}`).value = e.amount_in_krw;
        sheet.getCell(`I${r}`).value = e.vendor;
        sheet.getCell(`J${r}`).value = e.description;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `NCA_사용계획서_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast("엑셀 파일이 다운로드되었습니다.", "success");
    } catch (error) {
      showToast("엑셀 생성 실패", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const totalSpent = useMemo(() => expenditures.reduce((sum, e) => sum + e.amount_in_krw, 0), [expenditures, exchangeRate]);
  const formatCurrency = (val: number) => new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(val);

  const handleAddExpenditure = async () => {
    if (!newExp.item_name || !newExp.unit_price) return;
    const total = (newExp.quantity || 1) * (newExp.unit_price || 0);
    const amount_in_krw = newExp.currency === "KRW" ? total : total * exchangeRate;
    
    const exp: NCAExpenditure = {
      ...newExp,
      id: `nca-${Date.now()}`,
      type: addType,
      bimok: addType === "구독" ? "임차비" : (newExp.bimok as NCABimok),
      unit_price: newExp.unit_price,
      amount_in_krw,
      date: newExp.date || new Date().toISOString().split("T")[0],
    } as NCAExpenditure;

    const success = await saveExpenditure(exp, user?.name || "김찬주");
    if (success) {
      setShowAddModal(false);
      showToast("집행 내역이 등록되고 팀원들에게 알림이 전송되었습니다.", "success");
      loadInitialData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("삭제하시겠습니까?")) {
      await deleteExpenditure(id);
      loadInitialData();
      showToast("삭제 완료", "info");
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "미첨부" ? "검토중" : current === "검토중" ? "완료" : "미첨부";
    await updateExpenditureStatus(id, next);
    loadInitialData();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">재무 관리 (팀 실시간 공유)</h1>
            <p className="text-sm text-slate-500 font-medium">NCA 창작지원금 실시간 집행 내역 및 팀 알림 시스템</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase px-2">USD 환율</span>
              <div className="flex items-center gap-2">
                <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value))} className="w-16 text-sm font-black text-indigo-600 bg-slate-50 rounded-lg py-1 text-center outline-none" />
                <button onClick={fetchRealTimeRate} className={`p-1.5 rounded-lg hover:bg-slate-100 ${isRefreshing ? "animate-spin text-slate-300" : "text-indigo-600"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 대시보드 카드 */}
        <div className="glass-card rounded-3xl bg-white p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">누적 집행액 (팀 전체)</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(totalSpent)}
                <span className="text-xl text-slate-300 ml-2">/ {formatCurrency(ncaGrant.max)}</span>
              </h2>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                집행률 {Math.round((totalSpent / ncaGrant.max) * 100)}%
              </span>
            </div>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-100" style={{ width: `${Math.min((totalSpent / ncaGrant.max) * 100, 100)}%` }} />
          </div>
        </div>

        {/* 탭 내비게이션 */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
          <button onClick={() => setActiveTab("overview")} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "overview" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>집행 개요</button>
          <button onClick={() => setActiveTab("subscriptions")} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "subscriptions" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>정기 구독</button>
          <button onClick={() => setActiveTab("excel")} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "excel" ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>엑셀 데이터</button>
        </div>

        <div className="animate-slide-in">
          {activeTab === "overview" || activeTab === "subscriptions" ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 font-sans">
                <h3 className="text-sm font-black text-slate-900">{activeTab === "overview" ? "전체 집행 내역" : "구독 내역"}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setAddType("구독"); setShowAddModal(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[11px] font-black rounded-xl hover:bg-indigo-100">+ 구독 추가</button>
                  <button onClick={() => { setAddType("일반"); setShowAddModal(true); }} className="px-4 py-2 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-slate-800">+ 지출 등록</button>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {expenditures.filter(e => activeTab === "overview" ? true : e.type === "구독").map(e => (
                  <div key={e.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="text-center min-w-[45px]">
                        <p className="text-[10px] font-black text-slate-300">{new Date(e.date).getMonth()+1}월</p>
                        <p className="text-base font-black text-slate-900">{new Date(e.date).getDate()}</p>
                      </div>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${e.type === '구독' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                        {e.type === '구독' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1c-1.11 0-2.08.402-2.599 1M12 8v1m0 11c1.11 0 2.08-.402 2.599-1M12 20v1m0-1c-1.11 0-2.08-.402-2.599-1M12 20v-1m9-4a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{e.item_name}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-black uppercase">{e.bimok}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">{e.vendor} • {e.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className={`text-sm font-black ${e.type === '구독' ? 'text-indigo-600' : 'text-slate-900'}`}>- {formatCurrency(e.amount_in_krw)}</p>
                        <button onClick={() => handleDelete(e.id)} className="text-[9px] font-bold text-rose-400 opacity-0 group-hover:opacity-100 transition-all uppercase">Delete</button>
                      </div>
                      <button onClick={() => toggleStatus(e.id, e.evidence_status)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${e.evidence_status === '완료' ? 'bg-emerald-50 text-emerald-600' : e.evidence_status === '검토중' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                        {e.evidence_status}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 font-sans">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-slate-900">사용계획서 엑셀 변환</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">DB의 실시간 데이터를 NCA 공식 양식에 채워 넣습니다.</p>
                </div>
                <button 
                  onClick={handleExportExcel}
                  disabled={isExporting || expenditures.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                >
                  {isExporting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  {isExporting ? "생성 중..." : "공식 사용계획서 다운로드"}
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">비목</th>
                      <th className="px-6 py-4">품명</th>
                      <th className="px-6 py-4 text-right">단가</th>
                      <th className="px-6 py-4 text-center">수량</th>
                      <th className="px-6 py-4 text-right">총액(원)</th>
                      <th className="px-6 py-4">지급처</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenditures.map(e => (
                      <tr key={e.id} className="text-xs hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-indigo-600">{e.bimok}</td>
                        <td className="px-6 py-4 font-black text-slate-900">{e.item_name}</td>
                        <td className="px-6 py-4 text-right text-slate-500 font-medium">₩{Math.round(e.amount_in_krw/e.quantity).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center font-bold">{e.quantity}{e.unit}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">₩{e.amount_in_krw.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-500">{e.vendor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 지출/구독 등록 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-in">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900">NCA {addType === "구독" ? "SaaS 구독" : "지출 내역"} 등록</h2>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">✕</button>
              </div>
              <div className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">공식 비목</label>
                    <select disabled={addType === "구독"} value={addType === "구독" ? "임차비" : newExp.bimok} onChange={(e) => setNewExp({...newExp, bimok: e.target.value as any})} className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="전문가활용비">전문가활용비</option>
                      <option value="임차비">임차비</option>
                      <option value="재료구입비">재료구입비</option>
                      <option value="외주용역비">외주용역비</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">품명 (엑셀용)</label>
                    <input type="text" value={newExp.item_name} onChange={(e) => setNewExp({...newExp, item_name: e.target.value})} placeholder="품명 입력" className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">규격/상세</label>
                    <input type="text" value={newExp.specification} onChange={(e) => setNewExp({...newExp, specification: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">수량</label>
                    <input type="number" value={newExp.quantity} onChange={(e) => setNewExp({...newExp, quantity: Number(e.target.value)})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">단위</label>
                    <input type="text" value={newExp.unit} onChange={(e) => setNewExp({...newExp, unit: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">단가</label>
                    <div className="relative">
                      <input type="number" value={newExp.unit_price || ""} onChange={(e) => setNewExp({...newExp, unit_price: Number(e.target.value)})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-black outline-none" />
                      <select value={newExp.currency} onChange={(e) => setNewExp({...newExp, currency: e.target.value as Currency})} className="absolute right-3 top-2 text-[10px] font-bold bg-white border px-2 py-1 rounded-lg">
                        <option value="KRW">KRW</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">지급처/성명</label>
                    <input type="text" value={newExp.vendor} onChange={(e) => setNewExp({...newExp, vendor: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                  </div>
                </div>
                <textarea rows={3} value={newExp.description} onChange={(e) => setNewExp({...newExp, description: e.target.value})} placeholder="사용 사유 기록" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="p-8 bg-slate-50 flex gap-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-sm font-black text-slate-500 uppercase">Cancel</button>
                <button onClick={handleAddExpenditure} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]">Register & Notify Team</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
