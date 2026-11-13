import React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  useCurrentColor?: boolean;
}

const OPACITIES = [
  0.08, 0.16, 0.25, 0.33, 0.42, 0.5, 0.58, 0.67, 0.75, 0.83, 0.92, 1.0,
];

const COLORS = [
  "#ECF2FF",
  "#D8E4FF",
  "#C4D6FE",
  "#B1C9FE",
  "#9EBCFE",
  "#89ADFD",
  "#76A0FD",
  "#6393FD",
  "#5086FD",
  "#3C78FD",
  "#286AFC",
  "#155DFC",
];

export function Spinner({
  size = "md",
  className,
  useCurrentColor = false,
  ...props
}: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("animate-spin shrink-0", sizes[size], className)}
      fill="none"
      role="status"
      aria-label="Loading"
      {...props}
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = i * 30;
        return (
          <rect
            key={i}
            x="45"
            y="12"
            width="10"
            height="24"
            rx="5"
            fill={useCurrentColor ? "currentColor" : COLORS[i]}
            opacity={useCurrentColor ? OPACITIES[i] : 1}
            transform={`rotate(${angle} 50 50)`}
          />
        );
      })}
    </svg>
  );
}
