"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, Sparkles, BookOpen, GraduationCap, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Insert profile row
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: role,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Animation/Visual */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden border-r border-card-border bg-surface lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-50" />
        <div className="mesh-bg animate-pulse-glow delay-500" />
        
        <div className="relative z-10 flex max-w-md flex-col items-center text-center animate-slide-up">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/20">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-4 text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            Join the Community
          </h2>
          <p className="text-lg text-muted">
            Create an account to track progress, earn certificates, and master new skills.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-32 relative">
        <div className="mx-auto w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden text-center flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              AWT Learning
            </h2>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
            <p className="mt-2 text-sm text-muted">Get started by filling out your information below.</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-card-border bg-card/60 backdrop-blur-md p-8 shadow-xl shadow-black/20">
            <form onSubmit={handleRegister} className="space-y-6">
              
              {/* Role selector */}
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">
                  I want to...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                      role === "student"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-card-border bg-surface text-muted hover:border-primary/30 hover:bg-surface-2"
                    }`}
                  >
                    <BookOpen className={`h-6 w-6 ${role === "student" ? "text-primary" : "text-muted"}`} />
                    <span className="text-sm font-semibold text-foreground">Learn</span>
                    {role === "student" && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                      role === "teacher"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-card-border bg-surface text-muted hover:border-accent/30 hover:bg-surface-2"
                    }`}
                  >
                    <GraduationCap className={`h-6 w-6 ${role === "teacher" ? "text-accent" : "text-muted"}`} />
                    <span className="text-sm font-semibold text-foreground">Teach</span>
                    {role === "teacher" && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">✓</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className="h-4 w-4 text-muted" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-4 w-4 text-muted" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-4 w-4 text-muted" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger animate-slide-up">
                  <Lock className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: role === "teacher" 
                    ? "linear-gradient(135deg, var(--accent), #00a4cc)" 
                    : "linear-gradient(135deg, var(--primary), #6244e0)"
                }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create {role === "teacher" ? "Instructor" : "Student"} Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-card-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card/60 px-2 text-muted backdrop-blur-md">OR</span>
              </div>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary transition-colors hover:text-primary-hover">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
