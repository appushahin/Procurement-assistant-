import React from "react";

export interface LanternLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  height?: number;
  animated?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: "standard" | "shimmer" | "monochrome";
  href?: string;
  target?: string;
  rel?: string;
}

export function LanternLogo({
  size = "md",
  height,
  animated = true,
  showTagline = false,
  className = "",
  variant = "standard",
  href = "https://www.lantern.com.sa/",
  target = "_blank",
  rel = "noopener noreferrer",
}: LanternLogoProps) {
  // Determine height based on size preset if explicit height not provided
  const heightPx =
    height ||
    (size === "sm" ? 28 : size === "md" ? 36 : size === "lg" ? 48 : 64);

  // Aspect ratio of full logo is approx 4.2 : 1
  const widthPx = Math.round(heightPx * 4.2);

  const innerContent = (
    <>
      <div className="relative flex items-center">
        {/* Radiant Red Glowing Radial Aura Backdrops */}
        <div
          className="pointer-events-none absolute -inset-x-10 -inset-y-7 -z-10 rounded-full opacity-85 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 45% 48%, rgba(239, 68, 68, 0.6) 0%, rgba(220, 38, 38, 0.38) 35%, rgba(185, 28, 28, 0.15) 65%, transparent 85%)",
          }}
        />
        <div
          className="pointer-events-none absolute -inset-3 -z-10 rounded-full opacity-70 group-hover:opacity-95 transition-opacity duration-500 blur-md"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(248, 113, 113, 0.55) 0%, rgba(225, 29, 72, 0.3) 45%, transparent 75%)",
          }}
        />

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
            {/* White Glow Beam Gradient */}
            <linearGradient
              id="lanternRedGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#F1F5F9" />
              <stop offset="75%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Glowing White Light Filter */}
            <filter id="lanternGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Shimmer overlay gradient */}
            <linearGradient id="lanternShimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="40%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* ============================================================ */}
          {/* LEFT GRAPHIC: Animated Perspective Node Matrix (Beam Array)   */}
          {/* ============================================================ */}
          <g className="lantern-matrix-group">
            {/* Column 1 (Far left silver-gray dots) */}
            <g className={animated ? "animate-logo-matrix-1" : ""}>
              <rect x="2" y="58" width="4" height="4" fill="#64748B" opacity="0.6" rx="0.5" />
              <rect x="6" y="50" width="4.5" height="4.5" fill="#64748B" opacity="0.7" rx="0.5" />
              <rect x="10" y="42" width="5" height="5" fill="#64748B" opacity="0.8" rx="0.5" />
              <rect x="14" y="34" width="5.5" height="5.5" fill="#64748B" opacity="0.8" rx="0.5" />
              <rect x="18" y="26" width="6" height="6" fill="#64748B" opacity="0.9" rx="0.5" />
              <rect x="22" y="18" width="6.5" height="6.5" fill="#64748B" opacity="0.9" rx="0.5" />
            </g>

            {/* Column 2 (Subtle cool silver dots) */}
            <g className={animated ? "animate-logo-matrix-2" : ""}>
              <rect x="8" y="62" width="4.5" height="4.5" fill="#94A3B8" opacity="0.7" rx="0.5" />
              <rect x="13" y="54" width="5" height="5" fill="#94A3B8" opacity="0.8" rx="0.5" />
              <rect x="18" y="45" width="5.5" height="5.5" fill="#94A3B8" opacity="0.85" rx="0.5" />
              <rect x="23" y="36" width="6" height="6" fill="#94A3B8" opacity="0.9" rx="0.5" />
              <rect x="28" y="27" width="6.5" height="6.5" fill="#94A3B8" opacity="0.95" rx="0.5" />
              <rect x="33" y="18" width="7" height="7" fill="#94A3B8" opacity="1" rx="0.5" />
            </g>

            {/* Column 3 (Bright Platinum dots) */}
            <g className={animated ? "animate-logo-matrix-3" : ""}>
              <rect x="16" y="66" width="5" height="5" fill="#CBD5E1" opacity="0.85" rx="0.5" />
              <rect x="22" y="57" width="5.5" height="5.5" fill="#CBD5E1" opacity="0.9" rx="0.5" />
              <rect x="28" y="48" width="6" height="6" fill="#CBD5E1" opacity="0.95" rx="0.5" />
              <rect x="34" y="38" width="6.5" height="6.5" fill="#CBD5E1" opacity="1" rx="0.5" />
              <rect x="40" y="28" width="7" height="7" fill="#CBD5E1" opacity="1" rx="0.5" />
            </g>

            {/* Column 4 (Pure White Core Array) */}
            <g className={animated ? "animate-logo-matrix-4" : ""}>
              <rect x="25" y="70" width="5.5" height="5.5" fill="#E2E8F0" rx="0.5" />
              <rect x="32" y="60" width="6" height="6" fill="#E2E8F0" rx="0.5" />
              <rect x="39" y="50" width="6.5" height="6.5" fill="#F8FAFC" rx="0.5" />
              <rect x="46" y="39" width="7" height="7" fill="#FFFFFF" rx="0.5" />
            </g>

            {/* Column 5 (Anchoring Brilliant White Glowing Nodes) */}
            <g className={animated ? "animate-logo-matrix-5" : ""}>
              <rect x="35" y="73" width="6" height="6" fill="#F1F5F9" rx="0.5" />
              <rect x="43" y="63" width="6.5" height="6.5" fill="#FFFFFF" rx="0.5" filter="url(#lanternGlow)" />
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
        <div className="mt-2 flex items-center animate-fadeIn">
          {/* Capsule Pill exactly matching the design in image.png */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/70 bg-zinc-950/70 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:border-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300">
            {/* Left Brand Identifier */}
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.24em] font-semibold text-zinc-300 uppercase">
              LANTERN
            </span>

            {/* Subtle Vertical Divider */}
            <span className="w-px h-6 bg-zinc-600/60" aria-hidden="true" />

            {/* Right 3-Tier Stacked Tagline */}
            <div className="flex flex-col text-[7px] sm:text-[7.5px] font-mono font-bold uppercase tracking-[0.22em] text-zinc-300 leading-[1.25] text-left">
              <span>PROCUREMENT</span>
              <span>GOVERNANCE &amp;</span>
              <span>INTELLIGENCE</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={`inline-flex flex-col items-start select-none group cursor-pointer transition-transform duration-200 hover:scale-[1.015] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded-2xl ${className}`}
        title="Visit Lantern Official Website (https://www.lantern.com.sa/)"
        aria-label="Visit Lantern Official Website (https://www.lantern.com.sa/)"
      >
        {innerContent}
      </a>
    );
  }

  return (
    <div
      className={`inline-flex flex-col items-start select-none group ${className}`}
      title="Lantern Procurement Intelligence"
    >
      {innerContent}
    </div>
  );
}
