"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Brain, BookOpen, GraduationCap, ChevronRight, Activity } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "error">("checking");

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/health")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.status === "ok") setBackendStatus("connected");
        else setBackendStatus("error");
      })
      .catch(() => setBackendStatus("error"));
  }, []);

  const features = [
    {
      icon: <Brain className="h-6 w-6 text-primary" />,
      title: "AI-Powered Quizzes",
      desc: "Instant assessment generation tailored to course material and student progress.",
      color: "from-primary/20 to-transparent",
    },
    {
      icon: <BookOpen className="h-6 w-6 text-accent" />,
      title: "Interactive Learning",
      desc: "Immersive video player, rich markdown reading, and progress tracking.",
      color: "from-accent/20 to-transparent",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-warning" />,
      title: "Certifications",
      desc: "Earn verified certificates automatically upon successful course completion.",
      color: "from-warning/20 to-transparent",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center overflow-x-hidden">
      {/* Mesh Background */}
      <div className="mesh-bg animate-pulse-glow" />

      {/* Navbar (Landing) */}
      <header className="glass-strong fixed top-0 w-full z-50 border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AWT Learning</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign In</Link>
            <Link href="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mt-32 flex w-full max-w-7xl flex-col items-center justify-center px-6 py-20 text-center animate-slide-up">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md transition-transform hover:scale-105">
          <Sparkles className="h-4 w-4" />
          The future of education is here
        </div>

        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
          Master new skills with{" "}
          <span className="gradient-text-animated block sm:inline mt-2 sm:mt-0">
            AWT Platform
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg text-muted md:text-xl leading-relaxed">
          A premium learning ecosystem designed for seamless education. 
          Discover expert courses, test your knowledge with AI quizzes, and accelerate your career.
        </p>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/courses" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
            Explore Courses
            <ChevronRight className="h-5 w-5" />
          </Link>
          <Link href="/register" className="btn-ghost text-lg px-8 py-4">
            Join as Instructor
          </Link>
        </div>

        {/* Backend Status Indicator */}
        <div className="mt-16 flex items-center justify-center gap-2 rounded-full border border-card-border bg-card/60 px-4 py-2 text-xs backdrop-blur-md">
          <Activity className={`h-4 w-4 ${
            backendStatus === "connected" ? "text-success" : 
            backendStatus === "error" ? "text-danger" : "text-warning animate-pulse"
          }`} />
          <span className="text-muted font-medium">
            System Status: {
              backendStatus === "connected" ? "Operational" : 
              backendStatus === "error" ? "Offline" : "Connecting..."
            }
          </span>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, idx) => (
            <div key={idx} className={`group rounded-3xl border border-card-border bg-card/40 p-8 backdrop-blur-md transition-all hover:bg-card/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/5 animate-slide-up delay-${(idx + 1) * 100}`}>
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} border border-white/5`}>
                {feature.icon}
              </div>
              <h3 className="mb-4 text-xl font-bold text-foreground">{feature.title}</h3>
              <p className="text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full border-t border-card-border bg-background py-10 mt-auto">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row justify-between items-center opacity-60">
          <p className="text-sm text-muted">© 2026 AWT Learning. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0 text-sm font-medium text-muted">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
