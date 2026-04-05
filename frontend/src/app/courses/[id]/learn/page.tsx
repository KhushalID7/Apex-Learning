"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, getCourseLectures, checkEnrollmentStatus, getCourseProgress, toggleLectureProgress, getCourseQuizzes, type Course, type Lecture, type Quiz } from "@/lib/courseApi";
import LoadingScreen from "@/components/LoadingScreen";
import { PlayCircle, CheckCircle2, ChevronLeft, Video, PenTool, LayoutList, ChevronRight } from "lucide-react";

export default function CoursePlayerPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const { user, profile, loading, session } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [completedLectureIds, setCompletedLectureIds] = useState<Set<string>>(new Set());
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "student")) {
      router.push(`/courses/${courseId}`);
    }
  }, [loading, user, profile, router, courseId]);

  useEffect(() => {
    if (session?.access_token && profile?.role === "student") {
      loadCourseData();
    }
  }, [session, profile, courseId]);

  const loadCourseData = async () => {
    try {
      setPageLoading(true);
      setError(null);

      // Verify enrollment
      const enrollmentData = await checkEnrollmentStatus(courseId, session!.access_token);
      if (!enrollmentData.is_enrolled) {
        throw new Error("You are not enrolled in this course");
      }

      // Fetch course and lectures concurrently
      const [courseData, lecturesData, progressData, quizzesData] = await Promise.all([
        getCourseById(courseId),
        getCourseLectures(courseId),
        getCourseProgress(courseId, session!.access_token),
        getCourseQuizzes(courseId),
      ]);

      setCourse(courseData);
      setCompletedLectureIds(new Set(progressData));
      setQuizzes(quizzesData);
      
      // Sort lectures by order_index
      const sortedLectures = lecturesData.sort((a, b) => a.order_index - b.order_index);
      setLectures(sortedLectures);

      if (sortedLectures.length > 0) {
        setActiveLecture(sortedLectures[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course player");
    } finally {
      setPageLoading(false);
    }
  };

  const handleToggleProgress = async (lectureId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = !currentStatus;
      
      // Optimistic update
      setCompletedLectureIds((prev) => {
        const newSet = new Set(prev);
        if (newStatus) newSet.add(lectureId);
        else newSet.delete(lectureId);
        return newSet;
      });

      await toggleLectureProgress(courseId, lectureId, newStatus, session!.access_token);
    } catch (err) {
      console.error("Failed to toggle progress", err);
    }
  };

  if (loading || pageLoading) {
    return <LoadingScreen message="Preparing your learning environment…" />;
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md text-center rounded-2xl border border-danger/30 bg-card p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted text-sm mb-6">{error || "Course not found"}</p>
          <Link href={`/courses/${courseId}`} className="btn-primary block w-full">
            Go Back to Course Page
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = lectures.length > 0 ? (completedLectureIds.size / lectures.length) * 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-card-border bg-card/60 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/learning"
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition-colors text-muted hover:text-foreground"
              title="Back to My Learning"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="h-6 w-px bg-card-border" />
            <h1 className="text-sm font-semibold text-foreground line-clamp-1">
              {course.title}
            </h1>
          </div>
          
          {/* Progress Bar Header */}
          <div className="hidden sm:flex items-center gap-4 w-64">
            <div className="flex-1 bg-surface-2 rounded-full h-2 overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-success to-emerald-400 h-full transition-all duration-700 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 min-w-[50px] justify-end">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-xs font-bold text-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden relative lg:flex-row flex-col">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col bg-surface overflow-y-auto custom-scrollbar w-full">
          {activeLecture ? (
            <div className="animate-fade-in">
              {/* Video Player Container */}
              <div className="w-full bg-black relative flex items-center justify-center border-b border-card-border shadow-2xl">
                {activeLecture.video_url ? (
                  <video
                    key={activeLecture.id} // Re-mounts video when activeLecture changes
                    controls
                    className="w-full h-full max-h-[75vh] object-contain outline-none"
                    controlsList="nodownload"
                    poster={course.thumbnail_url || undefined}
                    onEnded={() => {
                      if (activeLecture && !completedLectureIds.has(activeLecture.id)) {
                        handleToggleProgress(activeLecture.id, false, { stopPropagation: () => {} } as React.MouseEvent);
                      }
                    }}
                    autoPlay
                  >
                    <source src={activeLecture.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 h-[50vh] bg-surface-2 w-full">
                    <div className="h-16 w-16 rounded-full bg-card-border flex items-center justify-center mb-4 text-muted">
                      <Video className="h-8 w-8" />
                    </div>
                    <p className="text-muted font-medium">No video content for this lecture</p>
                  </div>
                )}
              </div>

              {/* Lecture Details */}
              <div className="max-w-5xl mx-auto w-full p-6 lg:p-12 pb-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                    {activeLecture.order_index}
                  </span>
                  <h2 className="text-2xl font-bold text-foreground">
                    {activeLecture.title}
                  </h2>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 border-b border-card-border pb-2">Description</h3>
                  {activeLecture.description ? (
                    <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed font-medium">
                      <p className="whitespace-pre-wrap">{activeLecture.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted italic">No further reading provided for this lecture.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full animate-fade-in">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card-border text-muted mb-6 shadow-xl">
                <LayoutList className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Content Yet</h2>
              <p className="text-muted text-base max-w-md">
                The instructor is still preparing the lectures for this course. Please check back later.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Curriculum */}
        <aside className="lg:w-96 w-full border-l border-card-border bg-card/40 flex flex-col shrink-0 lg:h-full h-[50vh] overflow-hidden">
          <div className="p-5 border-b border-card-border bg-card/60 backdrop-blur-md z-10">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <LayoutList className="h-4 w-4 text-primary" />
              Course Curriculum
            </h3>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted font-medium">
              <span>{lectures.length} Lectures</span>
              <span className="h-1 w-1 rounded-full bg-muted/50" />
              <span>{quizzes.length} Quizzes</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
            {lectures.length > 0 ? (
              <ul className="space-y-1 px-3">
                {lectures.map((lecture) => {
                  const isActive = activeLecture?.id === lecture.id;
                  const isCompleted = completedLectureIds.has(lecture.id);
                  return (
                    <li key={lecture.id}>
                      <button
                        onClick={() => setActiveLecture(lecture)}
                        className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all ${
                          isActive 
                            ? "bg-primary/10 border border-primary/20 shadow-sm" 
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div
                          onClick={(e) => handleToggleProgress(lecture.id, isCompleted, e)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isCompleted 
                              ? 'bg-success border-success text-black' 
                              : isActive 
                                ? 'border-primary text-primary bg-primary/10' 
                                : 'border-card-border text-muted bg-surface hover:border-muted/50'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : isActive ? (
                            <PlayCircle className="h-3 w-3 fill-current" />
                          ) : (
                            <span className="text-[9px] font-bold">{lecture.order_index}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-primary' : 'text-foreground/90'}`}>
                            {lecture.title}
                          </p>
                          {lecture.video_url && (
                            <p className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
                              <Video className="h-3 w-3" />
                              Video
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center bg-card/30 m-3 rounded-xl border border-dashed border-card-border">
                <p className="text-sm text-muted">Curriculum is empty.</p>
              </div>
            )}

            {/* Quizzes Section */}
            {quizzes.length > 0 && (
              <div className="mt-6">
                <div className="sticky top-0 bg-card/40 backdrop-blur-md px-5 py-3 border-y border-card-border mb-3">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-accent" />
                    Assessments
                  </h3>
                </div>
                <ul className="space-y-2 px-3 pb-6">
                  {quizzes.map((quiz) => (
                    <li key={quiz.id}>
                      <Link
                        href={`/courses/${courseId}/quiz/${quiz.id}`}
                        className="group flex w-full items-center gap-4 rounded-xl border border-card-border bg-surface p-3 transition-all hover:bg-accent/5 hover:border-accent/30 hover:shadow-md"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                          <PenTool className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">{quiz.title}</p>
                          <p className="text-xs text-muted mt-0.5">{quiz.question_count || 0} Questions</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted group-hover:text-accent" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
