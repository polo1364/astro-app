import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import type { HTMLAttributes } from "react";

type AlertVariant = "info" | "success" | "error";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const config: Record<AlertVariant, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  success: { icon: CheckCircle, className: "border-green-500/30 bg-green-500/10 text-green-300" },
  error: { icon: AlertCircle, className: "border-red-500/30 bg-red-500/10 text-red-300" },
};

export function Alert({ variant = "info", title, children, className, ...props }: AlertProps) {
  const { icon: Icon, className: variantClass } = config[variant];
  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-md border p-3 text-sm", variantClass, className)}
      {...props}
    >
      <Icon className="size-4 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div className="text-text-secondary">{children}</div>
      </div>
    </div>
  );
}
