"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getQuizResults, type QuizResults } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import EmptyState from "@/components/EmptyState";
import { ChevronLeft, BarChart3, Users, Target, Activity, CheckCircle2, TrendingUp } from "lucide-react";

export default function QuizResultsPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [results, setResults] = useState<QuizResults | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (session?.access_token && quizId) {
      fetchResults();
    }
  }, [session, quizId]);

  const fetchResults = async () => {
    try {
      setPageLoading(true);
      setError(null);
      const data = await getQuizResults(quizId, session!.access_token);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setPageLoading(false);
    }
  };

  if (loading || pageLoading) {
    return <LoadingScreen message="Loading quiz analytics…" />;
  }

  if (!user || profile?.role !== "teacher") return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <Link
              href={`/dashboard/courses/${courseId}/quizzes`}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Quizzes
            </Link>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Assessment Analytics
            </h1>
            {results && (
              <p className="mt-2 text-muted">
                Viewing results for: <strong className="text-foreground">{results.quiz_title}</strong>
              </p>
            )}
          </div>
        </div>

        {error && <AlertBanner message={error} variant="error" className="mb-6" />}

        {/* Summary Stats Grid */}
        {results && results.attempts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 animate-slide-up">
            <div className="rounded-2xl border border-card-border bg-card/40 p-6 flex items-center gap-5 shadow-lg">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">Total Attempts</p>
                <p className="text-3xl font-black text-foreground mt-1">{results.attempts.length}</p>
              </div>
            </div>
            
            <div className="rounded-2xl border border-card-border bg-card/40 p-6 flex items-center gap-5 shadow-lg">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">Unique Students</p>
                <p className="text-3xl font-black text-foreground mt-1">
                  {new Set(results.attempts.map((a) => a.student_id)).size}
                </p>
              </div>
            </div>
            
            <div className="rounded-2xl border border-card-border bg-card/40 p-6 flex items-center gap-5 shadow-lg">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">Average Score</p>
                <p className="text-3xl font-black text-success mt-1">
                  {Math.round(
                    results.attempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) /
                      results.attempts.length
                  )}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Attempts Data List */}
        {results && results.attempts.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-10 w-10 text-muted" />}
            title="No attempts recorded yet"
            description="Once students take this assessment, their results and performance analytics will appear here."
          />
        ) : results ? (
          <div className="rounded-3xl border border-card-border bg-card/40 shadow-xl overflow-hidden animate-slide-up delay-100">
            <div className="p-6 border-b border-card-border bg-surface/50">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Student Submissions
              </h3>
            </div>
            
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-surface-2 border-b border-card-border text-xs font-bold text-muted uppercase tracking-wider">
              <div className="col-span-4 lg:col-span-5">Student Details</div>
              <div className="col-span-2 text-center">Raw Score</div>
              <div className="col-span-2 text-center">Grade (%)</div>
              <div className="col-span-4 lg:col-span-3 text-right">Submission Time</div>
            </div>

            {/* List Body */}
            <div className="divide-y divide-card-border">
              {results.attempts.map((attempt) => {
                const pct = Math.round((attempt.score / attempt.total) * 100);
                
                // Determine grade styling
                let gradeClass = "";
                if (pct >= 85) gradeClass = "bg-success/10 border-success/30 text-success shadow-[0_0_10px_rgba(0,230,118,0.1)]";
                else if (pct >= 60) gradeClass = "bg-warning/10 border-warning/30 text-warning";
                else gradeClass = "bg-danger/10 border-danger/30 text-danger";
                
                return (
                  <div
                    key={attempt.id}
                    className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 md:px-8 py-5 items-start md:items-center hover:bg-surface-2 transition-colors"
                  >
                    <div className="md:col-span-4 lg:col-span-5 flex items-center gap-4 w-full">
                      <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-black text-sm shadow-inner shadow-white/5 border border-white/5">
                        {attempt.student_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {attempt.student_name || "Anonymous Student"}
                        </p>
                        <p className="text-xs text-muted md:hidden mt-0.5">
                          {new Date(attempt.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 flex items-center gap-2 mt-2 md:mt-0 justify-between md:justify-center w-full md:w-auto px-14 md:px-0">
                      <span className="text-xs text-muted md:hidden">Raw Score:</span>
                      <span className="text-sm text-foreground font-semibold flex items-center gap-1.5 bg-surface-2 px-2.5 py-1 rounded-md border border-card-border">
                        {attempt.score} <span className="opacity-50 text-xs font-normal">/ {attempt.total}</span>
                      </span>
                    </div>
                    
                    <div className="md:col-span-2 flex items-center gap-2 mt-2 md:mt-0 justify-between md:justify-center w-full md:w-auto px-14 md:px-0">
                      <span className="text-xs text-muted md:hidden">Grade:</span>
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md border text-sm font-bold ${gradeClass}`}>
                        {pct}%
                      </span>
                    </div>
                    
                    <div className="hidden md:block md:col-span-4 lg:col-span-3 text-right text-sm font-medium text-muted">
                      {new Date(attempt.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      <span className="mx-2 opacity-50">•</span>
                      {new Date(attempt.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
