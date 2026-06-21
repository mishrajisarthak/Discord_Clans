"use client";

import React, { useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion";

const COLORS = ["#4f46e5", "#7c3aed", "#2563eb", "#db2777"]; // Neon indigo, purple, blue, pink

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export default function AuroraBackground({
  children,
  className = "",
}: AuroraBackgroundProps) {
  const color = useMotionValue(COLORS[0]);
  
  // Creates a dynamic background gradient that shifts colors
  const backgroundImage = useMotionTemplate`radial-gradient(130% 130% at 50% 0%, #030712 55%, ${color}20, #030712 100%)`;

  useEffect(() => {
    animate(color, COLORS, {
      duration: 16,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    });
  }, [color]);

  return (
    <motion.div
      style={{ backgroundImage }}
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] text-slate-100 ${className}`}
    >
      {/* Mesh Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}
