"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-card-border bg-card/60 p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden animate-slide-up">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-[2]" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${trendUp ? "text-success" : "text-danger"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}
