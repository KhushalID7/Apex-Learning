"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, createQuiz, type Course } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import { ChevronLeft, Plus, Trash2, ArrowRight, Loader2, Type, CheckCircle2 } from "lucide-react";

interface QuestionForm {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

export default function NewQuizPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
    },
  ]);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (session?.access_token && courseId) {
      validateAccess();
    }
  }, [session, courseId]);

  const validateAccess = async () => {
    try {
      setPageLoading(true);
      setError(null);
      const data = await getCourseById(courseId);
      if (data.teacher_id !== user?.id && profile?.role !== "master") {
        setError("You don't have permission to add quizzes to this course");
        return;
      }
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setPageLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "A",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Quiz title is required");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        setError(`Please fill in all fields for Question ${i + 1}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      await createQuiz(
        courseId,
        {
          title,
          questions,
        },
        session!.access_token
      );
      router.push(`/dashboard/courses/${courseId}/quizzes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || pageLoading) {
    return <LoadingScreen message="Loading quiz editor…" />;
  }

  if (!user || profile?.role !== "teacher" || !course) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
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
              <Plus className="h-8 w-8 text-primary" />
              Create New Quiz
            </h1>
            <p className="mt-2 text-muted">For course: <strong className="text-foreground">{course.title}</strong></p>
          </div>
        </div>

        {error && <AlertBanner message={error} variant="error" className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up">
          {/* Quiz Title Card */}
          <div className="rounded-3xl border border-card-border bg-card/40 p-8 shadow-xl">
            <h2 className="text-xl font-bold text-foreground mb-4">Quiz Details</h2>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Type className="h-4 w-4 text-muted" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Module 1 Assessment"
                className="input-field pl-11 py-4 text-lg"
              />
            </div>
            <p className="text-xs text-muted mt-2">Give your quiz a descriptive title for easy identification.</p>
          </div>

          <h3 className="text-xl font-bold text-foreground mt-12 mb-6 flex items-center justify-between">
            <span>Questions</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">{questions.length} Total</span>
          </h3>

          <div className="space-y-8">
            {questions.map((q, index) => (
              <div key={index} className="rounded-2xl border border-card-border bg-card/60 p-6 sm:p-8 shadow-lg relative group transition-all hover:border-primary/30">
                
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-card-border">
                  <h4 className="font-bold text-lg text-foreground flex items-center gap-3">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">{index + 1}</span>
                    Question Text
                  </h4>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-muted hover:text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Question Input */}
                  <div>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(index, "question", e.target.value)}
                      placeholder="Enter the question text here..."
                      rows={3}
                      className="input-field py-3 resize-none w-full"
                    />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {(["A", "B", "C", "D"] as const).map((letter) => {
                      const optionKey = `option_${letter.toLowerCase()}` as keyof QuestionForm;
                      const isCorrect = q.correct_answer === letter;
                      
                      return (
                        <div key={letter} className={`flex items-center gap-3 rounded-xl border p-2 transition-all ${
                          isCorrect ? "bg-success/5 border-success/30 shadow-sm shadow-success/5" : "bg-background border-card-border"
                        }`}>
                          
                          {/* Correct Answer Radios */}
                          <label className={`flex shrink-0 items-center justify-center h-10 w-10 rounded-lg cursor-pointer transition-all ${
                            isCorrect ? "bg-success text-black font-black" : "bg-surface-2 text-muted hover:bg-surface"
                          }`}>
                            <input
                              type="radio"
                              name={`correct_${index}`}
                              checked={isCorrect}
                              onChange={() => updateQuestion(index, "correct_answer", letter)}
                              className="sr-only"
                            />
                            {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : letter}
                          </label>

                          <input
                            type="text"
                            value={q[optionKey]}
                            onChange={(e) => updateQuestion(index, optionKey, e.target.value)}
                            placeholder={`Option ${letter}`}
                            className="flex-1 bg-transparent border-none text-sm text-foreground focus:ring-0 px-2 py-2 placeholder:text-muted/50"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted/70 flex items-center gap-1.5 pt-2">
                    <span className="inline-block h-3 w-3 rounded-sm bg-success/30 border border-success/50" />
                    Click the letter button to mark the correct answer.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6">
            <button
              type="button"
              onClick={addQuestion}
              className="btn-outline flex-1 py-4 flex justify-center border-dashed border-2 hover:border-solid hover:bg-primary/5 hover:border-primary/50"
            >
              <Plus className="h-5 w-5 mr-2 text-primary" />
              Add Another Question
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 py-4 flex items-center justify-center text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Saving Assessment...
                </>
              ) : (
                <>
                  Publish Assessment
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
