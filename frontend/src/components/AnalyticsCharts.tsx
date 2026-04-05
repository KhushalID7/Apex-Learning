"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { type TeacherStats } from "@/lib/courseApi";

interface AnalyticsChartsProps {
  stats: TeacherStats;
}

const COLORS = ["#7c5cfc", "#00d4ff", "#ffab40", "#00e676", "#ff4d6a", "#8888a8"];

export default function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  const { enrollment_trend, course_breakdown } = stats;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-lg border border-white/10 p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold text-muted">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm font-bold" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 animate-slide-up delay-200">
      {/* Enrollment Trend */}
      <div className="rounded-2xl border border-card-border bg-card/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <h3 className="mb-6 text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-6 rounded bg-primary"></span>
          Enrollment Trend <span className="text-sm font-normal text-muted">(30 Days)</span>
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrollment_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#64648a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(str) => str.split("-").slice(1).join("/")} />
              <YAxis stroke="#64648a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Students" stroke="#7c5cfc" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Performance */}
      <div className="rounded-2xl border border-card-border bg-card/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <h3 className="mb-6 text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-6 rounded bg-accent"></span>
          Students per Course
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={course_breakdown} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#64648a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="title" type="category" stroke="#eaeaf0" fontSize={12} tickLine={false} axisLine={false} width={100} tick={{ fill: '#eaeaf0' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="students" name="Students" radius={[0, 4, 4, 0]} maxBarSize={32}>
                {course_breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="rounded-2xl border border-card-border bg-card/40 p-6 shadow-xl lg:col-span-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-40 -mr-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <h3 className="mb-6 text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-6 rounded bg-primary"></span>
          Average Engagement per Course (%)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={course_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="title" stroke="#64648a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64648a" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="engagement" name="Engagement %" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {course_breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#colorEngagement${index})`} />
                ))}
              </Bar>
              <defs>
                {course_breakdown.map((entry, index) => (
                  <linearGradient key={`colorEngagement${index}`} id={`colorEngagement${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
