import React, { useRef, useState, useCallback, ReactNode } from "react";

interface FluentSpotlightWrapperProps {
  children: ReactNode;
  id?: string;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
  spotlightRadius?: number;
  borderRadius?: string; // e.g. "rounded-2xl", "rounded-xl"
  disabled?: boolean;
  onClick?: () => void;
}

export function FluentSpotlightWrapper({
  children,
  id,
  className = "",
  spotlightColor = "rgba(59, 130, 246, 0.15)",
  borderColor = "rgba(96, 165, 250, 0.75)",
  spotlightRadius = 450,
  borderRadius = "rounded-2xl",
  disabled = false,
  onClick,
}: FluentSpotlightWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -2000, y: -2000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [disabled]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePos({ x: -2000, y: -2000 });
  }, []);

  return (
    <div
      ref={containerRef}
      id={id}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group ${borderRadius} transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* 1. Dynamic Cursor Radial Spotlight Background Fill */}
      {!disabled && (
        <div
          className={`pointer-events-none absolute -inset-px transition-opacity duration-300 ${borderRadius} -z-10`}
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(${spotlightRadius}px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 75%)`,
          }}
        />
      )}

      {/* 2. Dynamic Windows Fluent Border-Reveal Glow */}
      {!disabled && (
        <div
          className={`pointer-events-none absolute inset-0 ${borderRadius} transition-opacity duration-300 z-10`}
          style={{
            opacity: isHovered ? 1 : 0,
            padding: "1px",
            background: `radial-gradient(${Math.round(spotlightRadius * 0.75)}px circle at ${mousePos.x}px ${mousePos.y}px, ${borderColor}, rgba(255, 255, 255, 0.08) 35%, transparent 75%)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      )}

      {children}
    </div>
  );
}
