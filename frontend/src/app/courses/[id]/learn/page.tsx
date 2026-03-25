"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, getCourseLectures, checkEnrollmentStatus, getCourseProgress, toggleLectureProgress, type Course, type Lecture } from "@/lib/courseApi";

export default function CoursePlayerPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const { user, profile, loading, session } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [completedLectureIds, setCompletedLectureIds] = useState<Set<string>>(new Set());
  
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
      const [courseData, lecturesData, progressData] = await Promise.all([
        getCourseById(courseId),
        getCourseLectures(courseId),
        getCourseProgress(courseId, session!.access_token)
      ]);

      setCourse(courseData);
      setCompletedLectureIds(new Set(progressData));
      
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
      // Revert optimism if needed (ignoring for brevity)
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted">Preparing learning environment…</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md text-center rounded-2xl border border-danger/30 bg-card p-8 shadow-xl">
          <span className="text-4xl block mb-4">⛔</span>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted text-sm mb-6">{error || "Course not found"}</p>
          <Link
            href={`/courses/${courseId}`}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all hover:bg-primary/90 block w-full"
          >
            Go Back to Course Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-card-border bg-card/80 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/learning"
              className="rounded-full p-2 hover:bg-white/5 transition-colors text-muted hover:text-foreground"
              title="Back to My Learning"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-foreground line-clamp-1 border-l border-card-border pl-4">
              {course.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 w-48">
            <div className="flex-1 bg-card-border rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500" 
                style={{ width: `${lectures.length > 0 ? (completedLectureIds.size / lectures.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-muted whitespace-nowrap">
              {completedLectureIds.size} / {lectures.length}
            </span>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden relative lg:flex-row flex-col">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col bg-black/40 overflow-y-auto w-full">
          {activeLecture ? (
            <>
              {/* Video Player Container */}
              <div className="w-full bg-black relative flex items-center justify-center border-b border-card-border" style={{ maxHeight: '70vh' }}>
                {activeLecture.video_url ? (
                  <video
                    key={activeLecture.id} // Re-mounts video when activeLecture changes
                    controls
                    className="w-full h-full max-h-[70vh] object-contain outline-none"
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
                  <div className="text-center p-8">
                    <p className="text-muted">No video available for this lecture</p>
                  </div>
                )}
              </div>

              {/* Lecture Details */}
              <div className="max-w-5xl mx-auto w-full p-6 lg:p-10 pb-20">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {activeLecture.order_index}. {activeLecture.title}
                </h2>
                {activeLecture.description ? (
                  <div className="prose prose-invert max-w-none text-muted">
                    <p className="whitespace-pre-wrap">{activeLecture.description}</p>
                  </div>
                ) : (
                  <p className="text-muted italic">No description provided.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
              <span className="text-6xl mb-4">📭</span>
              <h2 className="text-xl font-bold text-foreground mb-2">No Content Yet</h2>
              <p className="text-muted text-sm max-w-md">
                The instructor hasn't uploaded any lectures for this course yet. Check back later!
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Curriculum */}
        <aside className="lg:w-96 w-full border-l border-card-border bg-card/30 flex flex-col shrink-0 lg:h-full h-96 overflow-hidden">
          <div className="p-5 border-b border-card-border bg-card/50">
            <h3 className="font-bold text-foreground">Course Content</h3>
            <p className="text-xs text-muted mt-1">{lectures.length} lectures</p>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {lectures.length > 0 ? (
              <ul className="space-y-1 px-3">
                {lectures.map((lecture) => {
                  const isActive = activeLecture?.id === lecture.id;
                  const isCompleted = completedLectureIds.has(lecture.id);
                  return (
                    <li key={lecture.id}>
                      <div
                        onClick={() => setActiveLecture(lecture)}
                        className={`w-full text-left p-4 rounded-lg flex items-start gap-4 transition-all cursor-pointer ${
                          isActive 
                            ? "bg-primary/10 border border-primary/20 text-primary" 
                            : "hover:bg-white/5 border border-transparent text-foreground"
                        }`}
                      >
                        <button
                          onClick={(e) => handleToggleProgress(lecture.id, isCompleted, e)}
                          className={`mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full border transition-colors hover:border-foreground ${
                            isCompleted 
                              ? 'bg-green-500 border-green-500 text-black' 
                              : isActive ? 'border-primary text-primary' : 'border-muted text-muted'
                          }`}
                        >
                          {isCompleted ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : isActive ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          ) : (
                            <span className="text-[10px]">{lecture.order_index}</span>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {lecture.title}
                          </p>
                          {lecture.video_url && (
                            <p className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" />
                              </svg>
                              Video
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-muted">Curriculum is empty.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
