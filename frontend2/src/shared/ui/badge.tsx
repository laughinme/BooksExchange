import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 be-shadow-badge",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/15 text-primary shadow-inner",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-red-500/40 bg-red-500/15 text-red-100",
        outline: "border-border text-foreground",
        muted: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
