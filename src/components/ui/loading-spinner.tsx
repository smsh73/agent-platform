"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

/**
 * Loading spinner component with optional label
 *
 * @example
 * <LoadingSpinner size="md" label="Loading data..." />
 * <LoadingSpinner fullScreen label="Generating slides..." />
 */
export function LoadingSpinner({
  size = "md",
  label,
  className,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen && "min-h-screen",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size])}
        aria-hidden="true"
      />
      {label && (
        <>
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="sr-only">{label}</span>
        </>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin", className)}
      aria-hidden="true"
    />
  );
}
