"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const roleConfig = {
    student: {
      emoji: "📚",
      label: "Student",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    teacher: {
      emoji: "🎓",
      label: "Teacher",
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    master: {
      emoji: "👑",
      label: "Master Admin",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/20",
    },
  };

  const rc = roleConfig[profile.role] || roleConfig.student;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AWT Learning
          </Link>
          <div className="flex items-center gap-6">
            {profile.role === "teacher" && (
              <Link
                href="/dashboard/courses"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                My Courses
              </Link>
            )}
            <Link
              href="/courses"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Browse Courses
            </Link>
            <div className="flex items-center gap-4">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${rc.color} ${rc.bgColor} ${rc.borderColor}`}>
                {rc.emoji} {rc.label}
              </span>
              <button
                onClick={signOut}
                className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted transition-all hover:border-danger/30 hover:text-danger hover:bg-danger/5"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome Card */}
        <div className="rounded-2xl border border-card-border bg-card/80 p-8 shadow-xl shadow-black/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">Welcome back,</p>
              <h2 className="mt-1 text-3xl font-bold text-foreground">
                {profile.full_name}
              </h2>
              <p className="mt-2 text-muted">
                {profile.role === "teacher"
                  ? "Ready to create some amazing courses?"
                  : profile.role === "master"
                  ? "Platform administration overview"
                  : "Continue your learning journey"}
              </p>
            </div>
            <div className="text-5xl">{rc.emoji}</div>
          </div>
        </div>

        {/* Quick Stats (placeholder for future phases) */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: profile.role === "teacher" ? "Courses Created" : "Enrolled Courses",
              value: "0",
              icon: "📖",
            },
            {
              label: profile.role === "teacher" ? "Total Students" : "Completed",
              value: "0",
              icon: "✅",
            },
            {
              label: profile.role === "teacher" ? "Revenue" : "Certificates",
              value: profile.role === "teacher" ? "₹0" : "0",
              icon: profile.role === "teacher" ? "💰" : "🏆",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-card-border bg-card/60 p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions / Navigation */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profile.role === "teacher" && (
            <Link
              href="/dashboard/courses"
              className="rounded-xl border border-card-border bg-card/60 p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Manage Courses</p>
                  <p className="mt-1 text-lg font-bold text-foreground">My Courses</p>
                </div>
                <span className="text-3xl">📚</span>
              </div>
            </Link>
          )}
          <Link
            href="/courses"
            className="rounded-xl border border-card-border bg-card/60 p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Browse & Learn</p>
                <p className="mt-1 text-lg font-bold text-foreground">All Courses</p>
              </div>
              <span className="text-3xl">🎒</span>
            </div>
          </Link>
        </div>

        {/* Placeholder message */}
        <div className="mt-8 rounded-xl border border-dashed border-card-border p-8 text-center">
          <p className="text-muted text-sm">
            🎉 Phase 2 (Course Management) is live! Next: Student enrollment (Phase 3)
          </p>
        </div>
      </main>
    </div>
  );
}
