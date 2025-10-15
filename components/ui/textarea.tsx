import type * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-gray-300 placeholder:text-muted-foreground dark:bg-input/30",
        "flex field-sizing-content min-h-16 w-full rounded-md border bg-background px-3 py-2 text-base shadow-sm",
        "transition-all duration-200 outline-none",
        // Hover state
        "hover:border-primary",
        // Focus state with gradient accent
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:shadow-[0_1px_0_0_hsl(var(--primary))]",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:ring-destructive",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
