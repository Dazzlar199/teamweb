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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B7280] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#111827]">{stat.value}</h3>
              {stat.desc && <p className="text-[10px] text-[#9CA3AF] mt-1">{stat.desc}</p>}
            </div>
            <div className={`p-2.5 rounded-lg ${stat.color} bg-opacity-10 text-opacity-100`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
