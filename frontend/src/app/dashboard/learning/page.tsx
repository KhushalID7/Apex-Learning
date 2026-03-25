"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getEnrolledCourses, type Course } from "@/lib/courseApi";

export default function StudentLearningPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "student")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (session?.access_token && profile?.role === "student") {
      fetchCourses();
    }
  }, [session, profile]);

  const fetchCourses = async () => {
    try {
      setCourseLoading(true);
      setError(null);
      const data = await getEnrolledCourses(session!.access_token);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enrolled courses");
    } finally {
      setCourseLoading(false);
    }
  };

  if (loading || courseLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted">Loading your courses…</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "student") return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AWT Learning
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/courses"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Learning</h1>
            <p className="mt-1 text-muted">Pick up where you left off</p>
          </div>
          <Link
            href="/courses"
            className="rounded-lg border border-primary/30 px-6 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/5 active:scale-95"
          >
            Explore More
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 && !error ? (
          <div className="rounded-xl border border-dashed border-card-border p-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">No courses enrolled yet</p>
            <p className="text-muted mb-6">Browse our catalog to find your first course!</p>
            <Link
              href="/courses"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all hover:bg-primary/90"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl border border-card-border bg-card/60 overflow-hidden transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 flex flex-col"
              >
                {/* Thumbnail */}
                {course.thumbnail_url && (
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden shrink-0">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted line-clamp-2 mb-4 flex-1">
                    {course.teacher_name ? `Instructor: ${course.teacher_name}` : ""}
                  </p>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-card-border">
                    <Link
                      href={`/courses/${course.id}/learn`}
                      className="block w-full rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-all hover:bg-primary/20 text-center"
                    >
                      Continue Learning
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
