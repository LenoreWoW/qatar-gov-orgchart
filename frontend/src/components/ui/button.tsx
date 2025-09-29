import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-qatar-maroon focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-qatar-maroon text-white hover:bg-qatar-maroon/90 shadow-md hover:shadow-lg",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-qatar-maroon/30 bg-white hover:bg-qatar-maroon/5 text-qatar-maroon",
        secondary: "bg-qatar-gold/20 text-qatar-maroon hover:bg-qatar-gold/30",
        ghost: "hover:bg-qatar-maroon/10 hover:text-qatar-maroon",
        link: "text-qatar-maroon underline-offset-4 hover:underline",
        qatar: "bg-gradient-to-r from-qatar-maroon to-qatar-maroon/80 text-white hover:from-qatar-maroon/90 hover:to-qatar-maroon/70 shadow-lg",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };