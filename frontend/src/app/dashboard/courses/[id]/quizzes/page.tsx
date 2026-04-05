"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, getCourseQuizzes, deleteCourse, generateAIQuiz, deleteQuiz, type Course, type Quiz } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import Badge from "@/components/Badge";
import { ChevronLeft, PenTool, Plus, Sparkles, Brain, Edit2, BarChart3, Trash2, Loader2, HelpCircle } from "lucide-react";

export default function CourseQuizzesPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI Generation state
  const [showAI, setShowAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (session?.access_token && courseId) {
      fetchData();
    }
  }, [session, courseId]);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      setError(null);

      const courseData = await getCourseById(courseId);
      if (courseData.teacher_id !== user?.id && profile?.role !== "master") {
        setError("You don't have permission to manage quizzes for this course");
        setPageLoading(false);
        return;
      }
      setCourse(courseData);

      const quizzesData = await getCourseQuizzes(courseId);
      setQuizzes(quizzesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setPageLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz and all its questions?")) return;

    try {
      setDeletingId(quizId);
      await deleteQuiz(quizId, session!.access_token);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quiz");
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setError("Please enter a topic for the AI quiz");
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      const newQuiz = await generateAIQuiz(
        courseId,
        { topic: aiTopic, num_questions: aiCount, difficulty: aiDifficulty },
        session!.access_token
      );
      setQuizzes((prev) => [{ ...newQuiz, question_count: newQuiz.questions?.length || 0 }, ...prev]);
      setAiTopic("");
      setShowAI(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI quiz");
    } finally {
      setGenerating(false);
    }
  };

  if (loading || pageLoading) {
    return <LoadingScreen message="Loading course quizzes…" />;
  }

  if (!user || profile?.role !== "teacher" || !course) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <Link
            href={`/dashboard/courses/${courseId}/edit`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Course Edit
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                <PenTool className="h-8 w-8 text-accent" />
                Manage Quizzes
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-muted text-sm">Course:</span>
                <Badge variant="primary">{course.title}</Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setShowAI(!showAI)}
                className={`btn-outline flex items-center gap-2 w-full sm:w-auto transition-all ${
                  showAI ? "bg-accent/10 border-accent/30 text-accent shadow-sm shadow-accent/20" : ""
                }`}
              >
                <Sparkles className={`h-4 w-4 ${showAI ? "text-accent fill-accent/20" : "text-accent"}`} />
                {showAI ? "Close AI Generator" : "Generate with AI"}
              </button>
              <Link
                href={`/dashboard/courses/${courseId}/quizzes/new`}
                className="btn-primary flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Create Manually
              </Link>
            </div>
          </div>
        </div>

        {error && <AlertBanner message={error} variant="error" className="mb-6" />}

        {/* AI Generation Panel */}
        {showAI && (
          <div className="mb-8 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface to-blue-500/5 p-6 shadow-xl animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-accent/20 blur-[50px] pointer-events-none" />
            
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
              <Sparkles className="h-5 w-5 text-accent" />
              AI Quiz Generator
              <Badge variant="warning" className="ml-2 text-[10px] py-0">Powered by Gemini AI</Badge>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 relative z-10">
              <div className="sm:col-span-12">
                <label className="block text-sm font-medium text-foreground mb-2">Topic <span className="text-danger">*</span></label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Python data structures, React hooks, Calculus derivatives..."
                  className="input-field"
                />
              </div>
              
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-foreground mb-2">Number of Questions</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="input-field"
                >
                  {[3, 5, 7, 10, 15].map((n) => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
                </select>
              </div>
              
              <div className="sm:col-span-5">
                <label className="block text-sm font-medium text-foreground mb-2">Difficulty Level</label>
                <div className="flex gap-2">
                  {[
                    { val: "easy", color: "text-success", border: "border-success/30", bg: "bg-success/10" }, 
                    { val: "medium", color: "text-warning", border: "border-warning/30", bg: "bg-warning/10" }, 
                    { val: "hard", color: "text-danger", border: "border-danger/30", bg: "bg-danger/10" }
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setAiDifficulty(d.val)}
                      className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-bold capitalize transition-all border ${
                        aiDifficulty === d.val
                          ? `${d.color} ${d.border} ${d.bg} shadow-sm`
                          : "border-card-border text-muted bg-surface hover:border-card-border/80"
                      }`}
                    >
                      {d.val}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="sm:col-span-3 flex items-end">
                <button
                  onClick={handleGenerateAI}
                  disabled={generating}
                  className="w-full rounded-xl bg-gradient-to-r from-accent to-blue-500 hover:to-blue-600 px-4 py-3 text-sm font-bold text-white transition-all shadow-lg hover:shadow-accent/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[46px] flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Disclaimer */}
            <p className="text-xs text-muted/70 mt-6 pt-4 border-t border-white/5 flex items-start gap-1">
              <HelpCircle className="h-4 w-4 shrink-0" />
              AI models can occasionally generate inaccurate questions. You can review and edit the generated questions before publishing.
            </p>
          </div>
        )}

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <EmptyState
            icon={<PenTool className="h-10 w-10 text-primary" />}
            title="No assessments created yet"
            description="Test your students' knowledge by adding quizzes. You can create them manually or use our AI Generator."
            actionLabel="Create Your First Quiz"
            actionHref={`/dashboard/courses/${courseId}/quizzes/new`}
          />
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz, idx) => (
              <div
                key={quiz.id}
                className={`group rounded-2xl border border-card-border bg-card/60 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 animate-slide-up delay-${(idx % 5 + 1) * 100}`}
              >
                {/* Icon */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                  <PenTool className="h-6 w-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-lg font-bold text-foreground truncate group-hover:text-accent transition-colors mb-1">{quiz.title}</h3>
                  <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs font-medium text-muted">
                    <span className="flex items-center gap-1.5 bg-surface-2 px-2 py-1 rounded-md border border-card-border">
                      <HelpCircle className="h-3.5 w-3.5" />
                      {quiz.question_count || 0} Questions
                    </span>
                    <span className="opacity-50">•</span>
                    <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 sm:pt-0 w-full sm:w-auto border-t border-card-border sm:border-0 mt-2 sm:mt-0">
                  <Link
                    href={`/dashboard/courses/${courseId}/quizzes/${quiz.id}/edit`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-accent rounded-xl bg-accent/10 hover:bg-accent hover:text-white transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Review
                  </Link>
                  <Link
                    href={`/dashboard/courses/${courseId}/quizzes/${quiz.id}/results`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary rounded-xl bg-primary/10 hover:bg-primary hover:text-white transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Results
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    disabled={deletingId === quiz.id}
                    className="flex shrink-0 items-center justify-center p-2.5 text-muted hover:text-danger rounded-xl hover:bg-danger/10 transition-colors disabled:opacity-50"
                    title="Delete Quiz"
                  >
                    {deletingId === quiz.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-danger" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
