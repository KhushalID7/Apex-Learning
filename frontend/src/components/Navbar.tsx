"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Compass,
  Library,
  Crown,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleConfig = {
    student: {
      icon: BookOpen,
      label: "Student",
      color: "text-primary",
      bg: "bg-primary-muted",
    },
    teacher: {
      icon: GraduationCap,
      label: "Teacher",
      color: "text-accent",
      bg: "bg-accent-muted",
    },
    master: {
      icon: Crown,
      label: "Admin",
      color: "text-warning",
      bg: "bg-warning-muted",
    },
  };

  const rc = roleConfig[profile?.role || "student"];
  const RoleIcon = rc.icon;

  const navLinks = [
    ...(profile?.role === "teacher"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/dashboard/courses", label: "My Courses", icon: Library },
          { href: "/courses", label: "Browse", icon: Compass },
        ]
      : profile?.role === "student"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/dashboard/learning", label: "My Learning", icon: BookOpen },
          { href: "/courses", label: "Browse", icon: Compass },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/courses", label: "Browse", icon: Compass },
        ]),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="glass-strong sticky top-0 z-50 border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent/80">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">
              AWT Learning
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const LinkIcon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "text-foreground bg-white/[0.06]"
                      : "text-muted hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-primary to-accent" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-full ${rc.bg} px-3 py-1.5 text-xs font-semibold ${rc.color}`}
            >
              <RoleIcon className="h-3.5 w-3.5" />
              {rc.label}
            </div>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border text-muted transition-all hover:text-foreground hover:bg-surface-2 hover:border-primary/30"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* User Avatar + Sign Out */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-xs font-bold text-foreground uppercase">
                {profile?.full_name?.charAt(0) || "?"}
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted transition-all hover:text-danger hover:bg-danger-muted"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden rounded-lg p-2 text-muted hover:text-foreground hover:bg-white/[0.05]"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.04] animate-slide-down">
            <nav className="flex flex-col p-3 gap-1">
              {navLinks.map((link) => {
                const LinkIcon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "text-foreground bg-white/[0.06]"
                        : "text-muted hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                  >
                    <LinkIcon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
