"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getTeacherCourses, deleteCourse, type Course } from "@/lib/courseApi";

export default function TeacherCoursesPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (session?.access_token) {
      fetchCourses();
    }
  }, [session]);

  const fetchCourses = async () => {
    try {
      setCourseLoading(true);
      setError(null);
      const data = await getTeacherCourses(session!.access_token);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setCourseLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      setDeletingId(courseId);
      await deleteCourse(courseId, session!.access_token);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setDeletingId(null);
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
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "teacher") return null;

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
            <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
            <p className="mt-1 text-muted">Create and manage your courses</p>
          </div>
          <Link
            href="/dashboard/courses/new"
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90 active:scale-95"
          >
            + Create Course
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border p-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">No courses yet</p>
            <p className="text-muted">Create your first course to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl border border-card-border bg-card/60 overflow-hidden transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Thumbnail */}
                {course.thumbnail_url && (
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    <span
                      className={`whitespace-nowrap text-xs font-medium px-2 py-1 rounded ${
                        course.is_published
                          ? "bg-green-400/20 text-green-600"
                          : "bg-yellow-400/20 text-yellow-600"
                      }`}
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="text-sm text-muted line-clamp-2 mb-4">
                    {course.description || "No description"}
                  </p>

                  <div className="mb-4">
                    <p className="text-lg font-bold text-foreground">
                      ₹{course.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/courses/${course.id}/edit`}
                      className="flex-1 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/5 text-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id}
                      className="flex-1 rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger transition-all hover:bg-danger/5 disabled:opacity-50"
                    >
                      {deletingId === course.id ? "Deleting…" : "Delete"}
                    </button>
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
