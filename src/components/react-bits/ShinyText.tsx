"use client";

import React from "react";

interface ShinyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string;
  className?: string;
  speed?: number;
}

export default function ShinyText({
  children,
  className = "",
  speed = 3,
  ...props
}: ShinyTextProps) {
  return (
    <span
      className={`inline-block shiny-text ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
