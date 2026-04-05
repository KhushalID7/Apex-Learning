"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getQuizById,
  submitQuiz,
  getQuizAttempts,
  checkEnrollmentStatus,
  type QuizDetail,
  type QuizAttempt,
} from "@/lib/courseApi";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import Navbar from "@/components/Navbar";
import { ChevronLeft, PenTool, Award, RefreshCcw, CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";

export default function QuizAttemptPage() {
  const params = useParams();
  const courseId = params.id as string;
  const quizId = params.quizId as string;
  const router = useRouter();
  const { user, profile, loading, session } = useAuth();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [pastAttempts, setPastAttempts] = useState<QuizAttempt[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!loading && user && profile && profile.role !== "student") {
      router.push(`/courses/${courseId}`);
    }
    if (!loading && !user) {
      router.push(`/courses/${courseId}`);
    }
  }, [loading, user, profile, router, courseId]);

  useEffect(() => {
    if (session?.access_token && profile?.role === "student") {
      loadData();
    }
  }, [session, profile, quizId]);

  const loadData = async () => {
    try {
      setPageLoading(true);
      setError(null);

      // Verify enrollment
      const enrollmentData = await checkEnrollmentStatus(courseId, session!.access_token);
      if (!enrollmentData.is_enrolled) {
        throw new Error("You are not enrolled in this course");
      }

      const [quizData, attemptsData] = await Promise.all([
        getQuizById(quizId),
        getQuizAttempts(quizId, session!.access_token),
      ]);

      setQuiz(quizData);
      setPastAttempts(attemptsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
    } finally {
      setPageLoading(false);
    }
  };

  const handleSelect = (questionId: string, option: string) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions before submitting. (${unanswered.length} remaining)`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const attemptResult = await submitQuiz(quizId, answers, session!.access_token);
      setResult(attemptResult);
      setShowResults(true);
      setPastAttempts((prev) => [attemptResult, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setShowResults(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || pageLoading) {
    return <LoadingScreen message="Loading quiz assessment…" />;
  }

  if (error && !quiz) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center rounded-2xl border border-danger/30 bg-card p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Cannot Load Quiz</h2>
          <p className="text-muted text-sm mb-6">{error}</p>
          <Link href={`/courses/${courseId}/learn`} className="btn-primary block w-full">
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const scorePercentage = result ? Math.round((result.score / result.total) * 100) : 0;
  const answeredCount = Object.keys(answers).length;
  const totalCount = quiz.questions.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-card-border bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/courses/${courseId}/learn`}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition-colors text-muted hover:text-foreground"
              title="Back to Course"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="h-6 w-px bg-card-border" />
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <PenTool className="h-4 w-4 text-accent" />
              {quiz.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted bg-surface-2 px-3 py-1 rounded-full border border-card-border">
              {!showResults ? (
                <span className={answeredCount === totalCount ? "text-success font-bold" : ""}>
                  {answeredCount} / {totalCount} Answered
                </span>
              ) : (
                <span>Completed</span>
              )}
            </span>
          </div>
        </div>
        
        {/* Progress Bar (while taking) */}
        {!showResults && (
          <div className="h-1 w-full bg-surface">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Score Card (after submission) */}
        {showResults && result && (
          <div className={`rounded-3xl border p-10 mb-12 text-center animate-slide-up shadow-2xl relative overflow-hidden ${
            scorePercentage >= 70
              ? "border-success/30 bg-success/10 shadow-success/10"
              : scorePercentage >= 40
              ? "border-warning/30 bg-warning/10 shadow-warning/10"
              : "border-danger/30 bg-danger/10 shadow-danger/10"
          }`}>
            <div className={`absolute top-0 left-0 w-full h-2 ${
              scorePercentage >= 70 ? "bg-success" : scorePercentage >= 40 ? "bg-warning" : "bg-danger"
            }`} />
            
            <div className="mb-6 flex justify-center">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-background border-4 ${
                scorePercentage >= 70 ? "border-success text-success" : scorePercentage >= 40 ? "border-warning text-warning" : "border-danger text-danger"
              }`}>
                {scorePercentage >= 70 ? <Award className="h-10 w-10" /> : scorePercentage >= 40 ? <CheckCircle2 className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
              </div>
            </div>
            
            <div className="text-7xl font-black mb-4 tracking-tighter">
              <span className={
                scorePercentage >= 70 ? "text-success" : scorePercentage >= 40 ? "text-warning" : "text-danger"
              }>
                {scorePercentage}%
              </span>
            </div>
            
            <p className="text-xl font-bold text-foreground mb-2">
              You scored {result.score} out of {result.total}
            </p>
            
            <p className="text-base text-muted mb-10 max-w-md mx-auto">
              {scorePercentage >= 70
                ? "Excellent work! You have a solid grasp of this material."
                : scorePercentage >= 40
                ? "Good effort! Review the incorrect answers to improve your knowledge."
                : "Keep studying! Review the course material and try again."}
            </p>
            
            <button
              onClick={handleRetake}
              className={`inline-flex items-center gap-2 rounded-xl border px-8 py-3 text-sm font-bold transition-all hover:bg-white/5 ${
                scorePercentage >= 70 ? "border-success text-success" : scorePercentage >= 40 ? "border-warning text-warning" : "border-danger text-danger"
              }`}
            >
              <RefreshCcw className="h-4 w-4" />
              Retake Quiz
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && <AlertBanner message={error} variant="error" />}

        {/* Questions Box */}
        <div className="space-y-8 animate-fade-in">
          {quiz.questions.map((q, index) => {
            const selectedAnswer = answers[q.id];
            const isSubmitted = showResults && result;
            const correctAnswer = q.correct_answer;

            return (
              <div
                key={q.id}
                className={`rounded-2xl border bg-card/40 p-6 sm:p-8 transition-all relative ${
                  isSubmitted 
                    ? selectedAnswer === correctAnswer
                      ? "border-success/30 shadow-[0_0_15px_rgba(0,230,118,0.05)] bg-success/5"
                      : "border-danger/30 shadow-[0_0_15px_rgba(255,77,106,0.05)] bg-danger/5"
                    : selectedAnswer
                      ? "border-accent/40 bg-card/80"
                      : "border-card-border"
                }`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold mt-0.5 ${
                    isSubmitted 
                      ? selectedAnswer === correctAnswer ? "bg-success text-black" : "bg-danger text-white"
                      : "bg-surface-2 text-muted border border-card-border"
                  }`}>
                    {index + 1}
                  </div>
                  <p className="text-foreground font-semibold leading-relaxed text-lg pt-1">{q.question}</p>
                </div>

                <div className="flex flex-col gap-3 pl-12">
                  {(["A", "B", "C", "D"] as const).map((letter) => {
                    const optionKey = `option_${letter.toLowerCase()}` as keyof typeof q;
                    const optionText = q[optionKey] as string;
                    const isSelected = selectedAnswer === letter;
                    const isCorrect = letter === correctAnswer;

                    // Compute dynamic classes for options
                    let borderClass = "border-card-border hover:border-accent/40";
                    let bgClass = "bg-surface hover:bg-surface-2";
                    let iconBg = "bg-surface-2 group-hover:bg-accent/10";
                    let iconText = "text-muted group-hover:text-accent font-bold";

                    if (isSubmitted) {
                      if (isCorrect) {
                        // The right answer
                        borderClass = "border-success";
                        bgClass = "bg-success/10";
                        iconBg = "bg-success";
                        iconText = "text-black font-black";
                      } else if (isSelected && !isCorrect) {
                        // Wrong selected answer
                        borderClass = "border-danger";
                        bgClass = "bg-danger/10";
                        iconBg = "bg-danger";
                        iconText = "text-white font-black";
                      } else {
                        // Unselected wrong answer
                        borderClass = "border-card-border/50 opacity-60";
                        bgClass = "bg-transparent";
                        iconBg = "bg-transparent";
                      }
                    } else if (isSelected) {
                      // Selected state (before submit)
                      borderClass = "border-accent shadow-sm shadow-accent/20";
                      bgClass = "bg-accent/10";
                      iconBg = "bg-accent";
                      iconText = "text-black font-black";
                    }

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleSelect(q.id, letter)}
                        disabled={showResults}
                        className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-all w-full ${borderClass} ${bgClass} ${
                          showResults ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs transition-colors ${iconBg} ${iconText}`}>
                          {letter}
                        </div>
                        <span className={`text-base font-medium ${isSelected || (isSubmitted && isCorrect) ? "text-foreground" : "text-foreground/80"}`}>
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback showing correct answer after submission */}
                {isSubmitted && selectedAnswer !== correctAnswer && (
                  <div className="mt-6 pl-12">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger border border-danger/20 font-medium">
                      <XCircle className="h-4 w-4" />
                      Incorrect. The correct answer was {correctAnswer}.
                    </div>
                  </div>
                )}
                {isSubmitted && selectedAnswer === correctAnswer && (
                  <div className="mt-6 pl-12">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success border border-success/20 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Correct!
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        {!showResults && (
          <div className="mt-12 sticky bottom-6 z-10 animate-fade-in delay-500">
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
              className={`w-full rounded-2xl px-6 py-5 text-lg font-bold text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
                answeredCount === totalCount
                  ? "bg-accent hover:bg-accent/90 shadow-accent/20 hover:scale-[1.02]"
                  : "bg-surface-2 border border-card-border text-muted hover:text-foreground cursor-pointer"
              } disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Grading Assessment...
                </>
              ) : answeredCount === totalCount ? (
                <>
                  Submit Assessment
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                `Complete ${totalCount - answeredCount} more questions to submit`
              )}
            </button>
          </div>
        )}

        {/* Past Attempts List */}
        {pastAttempts.length > 0 && (
          <div className="mt-16 border-t border-card-border pt-10">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-muted" />
              Attempt History
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pastAttempts.map((attempt, i) => {
                const pct = Math.round((attempt.score / attempt.total) * 100);
                return (
                  <div
                    key={attempt.id}
                    className="rounded-xl border border-card-border bg-card/40 p-5 flex items-center justify-between transition-colors hover:bg-card/60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">Attempt {pastAttempts.length - i}</p>
                      <p className="text-xs text-muted mt-1">
                        {new Date(attempt.submitted_at).toLocaleDateString()} at {new Date(attempt.submitted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className={`flex flex-col items-end rounded-lg px-3 py-1.5 border ${
                      pct >= 70 ? "bg-success/10 border-success/20 text-success" : 
                      pct >= 40 ? "bg-warning/10 border-warning/20 text-warning" : 
                      "bg-danger/10 border-danger/20 text-danger"
                    }`}>
                      <span className="text-lg font-bold leading-none">{pct}%</span>
                      <span className="text-[10px] font-medium leading-tight opacity-80">{attempt.score}/{attempt.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
