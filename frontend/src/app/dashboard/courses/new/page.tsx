"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createCourse } from "@/lib/courseApi";

export default function CreateCoursePage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "0",
    thumbnail_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSubmitting(true);
      await createCourse(
        {
          title: formData.title,
          description: formData.description || undefined,
          price: parseFloat(formData.price) || 0,
          thumbnail_url: formData.thumbnail_url || undefined,
        },
        session!.access_token
      );
      router.push("/dashboard/courses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setSubmitting(false);
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
          <Link
            href="/dashboard/courses"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl border border-card-border bg-card/80 p-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Create New Course</h1>
          <p className="text-muted mb-8">Fill in the details below to create your course</p>

          {error && (
            <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 p-4">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Advanced Python Programming"
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what students will learn in this course..."
                rows={5}
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label htmlFor="thumbnail_url" className="block text-sm font-medium text-foreground mb-2">
                Thumbnail URL
              </label>
              <input
                type="url"
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create Course"}
              </button>
              <Link
                href="/dashboard/courses"
                className="flex-1 rounded-lg border border-card-border px-6 py-2 text-sm font-medium text-muted transition-all hover:border-card-border/50 hover:bg-card/50 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
