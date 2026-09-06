import React, { useRef, useState, useCallback } from "react";
import { Check } from "lucide-react";

interface FluentSpotlightCardProps {
  id?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: {
    type: "success" | "warning" | "error" | "info" | "neutral";
    icon?: React.ReactNode;
    label?: string;
  };
  statusText?: string;
  onClick?: () => void;
  className?: string;
  spotlightColor?: string; // e.g. "rgba(59, 130, 246, 0.28)"
  borderColor?: string; // e.g. "rgba(96, 165, 250, 0.85)"
  active?: boolean;
}

export function FluentSpotlightCard({
  id,
  title,
  subtitle,
  icon,
  badge,
  statusText,
  onClick,
  className = "",
  spotlightColor = "rgba(59, 130, 246, 0.25)",
  borderColor = "rgba(96, 165, 250, 0.85)",
  active = false,
}: FluentSpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  return (
    <div
      ref={cardRef}
      id={id}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-xl p-4 sm:p-5 select-none cursor-pointer transition-all duration-300 overflow-hidden border ${
        active
          ? "bg-zinc-950/95 border-blue-500/90 shadow-[0_0_25px_rgba(59,130,246,0.35)]"
          : "bg-zinc-950/80 hover:bg-zinc-900/90 border-white/10 hover:border-white/20"
      } ${className}`}
      style={{
        transform: isHovered ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* 1. Dynamic Cursor Spotlight Background Radial Fill */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(260px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />

      {/* 2. Dynamic Border Reveal Highlight (Windows 11 Fluent Reveal Effect) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          padding: "1px",
          background: `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, ${borderColor}, rgba(255, 255, 255, 0.15) 40%, transparent 80%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* 3. Subtle ambient inner glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-70" />

      {/* Card Content Layout */}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Icon Header with Badge (Exact Windows Security layout) */}
        <div className="flex items-start justify-between">
          <div className="relative inline-flex items-center justify-center">
            {/* Base Icon Frame */}
            <div className="w-10 h-10 rounded-lg bg-blue-950/70 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:scale-105 transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
              {icon}
            </div>

            {/* Verification Status Badge (e.g. Green Check in bottom corner) */}
            {badge && (
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md border border-zinc-950 ${
                  badge.type === "success"
                    ? "bg-emerald-500 text-black shadow-emerald-500/40"
                    : badge.type === "warning"
                    ? "bg-amber-400 text-black shadow-amber-400/40"
                    : badge.type === "error"
                    ? "bg-rose-500 text-white shadow-rose-500/40"
                    : "bg-blue-500 text-white shadow-blue-500/40"
                }`}
              >
                {badge.icon ? (
                  badge.icon
                ) : badge.type === "warning" ? (
                  <span className="text-[10px] font-black leading-none">!</span>
                ) : (
                  <Check size={10} className="stroke-[3.5]" />
                )}
              </div>
            )}
          </div>

          {statusText && (
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 group-hover:text-zinc-200 transition-colors">
              {statusText}
            </span>
          )}
        </div>

        {/* Card Typography (Title + Subtitle) */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white tracking-tight group-hover:text-blue-200 transition-colors flex items-center gap-1.5">
            {title}
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
