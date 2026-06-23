import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-caption font-medium text-text-secondary mb-1.5", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full h-10 rounded-md px-3 text-body",
        "bg-white/5 border border-border text-text-primary placeholder:text-text-muted",
        "focus:outline-none focus:border-accent-natal/50",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full h-10 rounded-md px-3 text-body appearance-none",
        "bg-[rgba(5,4,11,0.85)] border border-border text-text-primary",
        "focus:outline-none focus:border-accent-natal/50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {children}
    </div>
  );
}

export function FormGrid({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)} {...props}>
      {children}
    </div>
  );
}
