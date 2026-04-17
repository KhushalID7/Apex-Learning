"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Brain, BookOpen, GraduationCap, ChevronRight, Activity, CheckCircle2 } from "lucide-react";

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
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
    fetch(`${baseUrl}/health`)
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
    },
    {
      icon: <BookOpen className="h-6 w-6 text-accent" />,
      title: "Interactive Learning",
      desc: "Immersive video player, rich reading experiences, and real-time tracking.",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-primary" />,
      title: "Verified Certifications",
      desc: "Earn verified certificates automatically upon successful course completion.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background overflow-x-hidden">
      
      {/* Top Navbar */}
      <header className="bg-card w-full z-50 border-b border-card-border shadow-sm fixed top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          
          {/* 1. Logo on left */}
          <div className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground font-display">AWT Learning</span>
          </div>

          {/* 2. Navigation links in center */}
          <nav className="hidden md:flex gap-8 text-sm font-medium text-muted">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#courses" className="hover:text-primary transition-colors">Courses</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>

          {/* 3. CTA button on right */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors hidden sm:inline-flex">Sign In</Link>
            <Link href="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Split Layout */}
      <section className="relative mt-24 flex w-full max-w-7xl items-center px-6 py-16 md:py-24 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left Text */}
          <div className="flex flex-col text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-muted bg-primary-muted/50 px-4 py-1.5 text-sm font-medium text-primary w-max">
              <Sparkles className="h-4 w-4" />
              The future of education is here
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground font-display leading-[1.1]">
              Master new skills with <br/>
              <span className="text-primary">AWT Platform</span>
            </h1>

            <p className="mt-6 text-lg text-muted md:text-xl leading-relaxed max-w-lg font-sans">
              A premium learning ecosystem designed for seamless education. 
              Discover expert courses, validate your knowledge, and accelerate your career.
            </p>

            <ul className="mt-6 space-y-3">
              {['Industry-expert instructors', 'Lifetime access to materials', 'Interactive coding environments'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-light font-medium">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link href="/courses" className="btn-primary text-lg px-8 py-3.5">
                Explore Courses
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link href="/register" className="btn-ghost text-lg px-8 py-3.5">
                Join as Instructor
              </Link>
            </div>
            
            {/* Backend Status Indicator */}
            <div className="mt-8 flex items-center gap-2 text-xs">
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
          </div>

          {/* Right Image */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-card-border group">
            <img 
              src="/hero-image.jpeg" 
              alt="AWT Learning Dashboard Preview" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

        </div>
      </section>

      {/* Content Sections (Grids & Panels) */}
      <section id="features" className="w-full bg-surface-2 border-t border-card-border overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-4">Why choose our platform?</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">Built from the ground up to provide the best learning experience, combining powerful tools with elegant design.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className={`bg-card rounded-2xl border border-card-border p-8 card-hover flex flex-col items-start shadow-sm animate-slide-up delay-${(idx + 1) * 100}`}>
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted text-primary`}>
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground font-display">{feature.title}</h3>
                <p className="text-muted leading-relaxed font-sans">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full border-t border-card-border bg-card py-10 mt-auto">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row justify-between items-center text-muted">
          <p className="text-sm">© 2026 AWT Learning. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0 text-sm font-medium">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
