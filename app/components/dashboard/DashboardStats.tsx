import React from "react";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  desc?: string;
}

interface DashboardStatsProps {
  stats: StatItem[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, index) => {
        // 아이콘의 선명도를 위해 텍스트 색상을 더 짙게 지정
        const iconColorClass = stat.color.includes('indigo') ? 'text-indigo-700' :
                               stat.color.includes('rose') ? 'text-rose-700' :
                               stat.color.includes('amber') ? 'text-amber-700' :
                               stat.color.includes('emerald') ? 'text-emerald-700' : 'text-slate-700';

        return (
          <div key={index} className="group glass-card p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-slate-500 tracking-tight">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tighter">{stat.value}</h3>
                </div>
                {stat.desc && (
                  <p className="text-[11px] font-semibold text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${stat.color}`}></span>
                    {stat.desc}
                  </p>
                )}
              </div>
              
              {/* 아이콘 컨테이너: 크기를 더 키우고 배경 대비를 높임 */}
              <div className={`w-14 h-14 rounded-2xl transition-all group-hover:scale-110 duration-300 ${stat.color} bg-opacity-20 flex items-center justify-center ${iconColorClass} shadow-sm border border-white/50`}>
                {stat.icon}
              </div>
            </div>
            
            {/* 하단 디자인 포인트 바 강화 */}
            <div className="mt-5 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
              <div className={`h-full ${stat.color} opacity-30 w-1/3 rounded-full`}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
