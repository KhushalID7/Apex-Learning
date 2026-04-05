"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getTeacherStats, getEnrolledCourses, type TeacherStats, type Course } from "@/lib/courseApi";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import LoadingScreen from "@/components/LoadingScreen";
import { BookOpen, Users, Compass, Library, LineChart, Award, BookCopy, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { user, profile, loading, session } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (session?.access_token && profile?.role === "teacher") {
      fetchStats();
    } else if (session?.access_token && profile?.role === "student") {
      fetchStudentStats();
    }
  }, [session, profile]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getTeacherStats(session!.access_token);
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getEnrolledCourses(session!.access_token);
      setStudentCourses(data || []);
    } catch (err) {
      console.error("Failed to fetch student courses", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return <LoadingScreen message="Loading dashboard…" />;
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome Section */}
        <div className="relative mb-10 rounded-3xl border border-card-border bg-card/40 p-10 overflow-hidden shadow-2xl animate-fade-in">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-accent/10 blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {getGreeting()}, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{profile.full_name.split(' ')[0]}</span>
            </h1>
            <p className="mt-3 text-lg text-muted max-w-2xl">
              {profile.role === "teacher" 
                ? "Here is what's happening with your courses today." 
                : "Ready to pick up where you left off?"}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {profile.role === "teacher" ? (
            <>
              <StatCard 
                label="Courses Created" 
                value={statsLoading ? "..." : stats?.total_courses || "0"} 
                icon={<BookCopy className="h-6 w-6" />} 
              />
              <StatCard 
                label="Total Students" 
                value={statsLoading ? "..." : stats?.total_enrollments || "0"} 
                icon={<Users className="h-6 w-6" />} 
                trend="15%" 
                trendUp={true} 
              />
              <StatCard 
                label="Revenue" 
                value={statsLoading ? "..." : `₹${stats?.total_revenue || "0"}`} 
                icon={<span className="font-bold text-xl">₹</span>} 
              />
              <StatCard 
                label="Avg. Engagement" 
                value={statsLoading ? "..." : `${stats?.average_engagement || "0"}%`} 
                icon={<LineChart className="h-6 w-6" />} 
              />
            </>
          ) : (
            <>
              <StatCard 
                label="Enrolled Courses" 
                value={statsLoading ? "..." : studentCourses.length.toString()} 
                icon={<BookOpen className="h-6 w-6" />} 
              />
              <StatCard 
                label="Completed" 
                value="0" 
                icon={<Award className="h-6 w-6" />} 
              />
              <StatCard 
                label="Certificates" 
                value="0" 
                icon={<Award className="h-6 w-6" />} 
              />
              <StatCard 
                label="Learning Points" 
                value="0" 
                icon={<Sparkles className="h-6 w-6" />} 
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.role === "teacher" && (
              <Link href="/dashboard/courses" className="card-hover group flex items-center gap-5 rounded-2xl border border-card-border bg-card/60 p-6 animate-slide-up delay-100">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary transition-colors group-hover:from-primary/20 group-hover:to-accent/20">
                  <Library className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Manage Courses</h3>
                  <p className="text-sm text-muted">Create or edit your courses</p>
                </div>
              </Link>
            )}
            
            {profile.role === "student" && (
              <Link href="/dashboard/learning" className="card-hover group flex items-center gap-5 rounded-2xl border border-card-border bg-card/60 p-6 animate-slide-up delay-100">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/10 to-blue-500/10 text-accent transition-colors group-hover:from-accent/20 group-hover:to-blue-500/20">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-accent transition-colors">My Learning</h3>
                  <p className="text-sm text-muted">Continue your enrolled courses</p>
                </div>
              </Link>
            )}

            <Link href="/courses" className="card-hover group flex items-center gap-5 rounded-2xl border border-card-border bg-card/60 p-6 animate-slide-up delay-200">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-purple-400 transition-colors group-hover:from-purple-500/20 group-hover:to-pink-500/20">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground group-hover:text-purple-400 transition-colors">Discover Catalog</h3>
                <p className="text-sm text-muted">Find new skills to learn</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Analytics Charts */}
        {profile.role === "teacher" && stats && !statsLoading && (
          <div className="relative z-10">
            <AnalyticsCharts stats={stats} />
          </div>
        )}
      </main>
    </div>
  );
}
