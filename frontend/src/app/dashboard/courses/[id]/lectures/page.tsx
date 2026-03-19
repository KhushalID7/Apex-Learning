"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, getCourseLectures, uploadLecture, deleteLecture, type Course, type Lecture } from "@/lib/courseApi";

export default function CourseLecturesPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      router.push("/dashboard");
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (session?.access_token && courseId) {
      fetchData();
    }
  }, [session, courseId]);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      setError(null);
      
      const courseData = await getCourseById(courseId);
      if (courseData.teacher_id !== user?.id && profile?.role !== "master") {
        setError("You don't have permission to manage this course's lectures");
        setPageLoading(false);
        return;
      }
      setCourse(courseData);

      const lecturesData = await getCourseLectures(courseId);
      setLectures(lecturesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title.trim() || !videoFile) {
      setError("Title and video file are required.");
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("order_index", lectures.length.toString());
      data.append("video", videoFile);

      const newLecture = await uploadLecture(courseId, data, session!.access_token);
      setLectures((prev) => [...prev, newLecture]);
      setSuccess("Lecture uploaded successfully!");
      setFormData({ title: "", description: "" });
      setVideoFile(null);
      // reset file input
      const fileInput = document.getElementById('video') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload lecture");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (lectureId: string) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;

    try {
      await deleteLecture(lectureId, session!.access_token);
      setLectures((prev) => prev.filter((l) => l.id !== lectureId));
      setSuccess("Lecture deleted successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lecture");
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
      <header className="border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AWT Learning
          </Link>
          <Link
            href={`/dashboard/courses/${courseId}/edit`}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Back to Course Edit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List of Lectures */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Manage Lectures</h1>
            <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full">
              {course.title}
            </span>
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

          <div className="space-y-4">
            {lectures.length === 0 ? (
              <div className="rounded-xl border border-card-border border-dashed p-12 text-center text-muted">
                No lectures uploaded yet.
              </div>
            ) : (
              lectures.map((lecture, index) => (
                <div key={lecture.id} className="rounded-xl border border-card-border bg-card/80 p-5 flex items-start gap-4 transition-all hover:bg-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{lecture.title}</h3>
                    {lecture.description && (
                      <p className="text-sm text-muted mt-1 line-clamp-2">{lecture.description}</p>
                    )}
                    {lecture.video_url && (
                      <a 
                        href={lecture.video_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        View Video
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(lecture.id)}
                    className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                    title="Delete Lecture"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Upload Form */}
        <div>
          <div className="rounded-2xl border border-card-border bg-card/80 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-foreground mb-4">Upload New Lecture</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="video" className="block text-sm font-medium text-foreground mb-2">
                  Video File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-card-border border-dashed rounded-lg bg-background hover:bg-card-border/10 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-muted" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-muted justify-center">
                      <label htmlFor="video" className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <span>Upload a video</span>
                        <input id="video" name="video" type="file" accept="video/*" className="sr-only" onChange={handleFileChange} required />
                      </label>
                    </div>
                    {videoFile && (
                      <p className="text-xs text-foreground font-medium mt-2 max-w-full truncate px-2">
                        {videoFile.name}
                      </p>
                    )}
                    <p className="text-xs text-muted">MP4, WebM up to 500MB</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 mt-4"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  "Upload Lecture"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
