import React from "react";

interface LantraAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  isAnimated?: boolean;
  status?: "online" | "thinking" | "searching" | "offline";
  showStatusIndicator?: boolean;
  onClick?: () => void;
}

export function LantraAvatar({
  size = "md",
  className = "",
  isAnimated = true,
  status = "online",
  showStatusIndicator = true,
  onClick,
}: LantraAvatarProps) {
  // Dimensions mapping
  const sizeMap = {
    xs: { px: 28, viewBox: "0 0 200 200" },
    sm: { px: 36, viewBox: "0 0 200 200" },
    md: { px: 48, viewBox: "0 0 200 200" },
    lg: { px: 64, viewBox: "0 0 200 200" },
    xl: { px: 96, viewBox: "0 0 200 200" },
    hero: { px: 140, viewBox: "0 0 200 200" },
  };

  const { px } = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${
        onClick ? "cursor-pointer active:scale-95 transition-transform" : ""
      } ${className}`}
      style={{ width: px, height: px }}
      title="LANTRA — Autonomous AI Procurement & Market Intelligence Copilot"
    >
      {/* Outer Glow Halo for Hero & Large sizes */}
      {(size === "lg" || size === "xl" || size === "hero") && (
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-indigo-500/30 blur-md pointer-events-none -z-10 animate-pulse" />
      )}

      {/* SVG Vector Robot Assistant matching uploaded image */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.4)] border border-blue-400/30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Gradient matching image */}
          <linearGradient id="lantra-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e528e" />
            <stop offset="45%" stopColor="#133d6b" />
            <stop offset="100%" stopColor="#0c2545" />
          </linearGradient>

          {/* Ambient Lighting Rays in Background */}
          <linearGradient id="lantra-ray" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          {/* Head & Body Glossy White Gradient */}
          <radialGradient id="lantra-head-gloss" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>

          {/* Dark Glass Visor Screen */}
          <linearGradient id="lantra-visor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#020617" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          {/* Visor Glass Reflection */}
          <linearGradient id="lantra-glass-reflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Glowing Cyan Eye Matrix */}
          <linearGradient id="lantra-cyan-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Laptop Shell Gradient */}
          <linearGradient id="lantra-laptop-shell" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Filter for glowing cyan eyes */}
          <filter id="lantra-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Rich Background Canvas */}
        <rect width="200" height="200" fill="url(#lantra-bg)" />

        {/* Ambient Top-Left Light Streak (Exact from Image) */}
        <path
          d="M-20 -20 L90 220 L50 220 L-40 -20 Z"
          fill="url(#lantra-ray)"
          className={isAnimated ? "animate-pulse" : ""}
          style={{ animationDuration: "4s" }}
        />
        <path
          d="M30 -20 L160 220 L130 220 L10 -20 Z"
          fill="url(#lantra-ray)"
          opacity="0.5"
        />

        {/* 2. Robot Torso & Shoulders */}
        <g id="robot-body">
          {/* Shoulders */}
          <path
            d="M62 145 C62 135, 75 130, 100 130 C125 130, 138 135, 138 145 L145 190 L55 190 Z"
            fill="url(#lantra-head-gloss)"
          />
          {/* Torso Shading / Collar */}
          <path
            d="M80 132 C85 138, 115 138, 120 132 L115 145 C110 148, 90 148, 85 145 Z"
            fill="#64748b"
            opacity="0.4"
          />
          {/* Neck Joint */}
          <rect x="91" y="123" width="18" height="12" rx="4" fill="#334155" />
          <line x1="94" y1="127" x2="106" y2="127" stroke="#64748b" strokeWidth="1.5" />
          <line x1="94" y1="130" x2="106" y2="130" stroke="#64748b" strokeWidth="1.5" />
        </g>

        {/* 3. Ear Modules & Headset Band */}
        <g id="robot-ears">
          {/* Left Ear Cap */}
          <rect x="47" y="68" width="12" height="34" rx="6" fill="url(#lantra-head-gloss)" />
          <rect x="52" y="73" width="5" height="24" rx="2.5" fill="#475569" />

          {/* Right Ear Cap with Headset Base */}
          <rect x="141" y="68" width="12" height="34" rx="6" fill="url(#lantra-head-gloss)" />
          <rect x="143" y="73" width="5" height="24" rx="2.5" fill="#475569" />

          {/* Headset Boom Microphone Arm (Exact curve from image) */}
          <path
            d="M146 88 C146 115, 128 132, 104 130"
            stroke="#334155"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Microphone Tip Capsule */}
          <rect x="98" y="125" width="10" height="7" rx="3.5" fill="#1e293b" />
          <circle cx="106" cy="128.5" r="1.5" fill="#00f0ff" className={isAnimated ? "animate-ping" : ""} />
        </g>

        {/* 4. Glossy Robot Head Dome */}
        <g id="robot-head">
          {/* Main White Head Sphere */}
          <rect x="53" y="44" width="94" height="82" rx="41" fill="url(#lantra-head-gloss)" />

          {/* Head Top Specular Highlight */}
          <ellipse cx="88" cy="56" rx="20" ry="8" fill="#ffffff" opacity="0.8" />

          {/* Dark Curved Visor Screen */}
          <rect x="63" y="58" width="74" height="52" rx="22" fill="url(#lantra-visor)" />

          {/* Visor Inner Stroke Accent */}
          <rect
            x="64"
            y="59"
            width="72"
            height="50"
            rx="21"
            stroke="#1e293b"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Visor Glass Diagonal Glare */}
          <path
            d="M74 60 C90 60, 110 66, 120 78 L112 84 C104 74, 88 68, 76 68 Z"
            fill="url(#lantra-glass-reflection)"
          />

          {/* 5. Glowing Cyan Segmented Digital Eyes (Exact from attached picture) */}
          <g id="cyan-eyes" filter="url(#lantra-glow)">
            {/* Left Eye: Horizontal Digital Scan Lines */}
            <g className={isAnimated ? "animate-pulse" : ""} style={{ animationDuration: "2.5s" }}>
              <ellipse cx="82" cy="84" rx="11" ry="11" fill="none" stroke="url(#lantra-cyan-glow)" strokeWidth="1" opacity="0.3" />
              <rect x="73" y="77" width="18" height="2" rx="1" fill="url(#lantra-cyan-glow)" />
              <rect x="71" y="81" width="22" height="2.2" rx="1" fill="url(#lantra-cyan-glow)" />
              <rect x="71" y="85" width="22" height="2.2" rx="1" fill="url(#lantra-cyan-glow)" />
              <rect x="73" y="89" width="18" height="2" rx="1" fill="url(#lantra-cyan-glow)" />
            </g>

            {/* Right Eye: Horizontal Digital Scan Lines */}
            <g className={isAnimated ? "animate-pulse" : ""} style={{ animationDuration: "2.5s" }}>
              <ellipse cx="118" cy="84" rx="11" ry="11" fill="none" stroke="url(#lantra-cyan-glow)" strokeWidth="1" opacity="0.3" />
              <rect x="109" y="77" width="18" height="2" rx="1" fill="url(#lantra-cyan-glow)" />
              <rect x="107" y="81" width="22" height="2.2" rx="1" fill="url(#lantra-cyan-glow)" />
              <rect x="107" y="85" width="22" height="2.2" rx="1" fill="url(#lantra-cyan-glow)" />
              <rect x="109" y="89" width="18" height="2" rx="1" fill="url(#lantra-cyan-glow)" />
            </g>
          </g>
        </g>

        {/* 6. Foreground Modern White Laptop & Hands */}
        <g id="robot-laptop">
          {/* Laptop Screen Lid (Back view facing viewer) */}
          <path
            d="M52 148 L148 148 L144 200 L56 200 Z"
            fill="url(#lantra-laptop-shell)"
          />
          {/* Laptop Screen Bezel Top Line */}
          <line x1="52" y1="148" x2="148" y2="148" stroke="#ffffff" strokeWidth="2" />

          {/* Minimalist Glowing Binocular/Glasses Logo on Laptop Lid (Exact from user image) */}
          <g transform="translate(93, 172)" opacity="0.9">
            <rect x="0" y="2" width="6" height="6" rx="2" stroke="#64748b" strokeWidth="1.2" fill="none" />
            <rect x="8" y="2" width="6" height="6" rx="2" stroke="#64748b" strokeWidth="1.2" fill="none" />
            <line x1="5" y1="4" x2="9" y2="4" stroke="#64748b" strokeWidth="1.2" />
          </g>

          {/* Ambient Glow underneath laptop */}
          <ellipse cx="100" cy="198" rx="55" ry="4" fill="#0284c7" opacity="0.4" />
        </g>
      </svg>

      {/* Real-time Status Badge Indicator */}
      {showStatusIndicator && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-zinc-950 flex items-center justify-center ${
            size === "xs"
              ? "w-2.5 h-2.5"
              : size === "sm"
              ? "w-3 h-3"
              : size === "md"
              ? "w-3.5 h-3.5"
              : "w-4 h-4"
          } ${
            status === "online"
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
              : status === "thinking"
              ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-ping"
              : status === "searching"
              ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse"
              : "bg-zinc-500"
          }`}
        >
          {status === "thinking" && (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          )}
        </span>
      )}
    </div>
  );
}

export function LantraHeroCard({
  title = "LANTRA Procurement & Market Intelligence Copilot",
  subtitle = "Real-time enterprise RFQ evaluation, 5-year TCO analytics & Saudi market intelligence",
  onLaunch,
  className = "",
  lang = "en",
}: {
  title?: string;
  subtitle?: string;
  onLaunch?: () => void;
  className?: string;
  lang?: "en" | "ar";
}) {
  const isAr = lang === "ar";

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950/80 to-slate-950 border border-blue-500/30 p-5 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-5 ${className}`}
    >
      <div className="flex items-center gap-4.5">
        <LantraAvatar size="xl" status="online" isAnimated={true} />
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/20 text-cyan-300 border border-blue-400/40">
              LANTRA AI 3.7
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {isAr ? "متصل بالأسواق العالمية وأنظمة المشتريات السعودية" : "Market & Saudi Procurement Aware"}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-1">
            {isAr ? "لانـتـرا: المساعد الذكي للمشتريات وسلاسل الإمداد" : title}
          </h3>
          <p className="text-xs text-slate-300 max-w-xl mt-0.5 leading-relaxed">
            {isAr
              ? "تحليل فوري لعروض الموردين، حساب التكلفة الإجمالية (TCO)، التحقق من بوابات الامتثال، ومتابعة أخبار الأسواق والمحتوى المحلي (LCGPA/IKTVA) أولاً بأول."
              : subtitle}
          </p>
        </div>
      </div>

      {onLaunch && (
        <button
          onClick={onLaunch}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 border border-cyan-400/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <LantraAvatar size="xs" showStatusIndicator={false} />
          <span>{isAr ? "بدء المحادثة مع لانـتـرا" : "Talk with LANTRA"}</span>
        </button>
      )}
    </div>
  );
}
