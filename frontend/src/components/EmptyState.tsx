"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-card-border bg-card/30 p-12 text-center animate-fade-in relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 text-primary shadow-inner shadow-primary/20">
        {icon || <Sparkles className="h-10 w-10 animate-pulse" />}
      </div>
      <h3 className="relative mb-2 text-xl font-bold text-foreground">{title}</h3>
      <p className="relative mb-8 max-w-sm text-sm text-muted leading-relaxed">
        {description}
      </p>
      
      {actionLabel && (
        <div className="relative">
          {actionHref ? (
            <Link href={actionHref} className="btn-primary inline-flex">
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
