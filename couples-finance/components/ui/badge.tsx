import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
}

const Badge = ({ className, color, children, ...props }: BadgeProps) => (
  <span
    className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
    style={color ? { backgroundColor: color + "22", color } : undefined}
    {...props}
  >
    {children}
  </span>
);

export { Badge };
