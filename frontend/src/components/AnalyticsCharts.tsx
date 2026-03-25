"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { type TeacherStats } from "@/lib/courseApi";

interface AnalyticsChartsProps {
  stats: TeacherStats;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  const { enrollment_trend, course_breakdown } = stats;

  return (
    <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Enrollment Trend */}
      <div className="rounded-2xl border border-card-border bg-card/40 p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-bold text-foreground">Enrollment Trend (30 Days)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrollment_trend}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(str) => str.split("-").slice(1).join("/")}
              />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid #2a2a3e", borderRadius: "8px" }}
                itemStyle={{ color: "#3b82f6" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Performance */}
      <div className="rounded-2xl border border-card-border bg-card/40 p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-bold text-foreground">Students per Course</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={course_breakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="title"
                type="category"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid #2a2a3e", borderRadius: "8px" }}
              />
              <Bar dataKey="students" radius={[0, 4, 4, 0]}>
                {course_breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="rounded-2xl border border-card-border bg-card/40 p-6 shadow-xl lg:col-span-2">
        <h3 className="mb-6 text-lg font-bold text-foreground">Average Engagement per Course (%)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={course_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
              <XAxis dataKey="title" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1e2d", border: "1px solid #2a2a3e", borderRadius: "8px" }}
              />
              <Bar dataKey="engagement" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
