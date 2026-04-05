"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getEnrolledCourses, type Course } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import LoadingScreen from "@/components/LoadingScreen";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import { BookOpen } from "lucide-react";

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
    return <LoadingScreen message="Loading your courses…" />;
  }

  if (!user || profile?.role !== "student") return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-extrabold text-foreground">My Learning</h1>
          <p className="mt-2 text-muted">Pick up exactly where you left off.</p>
        </div>

        {/* Error Message */}
        {error && <AlertBanner message={error} variant="error" />}

        {/* Courses Grid */}
        {courses.length === 0 && !error ? (
          <EmptyState
            icon={<BookOpen className="h-10 w-10 text-primary" />}
            title="No courses enrolled yet"
            description="Browse our extensive catalog to find your first course and start learning today."
            actionLabel="Browse Catalog"
            actionHref="/courses"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course, idx) => (
              <div key={course.id} className={`animate-slide-up delay-${(idx % 4 + 1) * 100}`}>
                <CourseCard
                  id={course.id}
                  title={course.title}
                  description={course.teacher_name ? `Instructor: ${course.teacher_name}` : ""}
                  thumbnailUrl={course.thumbnail_url}
                  isEnrolled={true}
                  href={`/courses/${course.id}/learn`}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
