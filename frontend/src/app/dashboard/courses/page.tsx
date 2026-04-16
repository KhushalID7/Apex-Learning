"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getTeacherCourses, deleteCourse, type Course } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import Badge from "@/components/Badge";
import { BookCopy, Plus, Edit2, Trash2, Library, GraduationCap, Video } from "lucide-react";

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
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

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
    return <LoadingScreen message="Loading your courses…" />;
  }

  if (!user || profile?.role !== "teacher") return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <Library className="h-8 w-8 text-primary" />
              My Courses
            </h1>
            <p className="mt-2 text-muted">Create, manage, and publish your educational content.</p>
          </div>
          <Link
            href="/dashboard/courses/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </div>

        {/* Global Error Banner */}
        {error && <AlertBanner message={error} variant="error" className="mb-8" />}

        {/* Courses Grid */}
        {courses.length === 0 && !error ? (
          <EmptyState
            icon={<BookCopy className="h-10 w-10 text-primary" />}
            title="No courses created yet"
            description="Start sharing your knowledge with the world by creating your first course."
            actionLabel="Create Your First Course"
            actionHref="/dashboard/courses/new"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className={`group flex flex-col rounded-2xl border border-card-border bg-card overflow-hidden transition-all hover:border-primary-muted hover:shadow-lg hover:-translate-y-1 animate-slide-up shadow-sm delay-${(idx % 4 + 1) * 100}`}
              >
                {/* Thumbnail Header */}
                <div className="relative h-48 bg-surface-2 overflow-hidden shrink-0">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-card">
                      <Video className="h-10 w-10 text-muted/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={course.is_published ? "success" : "warning"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-4">
                    <p className="text-xl font-bold text-white drop-shadow-md font-display">
                      ₹{course.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-foreground font-display line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-sm text-foreground/70 font-sans line-clamp-2 mb-6 flex-1">
                    {course.description || <span className="italic text-muted/50">No description provided</span>}
                  </p>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-card-border">
                    <Link
                      href={`/dashboard/courses/${course.id}/edit`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-semibold text-danger transition-all hover:bg-danger/10 hover:text-danger disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === course.id ? (
                        <span className="animate-pulse">Deleting…</span>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </>
                      )}
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
