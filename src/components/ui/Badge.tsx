import * as React from "react";

export type BadgeProps = React.HTMLAttributes<HTMLDivElement>;

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center border-2 border-ink rounded-[4px] px-2 py-0.5 font-mono text-xs font-semibold bg-chalk text-ink shadow-nb-sm ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
