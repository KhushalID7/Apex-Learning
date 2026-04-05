"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, XCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertBannerProps {
  message: string;
  variant?: AlertVariant;
  onClose?: () => void;
  autoDismiss?: boolean;
  className?: string;
}

export default function AlertBanner({ message, variant = "info", onClose, autoDismiss = false, className = "" }: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => handleClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, isVisible]);

  if (!message) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300); // Wait for transition
  };

  const variants = {
    success: { icon: CheckCircle2, classes: "bg-success-muted border-success/30 text-success" },
    error: { icon: XCircle, classes: "bg-danger-muted border-danger/30 text-danger" },
    warning: { icon: AlertCircle, classes: "bg-warning-muted border-warning/30 text-warning" },
    info: { icon: Info, classes: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative mb-6 flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md ${config.classes} ${className}`}
        >
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-md p-1 opacity-70 transition-colors hover:bg-black/10 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
