"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, updateCourse, deleteCourse, type Course } from "@/lib/courseApi";

export default function EditCoursePage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "0",
    thumbnail_url: "",
    is_published: false,
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (session?.access_token && courseId) {
      fetchCourse();
    }
  }, [session, courseId]);

  const fetchCourse = async () => {
    try {
      setPageLoading(true);
      setError(null);
      const data = await getCourseById(courseId);

      // Check ownership
      if (data.teacher_id !== user?.id && profile?.role !== "master") {
        setError("You don't have permission to edit this course");
        return;
      }

      setCourse(data);
      setFormData({
        title: data.title,
        description: data.description || "",
        price: data.price.toString(),
        thumbnail_url: data.thumbnail_url || "",
        is_published: data.is_published,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSubmitting(true);
      await updateCourse(
        courseId,
        {
          title: formData.title,
          description: formData.description || undefined,
          price: parseFloat(formData.price) || 0,
          thumbnail_url: formData.thumbnail_url || undefined,
          is_published: formData.is_published,
        },
        session!.access_token
      );
      setSuccess("Course updated successfully");
      setTimeout(() => router.push("/dashboard/courses"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await deleteCourse(courseId, session!.access_token);
      router.push("/dashboard/courses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
      setDeleting(false);
    }
  };

  if (loading || pageLoading) {
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

  if (!user || profile?.role !== "teacher" || !course) return null;

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Edit Course</h1>
              <p className="text-muted">Update your course details</p>
            </div>
            
            <Link
              href={`/dashboard/courses/${courseId}/lectures`}
              className="rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-medium transition-all hover:bg-primary/20 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Manage Lectures
            </Link>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 p-4">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-400/30 bg-green-400/10 p-4">
              <p className="text-sm text-green-600">{success}</p>
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
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                rows={5}
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
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
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Published Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_published"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="rounded border-card-border"
              />
              <label htmlFor="is_published" className="text-sm font-medium text-foreground">
                Publish this course (make it visible to students)
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg border border-danger/30 px-6 py-2 text-sm font-medium text-danger transition-all hover:bg-danger/5 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Course"}
              </button>
            </div>

            <Link
              href="/dashboard/courses"
              className="block rounded-lg border border-card-border px-6 py-2 text-sm font-medium text-muted transition-all hover:border-card-border/50 hover:bg-card/50 text-center"
            >
              Cancel
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
