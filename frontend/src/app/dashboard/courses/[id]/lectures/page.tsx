"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, getCourseLectures, uploadLecture, deleteLecture, type Course, type Lecture } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import Badge from "@/components/Badge";
import { ChevronLeft, PlayCircle, Video, Trash2, UploadCloud, FileText, Type, Loader2, Play, CheckCircle2 } from "lucide-react";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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
      // Sort by order index
      const sortedLectures = lecturesData.sort((a, b) => a.order_index - b.order_index);
      setLectures(sortedLectures);
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
      data.append("order_index", (lectures.length + 1).toString()); // Start at 1 visually, assuming logic handles
      data.append("video", videoFile);

      const newLecture = await uploadLecture(courseId, data, session!.access_token);
      setLectures((prev) => [...prev, newLecture]);
      setSuccess(`Lecture "${newLecture.title}" uploaded successfully!`);
      setFormData({ title: "", description: "" });
      setVideoFile(null);
      // reset file input
      const fileInput = document.getElementById('video') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload lecture");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (lectureId: string) => {
    if (!confirm("Are you sure you want to delete this lecture? This action cannot be undone.")) return;

    try {
      setDeletingId(lectureId);
      await deleteLecture(lectureId, session!.access_token);
      setLectures((prev) => prev.filter((l) => l.id !== lectureId));
      setSuccess("Lecture deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lecture");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || pageLoading) {
    return <LoadingScreen message="Loading course lectures…" />;
  }

  if (!user || profile?.role !== "teacher" || !course) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <Link
              href={`/dashboard/courses/${courseId}/edit`}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Course Edit
            </Link>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <PlayCircle className="h-8 w-8 text-primary" />
              Manage Lectures
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-muted text-sm">Course:</span>
              <Badge variant="primary">{course.title}</Badge>
            </div>
          </div>
        </div>

        {error && <AlertBanner message={error} variant="error" className="mb-6 animate-slide-up" />}
        {success && <AlertBanner message={success} variant="success" className="mb-6 animate-slide-up" />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: List of Lectures */}
          <div className="lg:col-span-7 xl:col-span-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-card-border">
              <h2 className="text-xl font-bold text-foreground">Curriculum Outline</h2>
              <span className="bg-surface-2 text-muted px-3 py-1 rounded-full text-sm font-semibold border border-card-border">
                {lectures.length} Lectures
              </span>
            </div>

            <div className="space-y-4">
              {lectures.length === 0 ? (
                <EmptyState
                  icon={<Video className="h-10 w-10 text-muted" />}
                  title="No lectures uploaded yet"
                  description="Start building your course curriculum by uploading video lectures using the form."
                />
              ) : (
                lectures.map((lecture, index) => (
                  <div 
                    key={lecture.id} 
                    className="group rounded-2xl border border-card-border bg-card/40 p-5 flex flex-col sm:flex-row items-start gap-4 transition-all hover:bg-card/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                  >
                    {/* Index Badge */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black shadow-inner shadow-white/10 group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 w-full sm:pt-1">
                      <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">{lecture.title}</h3>
                      
                      {lecture.description ? (
                        <p className="text-sm text-muted mt-1.5 line-clamp-2">{lecture.description}</p>
                      ) : (
                        <p className="text-sm text-muted/50 italic mt-1.5">No description provided.</p>
                      )}
                      
                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-card-border sm:border-t-0 sm:pt-0 sm:mt-3">
                        {lecture.video_url && (
                          <a 
                            href={lecture.video_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Preview Video
                          </a>
                        )}
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" />
                          MP4 Video
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete Toggle */}
                    <button
                      onClick={() => handleDelete(lecture.id)}
                      disabled={deletingId === lecture.id}
                      className="absolute top-5 right-5 sm:relative sm:top-0 sm:right-0 p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
                      title="Delete Lecture"
                    >
                      {deletingId === lecture.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Upload Form */}
          <div className="lg:col-span-5 xl:col-span-4 animate-slide-up delay-100">
            <div className="rounded-3xl border border-card-border bg-card/60 p-6 sm:p-8 shadow-2xl sticky top-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
              
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
                <UploadCloud className="h-6 w-6 text-primary" />
                Upload New Lecture
              </h2>
              
              <form onSubmit={handleUpload} className="space-y-6 relative z-10">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    Lecture Title <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Type className="h-4 w-4 text-muted" />
                    </div>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Introduction to Variables"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute top-3 left-0 flex items-center pl-3">
                      <FileText className="h-4 w-4 text-muted" />
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="What is this lecture about?"
                      rows={4}
                      className="input-field pl-10 resize-none custom-scrollbar py-3"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="video" className="block text-sm font-medium text-foreground mb-2">
                    Video File <span className="text-danger">*</span>
                  </label>
                  
                  <div className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-colors ${
                    videoFile ? 'border-primary/50 bg-primary/5' : 'border-card-border bg-surface hover:bg-surface-2 hover:border-primary/30'
                  }`}>
                    <input 
                      id="video" 
                      name="video" 
                      type="file" 
                      accept="video/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileChange} 
                      required 
                    />
                    
                    {videoFile ? (
                      <div className="text-center w-full">
                        <div className="mx-auto h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                          <CheckCircle2 className="h-6 w-6 text-black" />
                        </div>
                        <p className="text-sm font-bold text-foreground truncate px-4">{videoFile.name}</p>
                        <p className="text-xs text-muted mt-1">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p className="text-xs text-primary mt-3 hover:underline">Click here to change file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto h-14 w-14 rounded-full bg-surface-2 border border-card-border flex items-center justify-center mb-3">
                          <UploadCloud className="h-6 w-6 text-muted" />
                        </div>
                        <p className="text-sm font-bold text-foreground">Click to upload video</p>
                        <p className="text-xs text-muted mt-1">MP4, WebM up to 500MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading to Cloudflare R2...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5" />
                        Upload Lecture
                      </>
                    )}
                  </button>
                  {uploading && (
                    <p className="text-[10px] text-muted text-center mt-3 animate-pulse">
                      Please do not close this window while the upload is in progress.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
