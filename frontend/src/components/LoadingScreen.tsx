"use client";

import { Sparkles } from "lucide-react";

export default function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/20">
          <Sparkles className="h-8 w-8 text-white animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted animate-pulse">{message}</p>
    </div>
  );
}
