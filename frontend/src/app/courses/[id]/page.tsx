"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCourseById, type Course } from "@/lib/courseApi";
import { useAuth } from "@/context/AuthContext";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user, profile } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCourseById(courseId);
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted">Loading course…</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AWT Learning
            </Link>
            <Link href="/courses" className="text-sm text-muted transition-colors hover:text-foreground">
              ← Back
            </Link>
          </div>
        </header>

        {/* Error */}
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-6">
            <p className="text-sm text-danger">{error || "Course not found"}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AWT Learning
          </Link>
          <Link href="/courses" className="text-sm text-muted transition-colors hover:text-foreground">
            ← Back to Courses
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">{course.title}</h1>
              <p className="text-lg text-muted">{course.description || "No description"}</p>
            </div>

            {/* Thumbnail */}
            {course.thumbnail_url && (
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-96 object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="rounded-xl border border-card-border bg-card/60 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">About This Course</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted">Price</p>
                  <p className="text-2xl font-bold text-foreground">₹{course.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Status</p>
                  <p className="text-sm font-medium">
                    <span className={`inline-block px-2 py-1 rounded ${
                      course.is_published
                        ? "bg-green-400/20 text-green-600"
                        : "bg-yellow-400/20 text-yellow-600"
                    }`}>
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Placeholder for Phase 3 (Enrollment) */}
            <div className="rounded-xl border border-dashed border-card-border p-8 text-center">
              <p className="text-muted text-sm">
                📝 Enrollment functionality coming in Phase 3
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Purchase Card */}
            <div className="rounded-xl border border-card-border bg-card/80 p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-muted mb-2">Course Price</p>
                <p className="text-3xl font-bold text-foreground">₹{course.price.toFixed(2)}</p>
              </div>

              {/* Enroll Button (Placeholder) */}
              <button
                disabled
                className="w-full rounded-lg bg-primary/50 px-6 py-3 text-sm font-medium text-white transition-all disabled:opacity-50 cursor-not-allowed"
                title="Enrollment feature coming in Phase 3"
              >
                Enroll Now (Coming Soon)
              </button>

              {/* Course Info */}
              <div className="mt-8 space-y-4 border-t border-card-border pt-6">
                <div>
                  <p className="text-xs font-medium text-muted uppercase">Instructor</p>
                  <p className="text-sm text-foreground">Teacher ID: {course.teacher_id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted uppercase">Created</p>
                  <p className="text-sm text-foreground">
                    {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
