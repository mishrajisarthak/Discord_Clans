"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxRotate?: number;
}

export default function TiltedCard({
  children,
  className = "",
  maxRotate = 12,
}: TiltedCardProps) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 120, damping: 12 };
  
  // Maps 0-1 coordinate range to rotational angles
  const rotateX = useSpring(useTransform(y, [0, 1], [maxRotate, -maxRotate]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxRotate, maxRotate]), springConfig);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates to 0 - 1 range
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width);
    y.set(mouseY / height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <div className="perspective-1000 w-full">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative h-full w-full rounded-2xl transition-all duration-300 ${className}`}
      >
        <div 
          style={{ 
            transform: "translateZ(25px)", 
            transformStyle: "preserve-3d" 
          }} 
          className="h-full w-full"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
