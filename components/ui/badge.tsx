import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "allocated" | "pending" | "duplicate" | "rejected";
}

export function Badge({ children, className = "", variant = "neutral", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors duration-200 border";
  
  const variants = {
    neutral: "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
    success: "bg-green-100/80 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-900/50 dark:text-green-300",
    warning: "bg-amber-100/80 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300",
    danger: "bg-rose-100/80 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300",
    info: "bg-blue-100/80 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300",
    
    // Domain Specific
    allocated: "bg-emerald-100/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300",
    pending: "bg-amber-100/80 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300",
    duplicate: "bg-purple-100/80 border-purple-200 text-purple-800 dark:bg-purple-950/40 dark:border-purple-900/50 dark:text-purple-300",
    rejected: "bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
