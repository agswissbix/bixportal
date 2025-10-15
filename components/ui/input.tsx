import type * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
        "border-gray-300 h-9 w-full min-w-0 rounded-md border bg-background px-3 py-1 text-base shadow-sm",
        "transition-all duration-200 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Hover state
        "hover:border-primary",
        // Focus state with gradient accent
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:shadow-[0_1px_0_0_hsl(var(--primary))]",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:ring-destructive",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
