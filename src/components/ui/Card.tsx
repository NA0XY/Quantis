import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadowSize?: "sm" | "default" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", shadowSize = "default", ...props }, ref) => {
    const shadows = {
      sm: "shadow-nb-sm",
      default: "shadow-nb",
      lg: "shadow-nb-lg"
    };

    return (
      <div
        ref={ref}
        className={`bg-chalk border-2 border-ink rounded-[6px] ${shadows[shadowSize]} p-5 ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
