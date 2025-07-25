import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          {
            "border-transparent bg-orange-500 text-white hover:bg-orange-600":
              variant === "default",
            "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200":
              variant === "secondary",
            "border-transparent bg-red-500 text-white hover:bg-red-600":
              variant === "destructive",
            "text-gray-700 border-gray-300 hover:bg-gray-50":
              variant === "outline",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
