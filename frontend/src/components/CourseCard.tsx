"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import Badge from "@/components/Badge";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  instructor?: string;
  price?: number;
  isEnrolled?: boolean;
  status?: "published" | "draft";
  href: string;
}

export default function CourseCard({
  title, description, thumbnailUrl, instructor, price, isEnrolled, status, href
}: CourseCardProps) {
  return (
    <Link href={href} className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card animate-fade-in relative z-10 w-full h-full shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-surface-2 shrink-0">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-12 w-12 text-muted/30" />
          </div>
        )}

        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isEnrolled && <Badge variant="success">Enrolled</Badge>}
          {status === "published" ? <Badge variant="success">Published</Badge> : status === "draft" ? <Badge variant="warning">Draft</Badge> : null}
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground font-display group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted">
          {description || "No description provided."}
        </p>
        
        <div className="mt-auto flex items-end justify-between border-t border-card-border/50 pt-4">
          <div>
            {instructor && <p className="text-xs text-muted mb-1 truncate max-w-[150px]">{instructor}</p>}
            {price !== undefined && (
              <p className="text-xl font-bold text-foreground">
                {price === 0 ? "Free" : `₹${price.toFixed(2)}`}
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
