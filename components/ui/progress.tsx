import React from "react";

interface ProgressProps {
  value: number; // Current value
  max: number; // Max value
  className?: string;
  showLabels?: boolean;
}

export function Progress({ value, max, className = "", showLabels = false }: ProgressProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  
  // Decide color based on percentage
  let barColor = "bg-emerald-500";
  if (percentage >= 90) {
    barColor = "bg-rose-500";
  } else if (percentage >= 70) {
    barColor = "bg-amber-500";
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {value} of {max} used
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            {percentage}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
