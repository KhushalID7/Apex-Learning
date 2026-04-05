"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
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
        <div className="mesh-bg animate-pulse-glow" />
        
        <div className="relative z-10 flex max-w-md flex-col items-center text-center animate-slide-up">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/20">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-4 text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-lg text-muted">
            Continuing your educational journey with AWT Learning Platform.
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
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AWT Learning
            </h2>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
            <p className="mt-2 text-sm text-muted">Please enter your details to sign in.</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-card-border bg-card/60 backdrop-blur-md p-8 shadow-xl shadow-black/20">
            <form onSubmit={handleLogin} className="space-y-6">
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
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

            {/* Register link */}
            <p className="text-center text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary transition-colors hover:text-primary-hover">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
