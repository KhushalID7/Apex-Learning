"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublishedCourses, type Course } from "@/lib/courseApi";
import { useAuth } from "@/context/AuthContext";

export default function CoursesPage() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublishedCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted">Loading courses…</p>
        </div>
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
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            {user && profile?.role === "teacher" && (
              <Link
                href="/dashboard/courses"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                My Courses
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Courses</h1>
          <p className="text-muted mb-8">Find the perfect course to accelerate your learning</p>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search courses by title or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-card-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={fetchCourses}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all hover:bg-primary/90 active:scale-95"
            >
              Search
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border p-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No courses found" : "No courses available yet"}
            </p>
            <p className="text-muted">
              {searchQuery
                ? "Try a different search query"
                : "Check back soon for new courses!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group rounded-xl border border-card-border bg-card/60 overflow-hidden transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Thumbnail */}
                {course.thumbnail_url ? (
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-4xl">📚</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {course.title}
                  </h3>

                  <p className="text-sm text-muted line-clamp-2 mb-4">
                    {course.description || "No description"}
                  </p>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        ₹{course.price.toFixed(2)}
                      </p>
                    </div>
                    <button className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-all group-hover:bg-primary group-hover:text-white">
                      View
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
