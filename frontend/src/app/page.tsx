"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") setBackendStatus("connected");
        else setBackendStatus("error");
      })
      .catch(() => setBackendStatus("error"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/8 blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[130px]" />
      </div>

      <div className="relative text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-card-border bg-card/60 px-4 py-1.5 text-xs text-muted backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
          </span>
          Now in active development
        </div>

        {/* Hero */}
        <h1 className="text-6xl font-bold tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite]">
            AWT Learning
          </span>
          <br />
          <span className="text-foreground">Platform</span>
        </h1>

        <p className="mx-auto mt-6 max-w-md text-lg text-muted leading-relaxed">
          A modern platform for students and teachers — courses, video lectures, AI quizzes, and certificates.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            Get Started
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-card-border px-8 py-3.5 text-sm font-medium text-muted transition-all hover:border-primary/30 hover:text-foreground hover:bg-card/50"
          >
            Sign In
          </Link>
        </div>

        {/* Backend status */}
        <div className="mt-12 inline-flex items-center gap-2 rounded-lg border border-card-border bg-card/40 px-4 py-2 text-xs backdrop-blur-sm">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              backendStatus === "connected"
                ? "bg-success shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                : backendStatus === "error"
                ? "bg-danger shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                : "bg-yellow-400 animate-pulse"
            }`}
          />
          <span className="text-muted">
            {backendStatus === "connected"
              ? "Backend connected"
              : backendStatus === "error"
              ? "Backend offline"
              : "Checking…"}
          </span>
        </div>
      </div>
    </div>
  );
}
