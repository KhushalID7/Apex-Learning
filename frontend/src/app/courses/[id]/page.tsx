"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCourseById, enrollInCourse, checkEnrollmentStatus, createRazorpayOrder, verifyRazorpayPayment, type Course } from "@/lib/courseApi";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import Badge from "@/components/Badge";
import { PlayCircle, Clock, Award, ShieldCheck, CheckCircle2, ChevronRight, User, Calendar, Loader2, Lock, BookOpen } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user, profile, session, loading: authLoading } = useAuth();

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCourseById(courseId);
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && session?.access_token && profile?.role === "student") {
      checkEnrollmentStatus(courseId, session.access_token)
        .then((data) => setIsEnrolled(data.is_enrolled))
        .catch(console.error);
    }
  }, [courseId, session, profile]);

  useEffect(() => {
    // Inject Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleEnroll = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    if (!session?.access_token) return;
    try {
      setEnrolling(true);
      setEnrollError(null);

      if (course?.price && course.price > 0) {
        // Razorpay Check-out Flow
        const order = await createRazorpayOrder(courseId, session.access_token);
        
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "AWT Learning",
          description: course.title,
          order_id: order.id,
          handler: async function (response: any) {
            try {
              setEnrolling(true);
              setEnrollError(null);
              await verifyRazorpayPayment(courseId, response, session.access_token);
              setIsEnrolled(true);
            } catch (err) {
              setEnrollError(err instanceof Error ? err.message : "Payment verification failed");
              setEnrolling(false);
            }
          },
          prefill: {
            name: profile?.full_name || "Student",
            email: user.email || ""
          },
          theme: {
            color: "#6366f1"
          },
          modal: {
            ondismiss: function() {
              setEnrolling(false);
            }
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any){
           setEnrollError(response.error.description);
           setEnrolling(false);
        });
        rzp.open();
      } else {
        // Free Enrollment Flow
        await enrollInCourse(courseId, session.access_token);
        setIsEnrolled(true);
      }
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "Failed to initiate enrollment");
      setEnrolling(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Loading course details…" />;
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-12">
          <AlertBanner message={error || "Course not found"} variant="error" />
          <Link href="/courses" className="btn-ghost inline-flex items-center gap-2 mt-4">
            ← Back to Catalog
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      {/* Hero Header with Blurred Background */}
      <div className="relative overflow-hidden bg-surface-2 pt-20 pb-24 animate-fade-in">
        {/* Blurred backdrop image */}
        {course.thumbnail_url && (
          <>
            <div className="absolute inset-0 block">
              <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          </>
        )}
        
        <div className="mx-auto max-w-7xl px-6 relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/courses" className="text-sm font-medium text-muted hover:text-foreground transition-colors flex items-center gap-1">
                Courses <ChevronRight className="h-3 w-3" />
              </Link>
              <Badge variant="primary">{course.is_published ? "Published" : "Draft"}</Badge>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl max-w-3xl leading-tight">
              {course.title}
            </h1>
            
            <p className="max-w-2xl text-lg text-foreground/80 leading-relaxed font-medium">
              {course.description || "Unlock new skills and master your craft with this comprehensive course designed for dedicated learners."}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/80 mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>Instructor: <strong>{course.teacher_name || "Expert"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                <span>Last updated: <strong>{new Date(course.created_at).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>
          
          {/* Mobile Thumbnail */}
          {course.thumbnail_url && (
            <div className="md:hidden w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative mt-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/30 mix-blend-overlay z-10" />
              <img src={course.thumbnail_url} alt={course.title} className="w-full aspect-video object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content & Sidebar Grid */}
      <main className="mx-auto max-w-7xl px-6 relative z-20">
        <div className="grid gap-12 lg:grid-cols-3">
          
          {/* Main Course Content */}
          <div className="lg:col-span-2 space-y-12 lg:-mt-10">
            {/* Desktop Thumbnail */}
            {course.thumbnail_url && (
              <div className="hidden md:block w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-card-border bg-card relative group animate-slide-up">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 mix-blend-overlay z-10 transition-opacity duration-500 group-hover:opacity-60" />
                <img src={course.thumbnail_url} alt={course.title} className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                   <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/40 backdrop-blur-md shadow-2xl shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                     <PlayCircle className="h-10 w-10 text-white fill-white/20 ml-1" />
                   </div>
                </div>
              </div>
            )}
            
            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up delay-100">
              <div className="rounded-xl border border-card-border bg-card/60 p-5 flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">On-Demand Video</h4>
                  <p className="text-xs text-muted leading-relaxed">High-quality video lectures accessible anytime, anywhere.</p>
                </div>
              </div>
              <div className="rounded-xl border border-card-border bg-card/60 p-5 flex items-start gap-4">
                <div className="rounded-lg bg-accent/10 p-2 text-accent shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Certificate</h4>
                  <p className="text-xs text-muted leading-relaxed">Earn a verified certificate upon successful completion.</p>
                </div>
              </div>
              <div className="rounded-xl border border-card-border bg-card/60 p-5 flex items-start gap-4">
                <div className="rounded-lg bg-warning/10 p-2 text-warning shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Lifetime Access</h4>
                  <p className="text-xs text-muted leading-relaxed">Learn at your own pace with unrestricted access.</p>
                </div>
              </div>
            </div>

            {/* Course Description */}
            <div className="animate-slide-up delay-200">
              <h2 className="text-2xl font-bold text-foreground mb-6">About This Course</h2>
              <div className="prose prose-invert prose-p:text-muted prose-p:leading-relaxed max-w-none">
                <p>{course.description || "The instructor hasn't provided a detailed description for this course yet, but you can expect comprehensive coverage of the topic based on the curriculum."}</p>
                <p className="mt-4">
                  By the end of this course, you will have a solid understanding of the core concepts and be able to apply them practically in real-world scenarios. We combine theoretical knowledge with practical examples to ensure maximum retention and applicability.
                </p>
              </div>
            </div>
            
            {/* What you'll learn */}
            <div className="rounded-2xl border border-card-border bg-card/40 p-8 animate-slide-up delay-300">
              <h3 className="text-xl font-bold text-foreground mb-6">What you'll learn</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Master the foundational concepts and best practices",
                  "Build practical projects to reinforce your learning",
                  "Understand advanced techniques used by professionals",
                  "Test your knowledge with AI-generated quizzes"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Floating Purchase Card */}
          <div className="lg:col-span-1 relative lg:-mt-32 z-30 animate-slide-up delay-400">
            <div className="rounded-2xl border border-card-border bg-surface-2 p-1 shadow-2xl shadow-black/50 sticky top-24 gradient-border pointer-events-auto">
              <div className="rounded-xl bg-card p-6 h-full w-full relative z-10 flex flex-col">
                <div className="mb-6 flex items-end justify-between border-b border-card-border pb-6">
                  <div>
                    <p className="text-sm text-muted font-medium mb-1">Price</p>
                    <p className="text-4xl font-extrabold text-foreground tracking-tight">
                      {course.price === 0 ? "Free" : `₹${course.price.toFixed(2)}`}
                    </p>
                  </div>
                </div>

                {/* Status or Enroll Button */}
                {isEnrolled ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-success-muted py-4 text-success border border-success/20 font-bold shadow-lg shadow-success/10 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Already Enrolled
                    </div>
                    <Link
                      href={`/courses/${courseId}/learn`}
                      className="btn-primary w-full flex justify-center text-center mt-3 py-4"
                    >
                      Go to Course Player
                    </Link>
                  </div>
                ) : (
                  <div className="mb-6">
                    {profile?.role === "teacher" || profile?.role === "master" ? (
                      <div className="text-center p-4 rounded-xl border border-warning/30 bg-warning/10 text-sm text-warning/90">
                        <Lock className="h-5 w-5 mx-auto mb-2 opacity-80" />
                        You are logged in as an instructor/admin. Only students can enroll in courses.
                      </div>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="btn-primary w-full py-4 text-base shadow-xl shadow-primary/20 flex items-center justify-center"
                      >
                        {enrolling ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Processing Enrollment...
                          </>
                        ) : (
                          "Enroll Now for Unlimited Access"
                        )}
                      </button>
                    )}
                    
                    {enrollError && (
                      <AlertBanner message={enrollError} variant="error" />
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted text-center uppercase tracking-wider mb-2">This course includes:</p>
                  <ul className="space-y-3 text-sm text-foreground/80">
                    <li className="flex items-center gap-3">
                      <PlayCircle className="h-4 w-4 text-muted" /> Unlimited video access
                    </li>
                    <li className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-muted" /> AI-generated practice quizzes
                    </li>
                    <li className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-muted" /> 30-day money-back guarantee
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
