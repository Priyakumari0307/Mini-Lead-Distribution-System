import React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ children, className = "", ...props }: LabelProps) {
  return (
    <label className={`text-sm font-medium text-foreground/80 ${className}`} {...props}>
      {children}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export function Input({ className = "", error, label, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <Label>{label}</Label>}
      <input
        className={`px-3.5 py-2.5 bg-card-bg text-foreground border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/40 focus:border-primary-color transition-all duration-200 ${
          error ? "border-red-500 focus:ring-red-500/20" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export function Textarea({ className = "", error, label, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <Label>{label}</Label>}
      <textarea
        className={`px-3.5 py-2.5 bg-card-bg text-foreground border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/40 focus:border-primary-color transition-all duration-200 ${
          error ? "border-red-500 focus:ring-red-500/20" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ className = "", error, label, options, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <select
          className={`w-full px-3.5 py-2.5 bg-card-bg text-foreground border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/40 focus:border-primary-color transition-all duration-200 appearance-none ${
            error ? "border-red-500 focus:ring-red-500/20" : ""
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
