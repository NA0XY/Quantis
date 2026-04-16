import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap transition-transform focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:pointer-events-none disabled:opacity-50";
    
    // Variant styles
    const variants = {
      primary: "bg-primary border-2 border-ink shadow-nb rounded-[6px] font-semibold text-ink hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none",
      secondary: "bg-chalk border-2 border-ink shadow-nb-sm rounded-[6px] font-medium text-ink hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none",
      danger: "bg-red-400 border-2 border-ink shadow-nb-sm rounded-[6px] font-medium text-ink hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none",
    };

    // Size styles
    const sizes = {
      default: "px-6 py-3 text-base",
      sm: "px-4 py-2 text-sm",
      lg: "px-8 py-4 text-lg"
    };

    const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    // Normally asChild would use Radix Slot, but we'll stick to simple standard button
    return (
      <button
        ref={ref}
        className={combinedClasses}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
