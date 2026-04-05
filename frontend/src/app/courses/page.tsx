"use client";

import { useEffect, useState } from "react";
import { getPublishedCourses, type Course } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import LoadingScreen from "@/components/LoadingScreen";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import { Search, Compass } from "lucide-react";

export default function CoursesPage() {
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
    return <LoadingScreen message="Discovering courses…" />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-card-border bg-card/40 py-16 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="mx-auto max-w-7xl px-6 relative z-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Expand Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Horizons</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Find the perfect premium course to accelerate your career. Master new skills with our expert-led catalog.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-10 max-w-2xl relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-muted" />
            <input
              type="text"
              placeholder="Search by title, topic, or instructor…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-card-border bg-background/80 py-4 pl-12 pr-4 text-foreground shadow-2xl backdrop-blur-md transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Error Message */}
        {error && <AlertBanner message={error} variant="error" />}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {searchQuery ? "Search Results" : "All Courses"}
          </h2>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
            {filteredCourses.length} result{filteredCourses.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <EmptyState
            icon={<Compass className="h-10 w-10 text-primary" />}
            title={searchQuery ? "No matching courses found" : "No courses available yet"}
            description={searchQuery 
              ? "We couldn't find any courses matching your search. Try adjusting your keywords." 
              : "Check back soon as our instructors are constantly publishing new content!"}
            actionLabel={searchQuery ? "Clear Search" : undefined}
            onAction={() => setSearchQuery("")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course, idx) => (
              <div key={course.id} className={`h-full animate-slide-up delay-${(idx % 4 + 1) * 100}`}>
                <CourseCard
                  id={course.id}
                  title={course.title}
                  description={course.description || undefined}
                  thumbnailUrl={course.thumbnail_url}
                  price={course.price}
                  href={`/courses/${course.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
