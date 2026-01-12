import { cn } from "@/lib/utils";
import * as React from "react";

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation="horizontal"
    className={cn("h-px w-full bg-border", className)}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
