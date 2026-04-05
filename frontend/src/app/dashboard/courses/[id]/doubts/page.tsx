"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCourseById, type Course } from "@/lib/courseApi";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import QASection from "@/components/QASection";
import { ChevronLeft, MessageSquare } from "lucide-react";

export default function CourseDoubtsPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

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
      const data = await getCourseById(courseId);
      if (data.teacher_id !== user?.id && profile?.role !== "master") {
        router.push("/dashboard/courses");
        return;
      }
      setCourse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  if (loading || pageLoading) {
    return <LoadingScreen message="Loading Q&A Management..." />;
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-12 flex flex-col lg:h-[calc(100vh-80px)]">
        {/* Header Section */}
        <div className="flex flex-col mb-8 animate-fade-in shrink-0">
          <Link
            href={`/dashboard/courses/${courseId}/edit`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Course Edit
          </Link>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Manage Q&A: {course.title}
          </h1>
          <p className="mt-2 text-muted">Answer student questions and mark them as resolved.</p>
        </div>

        {/* QA Section Container */}
        <div className="flex-1 rounded-3xl border border-card-border bg-card/40 shadow-2xl overflow-hidden animate-slide-up flex flex-col min-h-[500px]">
          <div className="flex-1 flex flex-col overflow-hidden">
             <QASection courseId={courseId} isTeacher={true} />
          </div>
        </div>
      </main>
    </div>
  );
}
