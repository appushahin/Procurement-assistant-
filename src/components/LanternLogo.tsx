import React from "react";

export interface LanternLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  height?: number;
  animated?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: "standard" | "shimmer" | "monochrome";
}

export function LanternLogo({
  size = "md",
  height,
  animated = true,
  showTagline = false,
  className = "",
  variant = "standard",
}: LanternLogoProps) {
  // Determine height based on size preset if explicit height not provided
  const heightPx =
    height ||
    (size === "sm" ? 28 : size === "md" ? 36 : size === "lg" ? 48 : 64);

  // Aspect ratio of full logo is approx 4.2 : 1
  const widthPx = Math.round(heightPx * 4.2);

  return (
    <div
      className={`inline-flex flex-col items-start select-none group ${className}`}
      title="Lantern Procurement Intelligence"
    >
      <div className="relative flex items-center">
        {/* SVG Live Animated Lantern Logo */}
        <svg
          width={widthPx}
          height={heightPx}
          viewBox="0 0 380 85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible transition-transform duration-300 group-hover:scale-[1.02]"
        >
          <defs>
            {/* Red Beam Gradient */}
            <linearGradient
              id="lanternRedGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#EE1C25" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>

            {/* Glowing Red Filter */}
            <filter id="lanternGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Shimmer overlay gradient */}
            <linearGradient id="lanternShimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EE1C25" />
              <stop offset="40%" stopColor="#F87171" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#EE1C25" />
            </linearGradient>
          </defs>

          {/* ============================================================ */}
          {/* LEFT GRAPHIC: Animated Perspective Node Matrix (Beam Array)   */}
          {/* ============================================================ */}
          <g className="lantern-matrix-group">
            {/* Column 1 (Far left silver dots) */}
            <g className={animated ? "animate-logo-matrix-1" : ""}>
              <rect x="2" y="58" width="4" height="4" fill="#9CA3AF" opacity="0.6" rx="0.5" />
              <rect x="6" y="50" width="4.5" height="4.5" fill="#9CA3AF" opacity="0.7" rx="0.5" />
              <rect x="10" y="42" width="5" height="5" fill="#9CA3AF" opacity="0.8" rx="0.5" />
              <rect x="14" y="34" width="5.5" height="5.5" fill="#9CA3AF" opacity="0.8" rx="0.5" />
              <rect x="18" y="26" width="6" height="6" fill="#9CA3AF" opacity="0.9" rx="0.5" />
              <rect x="22" y="18" width="6.5" height="6.5" fill="#9CA3AF" opacity="0.9" rx="0.5" />
            </g>

            {/* Column 2 (Pinkish transition dots) */}
            <g className={animated ? "animate-logo-matrix-2" : ""}>
              <rect x="8" y="62" width="4.5" height="4.5" fill="#F43F5E" opacity="0.7" rx="0.5" />
              <rect x="13" y="54" width="5" height="5" fill="#F43F5E" opacity="0.8" rx="0.5" />
              <rect x="18" y="45" width="5.5" height="5.5" fill="#F43F5E" opacity="0.85" rx="0.5" />
              <rect x="23" y="36" width="6" height="6" fill="#F43F5E" opacity="0.9" rx="0.5" />
              <rect x="28" y="27" width="6.5" height="6.5" fill="#F43F5E" opacity="0.95" rx="0.5" />
              <rect x="33" y="18" width="7" height="7" fill="#F43F5E" opacity="1" rx="0.5" />
            </g>

            {/* Column 3 (Vivid Red dots) */}
            <g className={animated ? "animate-logo-matrix-3" : ""}>
              <rect x="16" y="66" width="5" height="5" fill="#EE1C25" opacity="0.85" rx="0.5" />
              <rect x="22" y="57" width="5.5" height="5.5" fill="#EE1C25" opacity="0.9" rx="0.5" />
              <rect x="28" y="48" width="6" height="6" fill="#EE1C25" opacity="0.95" rx="0.5" />
              <rect x="34" y="38" width="6.5" height="6.5" fill="#EE1C25" opacity="1" rx="0.5" />
              <rect x="40" y="28" width="7" height="7" fill="#EE1C25" opacity="1" rx="0.5" />
            </g>

            {/* Column 4 (Bright Red Core Array) */}
            <g className={animated ? "animate-logo-matrix-4" : ""}>
              <rect x="25" y="70" width="5.5" height="5.5" fill="#DC2626" rx="0.5" />
              <rect x="32" y="60" width="6" height="6" fill="#DC2626" rx="0.5" />
              <rect x="39" y="50" width="6.5" height="6.5" fill="#DC2626" rx="0.5" />
              <rect x="46" y="39" width="7" height="7" fill="#DC2626" rx="0.5" />
            </g>

            {/* Column 5 (Anchoring Red Nodes) */}
            <g className={animated ? "animate-logo-matrix-5" : ""}>
              <rect x="35" y="73" width="6" height="6" fill="#B91C1C" rx="0.5" />
              <rect x="43" y="63" width="6.5" height="6.5" fill="#EE1C25" rx="0.5" filter="url(#lanternGlow)" />
            </g>
          </g>

          {/* ============================================================ */}
          {/* BRAND WORDMARK: "Lantern" Futuristic Geometric Vector Paths  */}
          {/* ============================================================ */}
          <g filter={animated ? "url(#lanternGlow)" : undefined}>
            {/* 'L' - Iconic tall left stem wrapping under letter 'a' */}
            <path
              d="M 52 2 H 68 V 62 H 98 V 78 H 52 Z"
              fill="url(#lanternRedGradient)"
            />

            {/* 'a' - Rounded futuristic loop */}
            <path
              d="M 104 26 C 104 22 108 18 114 18 H 138 C 144 18 148 22 148 26 V 78 H 134 V 68 C 130 75 122 80 114 80 C 106 80 104 74 104 66 V 26 Z M 118 32 V 64 H 134 V 32 H 118 Z"
              fill={variant === "shimmer" ? "url(#lanternShimmerGrad)" : "url(#lanternRedGradient)"}
            />

            {/* 'n' - First arch */}
            <path
              d="M 156 20 H 170 V 30 C 174 23 182 18 192 18 C 200 18 204 22 204 30 V 78 H 188 V 36 C 188 32 185 30 180 30 C 175 30 172 33 172 38 V 78 H 156 V 20 Z"
              fill="url(#lanternRedGradient)"
            />

            {/* 't' - Distinct tall crossbar top stem */}
            <path
              d="M 218 2 H 234 V 18 H 252 V 32 H 234 V 62 C 234 66 236 68 242 68 H 252 V 80 H 238 C 224 80 218 72 218 60 V 32 H 210 V 18 H 218 V 2 Z"
              fill="url(#lanternRedGradient)"
            />

            {/* 'e' - Rounded loop with horizontal center bar */}
            <path
              d="M 258 26 C 258 20 264 18 274 18 H 296 C 304 18 308 22 308 30 V 46 H 272 V 66 C 272 68 274 70 278 70 H 308 V 80 H 274 C 262 80 258 72 258 60 V 26 Z M 272 36 H 294 V 30 C 294 28 292 26 288 26 H 278 C 274 26 272 28 272 30 V 36 Z"
              fill="url(#lanternRedGradient)"
            />

            {/* 'r' - Sleek curved shoulder */}
            <path
              d="M 316 20 H 332 V 34 C 336 24 344 18 354 18 H 358 V 34 C 352 34 346 36 342 40 C 338 44 332 50 332 58 V 78 H 316 V 20 Z"
              fill="url(#lanternRedGradient)"
            />

            {/* 'n' - Final arch */}
            <path
              d="M 364 20 H 378 V 30 C 382 23 390 18 400 18 C 408 18 412 22 412 30 V 78 H 396 V 36 C 396 32 393 30 388 30 C 383 30 380 33 380 38 V 78 H 364 V 20 Z"
              fill="url(#lanternRedGradient)"
            />
          </g>
        </svg>
      </div>

      {showTagline && (
        <div className="mt-1.5 flex items-center gap-1.5 animate-fadeIn">
          {/* Red-White Waving Animated Ribbon Container */}
          <div className="relative group/tagline overflow-hidden rounded-full p-[1.5px] shadow-lg shadow-red-600/20">
            {/* Animated Waving Red and White Gradient Wave */}
            <div className="absolute inset-0 red-white-wave-bg opacity-95 rounded-full animate-wave-flow"></div>

            {/* Inner Translucent Pill for Crisp Typography and High Legibility */}
            <div className="relative px-3 py-0.5 rounded-full bg-zinc-950/75 backdrop-blur-md flex items-center gap-2 transition-all duration-300 group-hover/tagline:bg-zinc-950/60">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-200 to-red-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                LANTERN
              </span>
              <span className="w-1 h-1 rounded-full bg-red-400 animate-ping"></span>
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] font-bold text-zinc-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                PROCUREMENT GOVERNANCE & INTELLIGENCE
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
