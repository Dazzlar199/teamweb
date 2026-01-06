"use client";

import { useState, useEffect } from "react";

interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number; // 원래 금액
  currency: "KRW" | "USD" | "EUR" | "JPY"; // 통화
  exchangeRate?: number; // 환율 (USD 기준, 예: 1 USD = 1300 KRW)
  amountInKRW: number; // 원화로 변환된 금액
  billingCycle: "monthly" | "yearly" | "one-time";
  startDate: string;
  nextBillingDate?: string;
  status: "active" | "cancelled" | "expired";
  description?: string;
}

interface Purchase {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  paymentMethod: string;
  description?: string;
  receipt?: string;
}

interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  period: string;
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "subscriptions" | "purchases" | "budgets"
  >("overview");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1300); // 기본 환율 (1 USD = 1300 KRW)
  const [newSubscription, setNewSubscription] = useState({
    name: "",
    category: "",
    amount: "",
    currency: "KRW" as Subscription["currency"],
    billingCycle: "monthly" as Subscription["billingCycle"],
    startDate: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [newPurchase, setNewPurchase] = useState({
    name: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    paymentMethod: "",
    description: "",
  });

  // 아카데미 지원금 정보
  const academyGrant = {
    maxAmount: 20000000, // 2000만원
    usedAmount: 0,
    availableAmount: 20000000,
  };

  // 데이터 로드
  useEffect(() => {
    loadData();
    loadExchangeRate();
  }, []);

  // 환율 로드
  const loadExchangeRate = () => {
    const saved = localStorage.getItem("finance-exchange-rate");
    if (saved) {
      try {
        setExchangeRate(parseFloat(saved));
      } catch (e) {
        console.error("환율 로드 실패:", e);
      }
    }
  };

  // 환율 저장
  const saveExchangeRate = (rate: number) => {
    setExchangeRate(rate);
    localStorage.setItem("finance-exchange-rate", rate.toString());

    // 환율이 변경되면 기존 구독의 원화 금액도 업데이트
    const updated = subscriptions.map((sub) => {
      if (sub.currency !== "KRW") {
        return {
          ...sub,
          amountInKRW: convertToKRW(sub.amount, sub.currency),
          exchangeRate: rate,
        };
      }
      return sub;
    });
    setSubscriptions(updated);
    localStorage.setItem("finance-subscriptions", JSON.stringify(updated));
  };

  // 환율 적용하여 원화로 변환
  const convertToKRW = (
    amount: number,
    currency: Subscription["currency"],
    rate?: number
  ): number => {
    const currentRate = rate || exchangeRate;
    if (currency === "KRW") return amount;
    if (currency === "USD") return amount * currentRate;
    if (currency === "EUR") return amount * (currentRate * 1.1); // EUR는 USD 대비 약 1.1배 가정
    if (currency === "JPY") return amount * (currentRate / 100); // JPY는 USD 대비 약 1/100 가정
    return amount;
  };

  const loadData = () => {
    // 구독 로드
    const savedSubscriptions = localStorage.getItem("finance-subscriptions");
    if (savedSubscriptions) {
      try {
        const loaded = JSON.parse(savedSubscriptions);
        // 기존 데이터 마이그레이션 (currency 필드가 없는 경우)
        const migrated = loaded.map((sub: any) => {
          if (!sub.currency) {
            // 기존 데이터는 모두 KRW로 간주
            return {
              ...sub,
              currency: "KRW" as const,
              amountInKRW: sub.amount || 0,
              exchangeRate: undefined,
            };
          }
          // 환율이 변경되었을 수 있으므로 원화 금액 재계산
          if (sub.currency !== "KRW") {
            const currentRate = sub.exchangeRate || exchangeRate;
            return {
              ...sub,
              amountInKRW: convertToKRW(sub.amount, sub.currency),
              exchangeRate: currentRate,
            };
          }
          return sub;
        });
        setSubscriptions(migrated);
        // 마이그레이션된 데이터 저장
        localStorage.setItem("finance-subscriptions", JSON.stringify(migrated));
      } catch (e) {
        console.error("구독 로드 실패:", e);
      }
    }

    // 구매 로드
    const savedPurchases = localStorage.getItem("finance-purchases");
    if (savedPurchases) {
      try {
        setPurchases(JSON.parse(savedPurchases));
      } catch (e) {
        console.error("구매 로드 실패:", e);
      }
    }

    // 예산 로드
    const savedBudgets = localStorage.getItem("finance-budgets");
    if (savedBudgets) {
      try {
        setBudgets(JSON.parse(savedBudgets));
      } catch (e) {
        console.error("예산 로드 실패:", e);
      }
    }
  };

  // 통계 계산 (모두 원화로 변환)
  const monthlySubscriptions = subscriptions
    .filter((s) => s.status === "active" && s.billingCycle === "monthly")
    .reduce((sum, s) => sum + s.amountInKRW, 0);

  const yearlySubscriptions = subscriptions
    .filter((s) => s.status === "active" && s.billingCycle === "yearly")
    .reduce((sum, s) => sum + s.amountInKRW, 0);

  const thisMonthPurchases = purchases
    .filter((p) => {
      const purchaseDate = new Date(p.date);
      const now = new Date();
      return (
        purchaseDate.getMonth() === now.getMonth() &&
        purchaseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const totalSpent = monthlySubscriptions + thisMonthPurchases;
  const remainingBudget = academyGrant.availableAmount - totalSpent;

  // 구독 추가
  const handleAddSubscription = () => {
    if (!newSubscription.name || !newSubscription.amount) return;

    const amount = parseFloat(newSubscription.amount);
    const amountInKRW = convertToKRW(amount, newSubscription.currency);

    const subscription: Subscription = {
      id: `sub-${Date.now()}`,
      name: newSubscription.name,
      category: newSubscription.category,
      amount: amount,
      currency: newSubscription.currency,
      exchangeRate:
        newSubscription.currency !== "KRW" ? exchangeRate : undefined,
      amountInKRW: amountInKRW,
      billingCycle: newSubscription.billingCycle,
      startDate: newSubscription.startDate,
      nextBillingDate:
        newSubscription.billingCycle === "monthly"
          ? new Date(
              new Date(newSubscription.startDate).setMonth(
                new Date(newSubscription.startDate).getMonth() + 1
              )
            )
              .toISOString()
              .split("T")[0]
          : newSubscription.billingCycle === "yearly"
          ? new Date(
              new Date(newSubscription.startDate).setFullYear(
                new Date(newSubscription.startDate).getFullYear() + 1
              )
            )
              .toISOString()
              .split("T")[0]
          : undefined,
      status: "active",
      description: newSubscription.description,
    };

    const updated = [subscription, ...subscriptions];
    setSubscriptions(updated);
    localStorage.setItem("finance-subscriptions", JSON.stringify(updated));

    setNewSubscription({
      name: "",
      category: "",
      amount: "",
      currency: "KRW",
      billingCycle: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setShowAddSubscription(false);
  };

  // 구매 추가
  const handleAddPurchase = () => {
    if (!newPurchase.name || !newPurchase.amount) return;

    const purchase: Purchase = {
      id: `purchase-${Date.now()}`,
      name: newPurchase.name,
      category: newPurchase.category,
      amount: parseInt(newPurchase.amount),
      date: newPurchase.date,
      vendor: newPurchase.vendor,
      paymentMethod: newPurchase.paymentMethod,
      description: newPurchase.description,
    };

    const updated = [purchase, ...purchases];
    setPurchases(updated);
    localStorage.setItem("finance-purchases", JSON.stringify(updated));

    setNewPurchase({
      name: "",
      category: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      vendor: "",
      paymentMethod: "",
      description: "",
    });
    setShowAddPurchase(false);
  };

  // 구독 삭제
  const handleDeleteSubscription = (id: string) => {
    const updated = subscriptions.filter((s) => s.id !== id);
    setSubscriptions(updated);
    localStorage.setItem("finance-subscriptions", JSON.stringify(updated));
  };

  // 구매 삭제
  const handleDeletePurchase = (id: string) => {
    const updated = purchases.filter((p) => p.id !== id);
    setPurchases(updated);
    localStorage.setItem("finance-purchases", JSON.stringify(updated));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* 헤더 */}
      <header className="bg-white">
        <div className="px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#111827]">
                재무 관리
              </h1>
              <p className="text-xs text-[#6B7280]">
                아카데미 지원금 및 지출 관리
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 환율 설정 */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-[#111827]">
                  USD 환율 (1 USD = ? KRW)
                </label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) =>
                    saveExchangeRate(parseFloat(e.target.value) || 1300)
                  }
                  className="w-32 px-3 py-2 border border-[#D1D5DB] rounded text-sm"
                  step="0.01"
                />
              </div>
              <div className="text-sm text-[#6B7280]">
                <button
                  onClick={async () => {
                    try {
                      // 간단한 환율 API 호출 (무료 API 사용)
                      const response = await fetch(
                        "https://api.exchangerate-api.com/v4/latest/USD"
                      );
                      const data = await response.json();
                      if (data.rates && data.rates.KRW) {
                        saveExchangeRate(data.rates.KRW);
                      }
                    } catch (error) {
                      console.error("환율 조회 실패:", error);
                      alert(
                        "환율을 자동으로 가져올 수 없습니다. 수동으로 입력해주세요."
                      );
                    }
                  }}
                  className="px-3 py-1 bg-[#2563EB] text-white text-sm font-medium rounded hover:bg-[#1D4ED8] transition-colors"
                >
                  실시간 환율 가져오기
                </button>
              </div>
            </div>
          </div>

          {/* 아카데미 지원금 카드 */}
          <div className="bg-gradient-to-br from-[#E5E7EB] to-[#F3F4F6] rounded-lg border border-[#D1D5DB] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold mb-1 text-[#111827]">
                  아카데미 지원금
                </h2>
                <p className="text-sm text-[#6B7280]">최대 지원금액</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#111827]">
                  {formatCurrency(academyGrant.maxAmount)}
                </div>
                <div className="text-sm text-[#6B7280]">최대 2,000만원</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-[#6B7280]">사용 금액</span>
                <span className="font-semibold text-[#111827]">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-3 mb-2 border border-[#D1D5DB]">
                <div
                  className="bg-[#9CA3AF] h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (totalSpent / academyGrant.maxAmount) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">잔여 금액</span>
                <span className="font-bold text-lg text-[#111827]">
                  {formatCurrency(remainingBudget)}
                </span>
              </div>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#6B7280]">
                  월간 구독료
                </span>
                <svg
                  className="w-4 h-4 text-[#6B7280]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-semibold text-[#111827]">
                {formatCurrency(monthlySubscriptions)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#6B7280]">
                  이번 달 구매
                </span>
                <svg
                  className="w-4 h-4 text-[#6B7280]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.4 2.925-6.75a6.324 6.324 0 00-1.087-.835l-.383-1.437M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-semibold text-[#111827]">
                {formatCurrency(thisMonthPurchases)}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#6B7280]">
                  총 지출
                </span>
                <svg
                  className="w-4 h-4 text-[#6B7280]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-2xl font-semibold text-[#111827]">
                {formatCurrency(totalSpent)}
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="mb-6 flex gap-2 border-b border-[#E2E8F0]">
            {[
              { id: "overview", label: "개요" },
              { id: "subscriptions", label: "구독목록" },
              { id: "purchases", label: "구매목록" },
              { id: "budgets", label: "예산 관리" },
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

          {/* 구독목록 탭 */}
          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#111827]">
                  구독목록
                </h2>
                <button
                  onClick={() => setShowAddSubscription(true)}
                  className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
                >
                  구독 추가
                </button>
              </div>

              {subscriptions.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
                  <p className="text-sm text-[#6B7280]">
                    등록된 구독이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white rounded-lg border border-[#E5E7EB] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-[#111827]">
                              {sub.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                sub.status === "active"
                                  ? "bg-[#10B981] text-white"
                                  : "bg-[#6B7280] text-white"
                              }`}
                            >
                              {sub.status === "active" ? "활성" : "취소됨"}
                            </span>
                          </div>
                          <div className="text-sm text-[#6B7280] space-y-1">
                            <div>
                              <span className="font-medium text-[#111827]">
                                금액:{" "}
                              </span>
                              <span className="font-semibold text-[#111827]">
                                {sub.currency !== "KRW" && (
                                  <span className="text-xs mr-1">
                                    {sub.amount} {sub.currency} ={" "}
                                  </span>
                                )}
                                {formatCurrency(sub.amountInKRW)}
                              </span>
                              {sub.billingCycle === "monthly" && " /월"}
                              {sub.billingCycle === "yearly" && " /년"}
                              {sub.currency !== "KRW" && sub.exchangeRate && (
                                <span className="text-xs ml-1 text-[#9CA3AF]">
                                  (환율: 1 {sub.currency} ={" "}
                                  {sub.exchangeRate.toLocaleString()} KRW)
                                </span>
                              )}
                            </div>
                            {sub.category && (
                              <div>
                                <span className="font-medium text-[#111827]">
                                  카테고리:{" "}
                                </span>
                                {sub.category}
                              </div>
                            )}
                            {sub.nextBillingDate && (
                              <div>
                                <span className="font-medium text-[#111827]">
                                  다음 결제일:{" "}
                                </span>
                                {formatDate(sub.nextBillingDate)}
                              </div>
                            )}
                            {sub.description && (
                              <div className="text-xs text-[#9CA3AF] mt-1">
                                {sub.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSubscription(sub.id)}
                          className="text-[#EF4444] hover:text-[#DC2626] transition-colors"
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
                  ))}
                </div>
              )}

              {/* 구독 추가 모달 */}
              {showAddSubscription && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4 text-[#111827]">
                      구독 추가
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          구독명
                        </label>
                        <input
                          type="text"
                          value={newSubscription.name}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder="예: Notion Pro"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          카테고리
                        </label>
                        <input
                          type="text"
                          value={newSubscription.category}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder="예: 도구, 서비스"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          통화
                        </label>
                        <select
                          value={newSubscription.currency}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              currency: e.target
                                .value as Subscription["currency"],
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                        >
                          <option value="KRW">원화 (KRW)</option>
                          <option value="USD">달러 (USD)</option>
                          <option value="EUR">유로 (EUR)</option>
                          <option value="JPY">엔화 (JPY)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          금액 ({newSubscription.currency})
                        </label>
                        <input
                          type="number"
                          value={newSubscription.amount}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              amount: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder={
                            newSubscription.currency === "KRW"
                              ? "10000"
                              : newSubscription.currency === "USD"
                              ? "10"
                              : "1000"
                          }
                          step={
                            newSubscription.currency === "KRW" ? "1" : "0.01"
                          }
                        />
                        {newSubscription.currency !== "KRW" &&
                          newSubscription.amount && (
                            <div className="mt-1 text-xs text-[#6B7280]">
                              ≈{" "}
                              {formatCurrency(
                                convertToKRW(
                                  parseFloat(newSubscription.amount) || 0,
                                  newSubscription.currency
                                )
                              )}{" "}
                              (원화)
                            </div>
                          )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          결제 주기
                        </label>
                        <select
                          value={newSubscription.billingCycle}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              billingCycle: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                        >
                          <option value="monthly">월간</option>
                          <option value="yearly">연간</option>
                          <option value="one-time">일회성</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          시작일
                        </label>
                        <input
                          type="date"
                          value={newSubscription.startDate}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          설명
                        </label>
                        <textarea
                          value={newSubscription.description}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => setShowAddSubscription(false)}
                        className="flex-1 px-4 py-2 border border-[#D1D5DB]"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleAddSubscription}
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

          {/* 구매목록 탭 */}
          {activeTab === "purchases" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#111827]">
                  구매목록
                </h2>
                <button
                  onClick={() => setShowAddPurchase(true)}
                  className="px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded hover:bg-[#2563EB] transition-colors"
                >
                  구매 추가
                </button>
              </div>

              {purchases.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-center">
                  <p className="text-sm text-[#6B7280]">
                    등록된 구매가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="bg-white rounded-lg border border-[#E5E7EB] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-[#111827]">
                              {purchase.name}
                            </h3>
                          </div>
                          <div className="text-sm text-[#6B7280] space-y-1">
                            <div>
                              <span className="font-medium text-[#111827]">
                                금액:{" "}
                              </span>
                              <span className="font-semibold text-[#111827]">
                                {formatCurrency(purchase.amount)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-[#111827]">
                                구매일:{" "}
                              </span>
                              {formatDate(purchase.date)}
                            </div>
                            {purchase.vendor && (
                              <div>
                                <span className="font-medium text-[#111827]">
                                  판매처:{" "}
                                </span>
                                {purchase.vendor}
                              </div>
                            )}
                            {purchase.category && (
                              <div>
                                <span className="font-medium text-[#111827]">
                                  카테고리:{" "}
                                </span>
                                {purchase.category}
                              </div>
                            )}
                            {purchase.paymentMethod && (
                              <div>
                                <span className="font-medium text-[#111827]">
                                  결제수단:{" "}
                                </span>
                                {purchase.paymentMethod}
                              </div>
                            )}
                            {purchase.description && (
                              <div className="text-xs text-[#9CA3AF] mt-1">
                                {purchase.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePurchase(purchase.id)}
                          className="text-[#EF4444] hover:text-[#DC2626] transition-colors"
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
                  ))}
                </div>
              )}

              {/* 구매 추가 모달 */}
              {showAddPurchase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4 text-[#111827]">
                      구매 추가
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          구매명
                        </label>
                        <input
                          type="text"
                          value={newPurchase.name}
                          onChange={(e) =>
                            setNewPurchase({
                              ...newPurchase,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder="예: 디자인 툴 구매"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          금액 (원)
                        </label>
                        <input
                          type="number"
                          value={newPurchase.amount}
                          onChange={(e) =>
                            setNewPurchase({
                              ...newPurchase,
                              amount: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder="100000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          구매일
                        </label>
                        <input
                          type="date"
                          value={newPurchase.date}
                          onChange={(e) =>
                            setNewPurchase({
                              ...newPurchase,
                              date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          판매처
                        </label>
                        <input
                          type="text"
                          value={newPurchase.vendor}
                          onChange={(e) =>
                            setNewPurchase({
                              ...newPurchase,
                              vendor: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder="예: Adobe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          카테고리
                        </label>
                        <input
                          type="text"
                          value={newPurchase.category}
                          onChange={(e) =>
                            setNewPurchase({
                              ...newPurchase,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder="예: 소프트웨어"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          결제수단
                        </label>
                        <input
                          type="text"
                          value={newPurchase.paymentMethod}
                          onChange={(e) =>
                            setNewPurchase({
                              ...newPurchase,
                              paymentMethod: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          placeholder="예: 카드, 계좌이체"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#111827]">
                          설명
                        </label>
                        <textarea
                          value={newPurchase.description}
                          onChange={(e) =>
                            setNewPurchase({
                              ...newPurchase,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB]"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => setShowAddPurchase(false)}
                        className="flex-1 px-4 py-2 border border-[#D1D5DB]"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleAddPurchase}
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

          {/* 개요 탭 */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                <h2 className="text-lg font-semibold mb-4 text-[#111827]">
                  최근 구독
                </h2>
                {subscriptions.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center py-4">
                    등록된 구독이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subscriptions.slice(0, 5).map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#111827] mb-1">
                            {sub.name}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {sub.category}
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="font-semibold text-[#111827]">
                            {formatCurrency(sub.amountInKRW)}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {sub.billingCycle === "monthly" && "/월"}
                            {sub.billingCycle === "yearly" && "/년"}
                            {sub.currency !== "KRW" && (
                              <div className="mt-0.5">
                                ({sub.amount} {sub.currency})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                <h2 className="text-lg font-semibold mb-4 text-[#111827]">
                  최근 구매
                </h2>
                {purchases.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center py-4">
                    등록된 구매가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {purchases.slice(0, 5).map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[#111827] mb-1">
                            {purchase.name}
                          </div>
                          <div className="text-xs text-[#6B7280]">
                            {formatDate(purchase.date)} • {purchase.vendor}
                          </div>
                        </div>
                        <div className="font-semibold text-[#111827] ml-4 flex-shrink-0">
                          {formatCurrency(purchase.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 예산 관리 탭 */}
          {activeTab === "budgets" && (
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
              <h2 className="text-lg font-semibold mb-4 text-[#111827]">
                예산 관리
              </h2>
              <p className="text-sm text-[#6B7280] text-center py-4">
                예산 관리 기능은 곧 추가될 예정입니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
