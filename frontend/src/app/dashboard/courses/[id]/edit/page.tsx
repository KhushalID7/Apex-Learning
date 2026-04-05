"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, updateCourse, deleteCourse, type Course } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import { ChevronLeft, Edit2, PlayCircle, PenTool, MessageSquare, Image as ImageIcon, FileText, Type, DollarSign, Loader2, Trash2 } from "lucide-react";

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
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone and will remove all associated lectures and quizzes.")) {
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
    return <LoadingScreen message="Loading course editor…" />;
  }

  if (!user || profile?.role !== "teacher" || !course) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Courses
            </Link>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <Edit2 className="h-8 w-8 text-primary" />
              Edit Course
            </h1>
            <p className="mt-2 text-muted">Manage your course details and settings.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/dashboard/courses/${courseId}/lectures`}
              className="btn-outline flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Manage Lectures
            </Link>
            <Link
              href={`/dashboard/courses/${courseId}/quizzes`}
              className="btn-outline flex items-center gap-2"
            >
              <PenTool className="h-4 w-4" />
              Manage Quizzes
            </Link>
            <Link
              href={`/dashboard/courses/${courseId}/doubts`}
              className="btn-outline flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Manage Q&A
            </Link>
          </div>
        </div>

        {error && <AlertBanner message={error} variant="error" className="mb-6" />}
        {success && <AlertBanner message={success} variant="success" className="mb-6" />}

        {/* Form Container */}
        <div className="rounded-3xl border border-card-border bg-card/40 shadow-2xl overflow-hidden animate-slide-up">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-foreground">
                  Course Title <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Type className="h-4 w-4 text-muted" />
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Advanced Frontend Development"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-foreground">
                  Course Description
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute top-4 left-0 flex items-center pl-4">
                    <FileText className="h-4 w-4 text-muted" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Provide a detailed outline of what students will learn..."
                    className="input-field pl-11 py-3 resize-none custom-scrollbar"
                  />
                </div>
                <p className="mt-2 text-xs text-muted">Supports basic markdown formatting.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Price */}
                <div>
                  <label htmlFor="price" className="mb-2 block text-sm font-medium text-foreground">
                    Price (INR)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <DollarSign className="h-4 w-4 text-muted" />
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="input-field pl-11 font-mono"
                    />
                  </div>
                </div>

                {/* Published Status */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Visibility Status
                  </label>
                  <label className={`relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:bg-surface-2 ${formData.is_published ? "border-success/50 bg-success/5" : "border-card-border bg-surface"}`}>
                    <div className="flex items-center h-6">
                      <input
                        type="checkbox"
                        id="is_published"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-card-border bg-background text-success focus:ring-success/50 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${formData.is_published ? "text-success" : "text-foreground"}`}>
                        {formData.is_published ? "Published" : "Draft Mode"}
                      </span>
                      <span className="text-xs text-muted mt-1">
                        {formData.is_published 
                          ? "Visible to all students in the catalog." 
                          : "Only visible to you. Students cannot enroll."}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label htmlFor="thumbnail_url" className="mb-2 block text-sm font-medium text-foreground">
                  Cover Image URL
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <ImageIcon className="h-4 w-4 text-muted" />
                  </div>
                  <input
                    type="url"
                    id="thumbnail_url"
                    name="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="input-field pl-11"
                  />
                </div>
                
                {/* Image Preview */}
                {formData.thumbnail_url && (
                  <div className="mt-4 rounded-xl border border-card-border overflow-hidden bg-surface-2 relative group h-48 w-full sm:w-80">
                    <img 
                      src={formData.thumbnail_url} 
                      alt="Thumbnail Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded px-2 py-1 text-xs text-white">
                      Preview
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-card-border">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 py-4 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Course Details"
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-6 py-4 text-sm font-semibold text-danger transition-all hover:bg-danger/20 hover:border-danger/50 disabled:opacity-50 flex-none"
                >
                  {deleting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                  <span className="hidden sm:inline">Delete Course</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
