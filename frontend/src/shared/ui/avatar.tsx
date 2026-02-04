import * as React from "react";

import { cn } from "@/shared/lib/utils";

type AvatarProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: React.ReactNode;
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted",
          className,
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">
            {fallback}
          </span>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
