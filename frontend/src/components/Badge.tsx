"use client";

import { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "accent" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-surface-2 text-muted border-card-border",
    primary: "bg-primary-muted text-primary border-primary/20",
    accent: "bg-accent-muted text-accent border-accent/20",
    success: "bg-success-muted text-success border-success/20",
    warning: "bg-warning-muted text-warning border-warning/20",
    danger: "bg-danger-muted text-danger border-danger/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
